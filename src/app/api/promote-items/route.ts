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
  const { sourceEnvironment, targetEnvironment, scopeSelections, includeDeps } = body as {
    sourceEnvironment: string;
    targetEnvironment: string;
    scopeSelections: ScopeSelection[];
    includeDeps?: boolean;
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
        // Step 0: Resolve name: prefixed items to UUIDs
        for (const sel of scopeSelections) {
          if (sel.scope !== "scripts" || !sel.items) continue;
          const nameItems = sel.items.filter((id) => id.startsWith("name:"));
          if (nameItems.length === 0) continue;

          const sourceDirs = resolveScopeDirs(sourceConfigDir, "scripts");
          const nameToUuid = new Map<string, string>();
          for (const dir of sourceDirs) {
            const configDir = path.join(dir, "scripts-config");
            if (!fs.existsSync(configDir)) continue;
            for (const f of fs.readdirSync(configDir)) {
              if (!f.endsWith(".json")) continue;
              try {
                const json = JSON.parse(fs.readFileSync(path.join(configDir, f), "utf-8"));
                if (json.name) nameToUuid.set(json.name, f);
              } catch { /* skip */ }
            }
          }

          sel.items = sel.items.map((id) => {
            if (!id.startsWith("name:")) return id;
            const name = id.slice(5);
            const uuid = nameToUuid.get(name);
            return uuid ?? id;
          });
        }

        // Step 0b: Resolve journey dependencies if includeDeps is enabled
        if (includeDeps) {
          const journeyScopes = scopeSelections.filter((s) => s.scope === "journeys" && s.items?.length);
          if (journeyScopes.length > 0) {
            emit({ type: "scope-start", scope: "resolve-deps", ts: Date.now() });
            emit({ type: "stdout", data: "Resolving journey dependencies...\n", ts: Date.now() });

            const realmsDir = path.join(sourceConfigDir, "realms");
            const scriptNameMap = new Map<string, string>(); // uuid → name
            const scriptNameToUuid = new Map<string, string>(); // name → uuid (source)

            // Build script maps
            if (fs.existsSync(realmsDir)) {
              for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
                if (!realm.isDirectory()) continue;
                const cfgDir = path.join(realmsDir, realm.name, "scripts", "scripts-config");
                if (!fs.existsSync(cfgDir)) continue;
                for (const f of fs.readdirSync(cfgDir)) {
                  if (!f.endsWith(".json")) continue;
                  try {
                    const json = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
                    if (json._id && json.name) {
                      scriptNameMap.set(json._id, json.name);
                      scriptNameToUuid.set(json.name, f); // uuid.json
                    }
                  } catch { /* skip */ }
                }
              }
            }

            const allSubJourneys = new Set<string>();
            const allScriptUuids = new Set<string>();

            const scanDeps = (journeyName: string, visited: Set<string>) => {
              if (visited.has(journeyName)) return;
              visited.add(journeyName);

              if (!fs.existsSync(realmsDir)) return;
              for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
                if (!realm.isDirectory()) continue;
                const nodesDir = path.join(realmsDir, realm.name, "journeys", journeyName, "nodes");
                if (!fs.existsSync(nodesDir)) continue;

                for (const nf of fs.readdirSync(nodesDir)) {
                  const fp = path.join(nodesDir, nf);
                  if (fs.statSync(fp).isDirectory()) continue;
                  try {
                    const nd = JSON.parse(fs.readFileSync(fp, "utf-8")) as { script?: string; tree?: string; _type?: { _id?: string } };
                    if (nd.script) allScriptUuids.add(nd.script);
                    if (nd._type?._id === "InnerTreeEvaluatorNode" && nd.tree) {
                      allSubJourneys.add(nd.tree);
                      scanDeps(nd.tree, visited);
                    }
                  } catch { /* skip */ }
                }
              }
            };

            for (const sel of journeyScopes) {
              for (const item of sel.items!) {
                scanDeps(item, new Set());
              }
            }

            // Add sub-journeys to scopeSelections
            if (allSubJourneys.size > 0) {
              const journeySel = scopeSelections.find((s) => s.scope === "journeys");
              if (journeySel?.items) {
                for (const sub of allSubJourneys) {
                  if (!journeySel.items.includes(sub)) {
                    journeySel.items.push(sub);
                    emit({ type: "stdout", data: `  + Sub-journey: ${sub}\n`, ts: Date.now() });
                  }
                }
              }
            }

            // Add scripts to scopeSelections
            if (allScriptUuids.size > 0) {
              let scriptSel = scopeSelections.find((s) => s.scope === "scripts");
              if (!scriptSel) {
                scriptSel = { scope: "scripts" as any, items: [] };
                scopeSelections.push(scriptSel);
              }
              if (!scriptSel.items) scriptSel.items = [];
              for (const uuid of allScriptUuids) {
                const configFile = uuid + ".json";
                if (!scriptSel.items.includes(configFile)) {
                  const name = scriptNameMap.get(uuid) ?? uuid;
                  scriptSel.items.push(configFile);
                  emit({ type: "stdout", data: `  + Script: ${name}\n`, ts: Date.now() });
                }
              }
            }

            emit({ type: "stdout", data: `  Total: ${allSubJourneys.size} sub-journeys, ${allScriptUuids.size} scripts\n`, ts: Date.now() });
            emit({ type: "scope-end", scope: "resolve-deps", code: 0, ts: Date.now() });
          }
        }

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

        // Step 2b: Remap script UUID references inside journey node configs
        if (includeDeps) {
          const sourceScriptNameToUuid = new Map<string, string>();
          const targetScriptNameToUuid = new Map<string, string>();
          for (const dir of resolveScopeDirs(sourceConfigDir, "scripts")) {
            const cfgDir = path.join(dir, "scripts-config");
            if (!fs.existsSync(cfgDir)) continue;
            for (const f of fs.readdirSync(cfgDir)) {
              if (!f.endsWith(".json")) continue;
              try { const j = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8")); if (j.name && j._id) sourceScriptNameToUuid.set(j.name, j._id); } catch {}
            }
          }
          for (const dir of resolveScopeDirs(targetConfigDir!, "scripts")) {
            const cfgDir = path.join(dir, "scripts-config");
            if (!fs.existsSync(cfgDir)) continue;
            for (const f of fs.readdirSync(cfgDir)) {
              if (!f.endsWith(".json")) continue;
              try { const j = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8")); if (j.name && j._id) targetScriptNameToUuid.set(j.name, j._id); } catch {}
            }
          }

          // Build source UUID → target UUID via name
          const scriptUuidRemap = new Map<string, string>();
          for (const [name, sourceUuid] of sourceScriptNameToUuid) {
            const targetUuid = targetScriptNameToUuid.get(name);
            if (targetUuid && targetUuid !== sourceUuid) {
              scriptUuidRemap.set(sourceUuid, targetUuid);
            }
          }

          if (scriptUuidRemap.size > 0) {
            emit({ type: "scope-start", scope: "remap-script-refs", ts: Date.now() });
            emit({ type: "stdout", data: `Remapping ${scriptUuidRemap.size} script references in journey nodes...\n`, ts: Date.now() });

            for (const dir of resolveScopeDirs(tempConfigDir, "journeys")) {
              // Walk all journey node files in temp
              for (const journeyName of fs.readdirSync(dir)) {
                const nodesDir = path.join(dir, journeyName, "nodes");
                if (!fs.existsSync(nodesDir)) continue;
                for (const nf of fs.readdirSync(nodesDir)) {
                  const fp = path.join(nodesDir, nf);
                  if (fs.statSync(fp).isDirectory()) continue;
                  try {
                    const nd = JSON.parse(fs.readFileSync(fp, "utf-8"));
                    if (nd.script && scriptUuidRemap.has(nd.script)) {
                      const oldUuid = nd.script;
                      nd.script = scriptUuidRemap.get(oldUuid)!;
                      fs.writeFileSync(fp, JSON.stringify(nd, null, 2));
                      const scriptName = sourceScriptNameToUuid.has(oldUuid)
                        ? [...sourceScriptNameToUuid.entries()].find(([, v]) => v === oldUuid)?.[0] ?? oldUuid
                        : oldUuid;
                      emit({ type: "stdout", data: `  ${journeyName} → ${scriptName}: ${oldUuid} → ${nd.script}\n`, ts: Date.now() });
                    }
                  } catch { /* skip */ }
                }
              }
            }

            emit({ type: "scope-end", scope: "remap-script-refs", code: 0, ts: Date.now() });
          }
        }

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
          for (const line of value.split("\n")) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              // Capture exit code but don't forward it
              if (parsed.type === "exit") {
                if (parsed.code !== 0) pushFailed = true;
                continue;
              }
              // Skip inner scope-start/scope-end to avoid confusing the viewer
              if (parsed.type === "scope-start" || parsed.type === "scope-end") {
                // Convert to stdout so user sees progress
                emit({ type: "stdout", data: `[${parsed.scope}] ${parsed.type === "scope-start" ? "started" : `finished (exit ${parsed.code})`}\n`, ts: Date.now() });
                continue;
              }
              controller.enqueue(line + "\n");
            } catch {
              controller.enqueue(line + "\n");
            }
          }
        }

        emit({ type: "scope-end", scope: "push", code: pushFailed ? 1 : 0, ts: Date.now() });

        // Step 4: Pull target to sync local files (only if push succeeded)
        if (!pushFailed) {
          emit({ type: "scope-start", scope: "pull-target", ts: Date.now() });
          emit({ type: "stdout", data: `Pulling pushed items from ${targetEnvironment} to sync local files...\n`, ts: Date.now() });

          // Resolve script items to names for --name flag (fr-config-pull uses --name, not filenameFilter)
          const uuidToName = new Map<string, string>();
          for (const dir of resolveScopeDirs(tempConfigDir, "scripts")) {
            const cfgDir = path.join(dir, "scripts-config");
            if (!fs.existsSync(cfgDir)) continue;
            for (const f of fs.readdirSync(cfgDir)) {
              if (!f.endsWith(".json")) continue;
              try {
                const json = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
                if (json.name) {
                  uuidToName.set(path.basename(f, ".json"), json.name);
                  uuidToName.set(`name:${json.name}`, json.name);
                }
              } catch { /* skip */ }
            }
          }

          // Pull each scope/item using spawn directly (scripts need --name flag)
          const { spawn: spawnProc } = await import("child_process");
          const pullEnvVars = parseEnvFile(getEnvFileContent(targetEnvironment));
          const pullEnv = { ...process.env, ...pullEnvVars };
          const pullCwd = path.join(process.cwd(), "environments", targetEnvironment);

          for (const sel of scopeSelections) {
            if (sel.scope === "scripts" && sel.items && sel.items.length > 0) {
              // Pull each script by name
              for (const itemId of sel.items) {
                const scriptName = uuidToName.get(itemId) ?? uuidToName.get(itemId.replace(/\.json$/, "")) ?? itemId;
                emit({ type: "stdout", data: `  Pulling script "${scriptName}"...\n`, ts: Date.now() });
                const code = await new Promise<number | null>((resolve) => {
                  const proc = spawnProc("fr-config-pull", ["scripts", "--name", scriptName], { env: pullEnv, shell: true, cwd: pullCwd });
                  proc.stdout.on("data", (chunk: Buffer) => emit({ type: "stdout", data: chunk.toString(), ts: Date.now() }));
                  proc.stderr.on("data", (chunk: Buffer) => emit({ type: "stderr", data: chunk.toString(), ts: Date.now() }));
                  proc.on("close", (c) => resolve(c));
                  proc.on("error", (err) => { emit({ type: "stderr", data: err.message + "\n", ts: Date.now() }); resolve(1); });
                });
                if (code !== 0) emit({ type: "stderr", data: `  Pull failed for "${scriptName}" (exit ${code})\n`, ts: Date.now() });
              }
            } else if (sel.items && sel.items.length > 0) {
              // Non-script scopes with item selection: pull by --name if supported
              for (const itemId of sel.items) {
                emit({ type: "stdout", data: `  Pulling ${sel.scope} "${itemId}"...\n`, ts: Date.now() });
                const code = await new Promise<number | null>((resolve) => {
                  const proc = spawnProc("fr-config-pull", [sel.scope, "--name", itemId], { env: pullEnv, shell: true, cwd: pullCwd });
                  proc.stdout.on("data", (chunk: Buffer) => emit({ type: "stdout", data: chunk.toString(), ts: Date.now() }));
                  proc.stderr.on("data", (chunk: Buffer) => emit({ type: "stderr", data: chunk.toString(), ts: Date.now() }));
                  proc.on("close", (c) => resolve(c));
                  proc.on("error", (err) => { emit({ type: "stderr", data: err.message + "\n", ts: Date.now() }); resolve(1); });
                });
                if (code !== 0) emit({ type: "stderr", data: `  Pull failed for "${itemId}" (exit ${code})\n`, ts: Date.now() });
              }
            } else {
              // Entire scope: pull all
              emit({ type: "stdout", data: `  Pulling ${sel.scope} (all)...\n`, ts: Date.now() });
              const code = await new Promise<number | null>((resolve) => {
                const proc = spawnProc("fr-config-pull", [sel.scope], { env: pullEnv, shell: true, cwd: pullCwd });
                proc.stdout.on("data", (chunk: Buffer) => emit({ type: "stdout", data: chunk.toString(), ts: Date.now() }));
                proc.stderr.on("data", (chunk: Buffer) => emit({ type: "stderr", data: chunk.toString(), ts: Date.now() }));
                proc.on("close", (c) => resolve(c));
                proc.on("error", (err) => { emit({ type: "stderr", data: err.message + "\n", ts: Date.now() }); resolve(1); });
              });
              if (code !== 0) emit({ type: "stderr", data: `  Pull failed for ${sel.scope} (exit ${code})\n`, ts: Date.now() });
            }
          }

          emit({ type: "scope-end", scope: "pull-target", code: 0, ts: Date.now() });
          emit({ type: "stdout", data: "Local files synced with target.\n", ts: Date.now() });
        }

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
