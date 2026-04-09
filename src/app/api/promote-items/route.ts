import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { spawnFrConfig, getConfigDir, getEnvFileContent } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";
import type { ScopeSelection } from "@/lib/fr-config-types";

// ── Scope → directory mapping (mirrors push/audit route) ─────────────────────

const SCOPE_DIR: Record<string, string> = {
  "access-config": "access-config", "audit": "audit",
  "connector-definitions": "sync/connectors", "connector-mappings": "sync/mappings",
  "cookie-domains": "cookie-domains", "cors": "cors", "csp": "csp",
  "custom-nodes": "custom-nodes", "email-provider": "email-provider",
  "email-templates": "email-templates", "endpoints": "endpoints",
  "idm-authentication": "idm-authentication-config", "iga-workflows": "iga/workflows",
  "internal-roles": "internal-roles", "kba": "kba", "locales": "locales",
  "managed-objects": "managed-objects", "org-privileges": "org-privileges",
  "raw": "raw", "remote-servers": "sync/rcs", "schedules": "schedules",
  "secrets": "esvs/secrets", "service-objects": "service-objects",
  "telemetry": "telemetry", "terms-and-conditions": "terms-conditions",
  "ui-config": "ui", "variables": "esvs/variables",
};

const REALM_SCOPE_SUBDIR: Record<string, string> = {
  "authz-policies": "authorization", "journeys": "journeys",
  "oauth2-agents": "realm-config/agents", "password-policy": "password-policy",
  "saml": "realm-config/saml", "scripts": "scripts",
  "secret-mappings": "secret-mappings", "services": "services", "themes": "themes",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

/** Resolve scope to absolute directory paths within a config dir. */
function resolveScopeDirs(configDir: string, scope: string): string[] {
  if (scope in REALM_SCOPE_SUBDIR) {
    const realmsDir = path.join(configDir, "realms");
    if (!fs.existsSync(realmsDir)) return [];
    return fs.readdirSync(realmsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(realmsDir, e.name, REALM_SCOPE_SUBDIR[scope]))
      .filter((d) => fs.existsSync(d));
  }
  const dirName = SCOPE_DIR[scope] ?? scope;
  const d = path.join(configDir, dirName);
  return fs.existsSync(d) ? [d] : [];
}

/**
 * Build a name → _id map by scanning JSON files in the given directories.
 * Works for scripts (scripts-config/*.json), journeys (journeyName/journeyName.json),
 * endpoints (endpointName/endpointName.js → same dir has .json), and generic JSON.
 */
function buildNameToIdMap(dirs: string[], scope: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const dir of dirs) {
    if (scope === "scripts") {
      // Scripts: scripts-config/{uuid}.json → { name, _id }
      const configDir = path.join(dir, "scripts-config");
      if (!fs.existsSync(configDir)) continue;
      for (const f of fs.readdirSync(configDir)) {
        if (!f.endsWith(".json")) continue;
        try {
          const json = JSON.parse(fs.readFileSync(path.join(configDir, f), "utf-8"));
          if (json.name && json._id) map.set(json.name, json._id);
        } catch { /* skip */ }
      }
    } else if (scope === "journeys") {
      // Journeys: {journeyName}/{journeyName}.json — journeys are matched by directory name
      // No _id remapping needed for journeys — they use directory names
    } else {
      // Generic: scan for JSON files with _id and name fields
      const scanDir = (d: string) => {
        if (!fs.existsSync(d)) return;
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            // Check for a JSON file inside with the same name
            const inner = path.join(d, entry.name, `${entry.name}.json`);
            if (fs.existsSync(inner)) {
              try {
                const json = JSON.parse(fs.readFileSync(inner, "utf-8"));
                if (json._id) map.set(entry.name, json._id);
              } catch { /* skip */ }
            }
          } else if (entry.name.endsWith(".json")) {
            try {
              const json = JSON.parse(fs.readFileSync(path.join(d, entry.name), "utf-8"));
              const name = json.name ?? path.basename(entry.name, ".json");
              if (json._id) map.set(name, json._id);
            } catch { /* skip */ }
          }
        }
      };
      scanDir(dir);
    }
  }
  return map;
}

/**
 * Remap _id fields in the temp config directory to match target IDs.
 * Only processes JSON files that have an _id field.
 */
function remapIds(tempDirs: string[], scope: string, sourceNameToId: Map<string, string>, targetNameToId: Map<string, string>, logs: string[]) {
  if (scope === "scripts") {
    // Remap script configs
    for (const dir of tempDirs) {
      const configDir = path.join(dir, "scripts-config");
      if (!fs.existsSync(configDir)) continue;
      for (const f of fs.readdirSync(configDir)) {
        if (!f.endsWith(".json")) continue;
        const fp = path.join(configDir, f);
        try {
          const json = JSON.parse(fs.readFileSync(fp, "utf-8"));
          if (!json.name || !json._id) continue;
          const targetId = targetNameToId.get(json.name);
          if (targetId && targetId !== json._id) {
            const oldId = json._id;
            json._id = targetId;
            fs.writeFileSync(fp, JSON.stringify(json, null, 2));
            // Rename the file to match the new UUID
            const newFp = path.join(configDir, `${targetId}.json`);
            if (fp !== newFp) fs.renameSync(fp, newFp);
            logs.push(`Remapped script "${json.name}": ${oldId} → ${targetId}`);
          } else if (!targetId) {
            logs.push(`Script "${json.name}" not found on target — will be created with ID ${json._id}`);
          }
        } catch { /* skip */ }
      }
    }
  } else if (scope === "journeys") {
    // Journeys match by directory name — no _id remapping needed
    logs.push("Journeys matched by directory name — no ID remapping needed");
  } else {
    // Generic: remap _id in JSON files
    for (const dir of tempDirs) {
      const processDir = (d: string) => {
        if (!fs.existsSync(d)) return;
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            processDir(path.join(d, entry.name));
          } else if (entry.name.endsWith(".json")) {
            const fp = path.join(d, entry.name);
            try {
              const json = JSON.parse(fs.readFileSync(fp, "utf-8"));
              if (!json._id) continue;
              const name = json.name ?? path.basename(entry.name, ".json");
              const targetId = targetNameToId.get(name);
              if (targetId && targetId !== json._id) {
                const oldId = json._id;
                json._id = targetId;
                fs.writeFileSync(fp, JSON.stringify(json, null, 2));
                logs.push(`Remapped "${name}": ${oldId} → ${targetId}`);
              } else if (!targetId) {
                logs.push(`"${name}" not found on target — will be created`);
              }
            } catch { /* skip */ }
          }
        }
      };
      processDir(dir);
    }
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sourceEnvironment, targetEnvironment, scopeSelections } = body as {
    sourceEnvironment: string;
    targetEnvironment: string;
    scopeSelections: ScopeSelection[];
  };

  if (!sourceEnvironment || !targetEnvironment || !scopeSelections?.length) {
    return new Response("Missing parameters", { status: 400 });
  }

  const sourceConfigDir = getConfigDir(sourceEnvironment);
  const targetConfigDir = getConfigDir(targetEnvironment);
  if (!sourceConfigDir) return new Response("Source config dir not found", { status: 404 });
  if (!targetConfigDir) return new Response("Target config dir not found", { status: 404 });

  // Create temp copy of source config
  const tempDir = path.join(os.tmpdir(), `promote-${Date.now()}`);
  const tempConfigDir = path.join(tempDir, "config");

  // Get target environment's .env for CONFIG_DIR
  const targetEnvVars = parseEnvFile(getEnvFileContent(targetEnvironment));
  const targetConfigDirRel = targetEnvVars.CONFIG_DIR ?? "./config";

  const stream = new ReadableStream<string>({
    async start(controller) {
      const emit = (obj: object) => {
        controller.enqueue(JSON.stringify(obj) + "\n");
      };

      try {
        // Step 1: Copy only selected items from source to temp
        emit({ type: "scope-start", scope: "prepare", ts: Date.now() });
        emit({ type: "stdout", data: "Creating temporary copy of selected items...\n", ts: Date.now() });

        for (const sel of scopeSelections) {
          const sourceDirs = resolveScopeDirs(sourceConfigDir, sel.scope);
          for (const srcDir of sourceDirs) {
            const relPath = path.relative(sourceConfigDir, srcDir);
            const destDir = path.join(tempConfigDir, relPath);

            if (!sel.items || sel.items.length === 0) {
              // No item filter — copy entire scope
              copyDirSync(srcDir, destDir);
              emit({ type: "stdout", data: `  Copied ${sel.scope}: ${relPath} (all)\n`, ts: Date.now() });
            } else if (sel.scope === "scripts") {
              // Scripts: items are filenames in scripts-config (e.g., "uuid.json")
              // Copy matching scripts-config files + their scripts-content
              fs.mkdirSync(destDir, { recursive: true });
              const configSrc = path.join(srcDir, "scripts-config");
              const configDest = path.join(destDir, "scripts-config");
              if (fs.existsSync(configSrc)) {
                fs.mkdirSync(configDest, { recursive: true });
                for (const itemId of sel.items) {
                  const configFile = itemId.endsWith(".json") ? itemId : `${itemId}.json`;
                  const srcFile = path.join(configSrc, configFile);
                  if (fs.existsSync(srcFile)) {
                    fs.copyFileSync(srcFile, path.join(configDest, configFile));
                    // Read the config to find the script content file
                    try {
                      const config = JSON.parse(fs.readFileSync(srcFile, "utf-8"));
                      if (config.script?.file) {
                        const contentSrc = path.join(srcDir, config.script.file);
                        const contentDest = path.join(destDir, config.script.file);
                        if (fs.existsSync(contentSrc)) {
                          fs.mkdirSync(path.dirname(contentDest), { recursive: true });
                          fs.copyFileSync(contentSrc, contentDest);
                        }
                      }
                    } catch { /* skip */ }
                  }
                }
              }
              emit({ type: "stdout", data: `  Copied ${sel.scope}: ${sel.items.length} items\n`, ts: Date.now() });
            } else {
              // Generic scopes: items are directory names or filenames
              fs.mkdirSync(destDir, { recursive: true });
              for (const itemId of sel.items) {
                const srcItem = path.join(srcDir, itemId);
                const destItem = path.join(destDir, itemId);
                if (fs.existsSync(srcItem)) {
                  if (fs.statSync(srcItem).isDirectory()) {
                    copyDirSync(srcItem, destItem);
                  } else {
                    fs.copyFileSync(srcItem, destItem);
                  }
                }
                // Also try with .json extension
                const srcJson = srcItem + ".json";
                if (!fs.existsSync(srcItem) && fs.existsSync(srcJson)) {
                  fs.copyFileSync(srcJson, destItem + ".json");
                }
              }
              emit({ type: "stdout", data: `  Copied ${sel.scope}: ${sel.items.length} items\n`, ts: Date.now() });
            }
          }
        }

        // Step 2: For each scope, build name→id maps from source and target, then remap
        emit({ type: "scope-end", scope: "prepare", code: 0, ts: Date.now() });
        emit({ type: "scope-start", scope: "remap-ids", ts: Date.now() });
        emit({ type: "stdout", data: "Remapping IDs to match target environment...\n", ts: Date.now() });

        const remapLogs: string[] = [];
        for (const sel of scopeSelections) {
          const sourceDirs = resolveScopeDirs(sourceConfigDir, sel.scope);
          const targetDirs = resolveScopeDirs(targetConfigDir, sel.scope);
          const tempDirs = resolveScopeDirs(tempConfigDir, sel.scope);

          if (tempDirs.length === 0) continue;

          const sourceNameToId = buildNameToIdMap(sourceDirs, sel.scope);
          const targetNameToId = buildNameToIdMap(targetDirs, sel.scope);

          remapIds(tempDirs, sel.scope, sourceNameToId, targetNameToId, remapLogs);
        }

        for (const log of remapLogs) {
          emit({ type: "stdout", data: `  ${log}\n`, ts: Date.now() });
        }
        emit({ type: "scope-end", scope: "remap-ids", code: 0, ts: Date.now() });

        // Step 3: Push from temp dir to target environment
        emit({ type: "scope-start", scope: "push", ts: Date.now() });
        emit({ type: "stdout", data: `Pushing remapped config to ${targetEnvironment}...\n`, ts: Date.now() });

        // Only push scopes that actually have files in the temp dir
        const hasFiles = (dir: string): boolean => {
          if (!fs.existsSync(dir)) return false;
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.isFile()) return true;
            if (e.isDirectory() && hasFiles(path.join(dir, e.name))) return true;
          }
          return false;
        };
        const pushScopes = scopeSelections
          .map((s) => s.scope)
          .filter((scope) => {
            const dirs = resolveScopeDirs(tempConfigDir, scope);
            return dirs.some(hasFiles);
          });

        if (pushScopes.length === 0) {
          emit({ type: "stdout", data: "No items to push — temp directory is empty.\n", ts: Date.now() });
          emit({ type: "scope-end", scope: "push", code: 0, ts: Date.now() });
          emit({ type: "exit", code: 0, ts: Date.now() });
          controller.close();
          return;
        }

        emit({ type: "stdout", data: `Pushing ${pushScopes.length} scope(s): ${pushScopes.join(", ")}\n`, ts: Date.now() });

        const { stream: pushStream } = spawnFrConfig({
          command: "fr-config-push",
          environment: targetEnvironment,
          scopes: pushScopes as import("@/lib/fr-config-types").ConfigScope[],
          envOverrides: { CONFIG_DIR: tempConfigDir },
        });

        const reader = pushStream.getReader();
        let pushFailed = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Forward push output, skip its exit event
          for (const line of value.split("\n")) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "exit") {
                if (parsed.code !== 0) pushFailed = true;
                continue;
              }
              controller.enqueue(line + "\n");
            } catch {
              controller.enqueue(line + "\n");
            }
          }
        }

        emit({ type: "scope-end", scope: "push", code: pushFailed ? 1 : 0, ts: Date.now() });
        emit({ type: "exit", code: pushFailed ? 1 : 0, ts: Date.now() });
      } catch (err) {
        emit({ type: "stderr", data: `Error: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
        emit({ type: "exit", code: 1, ts: Date.now() });
      } finally {
        // Cleanup temp directory
        try {
          if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch { /* ignore */ }
        controller.close();
      }
    },
  });

  return new Response(stream as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
