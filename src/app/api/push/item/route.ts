import { NextRequest, NextResponse } from "next/server";
import { getConfigDir } from "@/lib/fr-config";
import fs from "fs";
import path from "path";

export interface ViewableFile {
  name: string;
  content: string;
  language: "json" | "javascript" | "groovy" | "text";
}

// ── Directory mapping (mirrors audit route) ────────────────────────────────────

const SCOPE_DIR: Record<string, string> = {
  "access-config":        "access-config",
  "audit":                "audit",
  "connector-definitions":"sync/connectors",
  "connector-mappings":   "sync/mappings",
  "cookie-domains":       "cookie-domains",
  "cors":                 "cors",
  "csp":                  "csp",
  "custom-nodes":         "custom-nodes",
  "email-provider":       "email-provider",
  "email-templates":      "email-templates",
  "endpoints":            "endpoints",
  "idm-authentication":   "idm-authentication-config",
  "iga-workflows":        "iga/workflows",
  "internal-roles":       "internal-roles",
  "kba":                  "kba",
  "locales":              "locales",
  "managed-objects":      "managed-objects",
  "org-privileges":       "org-privileges",
  "raw":                  "raw",
  "remote-servers":       "sync/rcs",
  "schedules":            "schedules",
  "secrets":              "esvs/secrets",
  "service-objects":      "service-objects",
  "telemetry":            "telemetry",
  "terms-and-conditions": "terms-conditions",
  "ui-config":            "ui",
  "variables":            "esvs/variables",
};

const REALM_SCOPE_SUBDIR: Record<string, string> = {
  "authz-policies":  "authorization",
  "journeys":        "journeys",
  "oauth2-agents":   "realm-config/agents",
  "password-policy": "password-policy",
  "saml":            "realm-config/saml",
  "scripts":         "scripts",
  "secret-mappings": "secret-mappings",
  "services":        "services",
  "themes":          "themes",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getRealms(configDir: string): string[] {
  const realmsDir = path.join(configDir, "realms");
  if (!fs.existsSync(realmsDir)) return [];
  return fs.readdirSync(realmsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function readFile(filePath: string): ViewableFile | null {
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const language: ViewableFile["language"] =
    ext === ".json" ? "json" :
    ext === ".js"   ? "javascript" :
    ext === ".groovy" ? "groovy" : "text";
  return { name: path.basename(filePath), content: fs.readFileSync(filePath, "utf-8"), language };
}

function readDir(dir: string): ViewableFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => readFile(path.join(dir, e.name)))
    .filter((f): f is ViewableFile => f !== null);
}

// ── Item resolution ────────────────────────────────────────────────────────────

function resolveScriptFiles(configDir: string, itemId: string): ViewableFile[] {
  const realms = getRealms(configDir);
  for (const realm of realms) {
    const configPath = path.join(configDir, "realms", realm, "scripts", "scripts-config", itemId);
    if (!fs.existsSync(configPath)) continue;

    const files: ViewableFile[] = [];

    // Try to find the content file (.js / .groovy)
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const { name, context, language } = config;
      if (name && context) {
        const ext = language === "GROOVY" ? ".groovy" : ".js";
        const contentPath = path.join(
          configDir, "realms", realm, "scripts", "scripts-content", context, `${name}${ext}`
        );
        const contentFile = readFile(contentPath);
        if (contentFile) files.push(contentFile);
      }
    } catch { /* ignore parse errors */ }

    // Always include the config JSON
    const configFile = readFile(configPath);
    if (configFile) files.push(configFile);

    return files;
  }
  return [];
}

function resolveWorkflowFiles(configDir: string, itemId: string): ViewableFile[] {
  const workflowDir = path.join(configDir, "iga", "workflows", itemId);
  if (!fs.existsSync(workflowDir)) return [];
  const files: ViewableFile[] = [];
  // Top-level JSON
  const topFile = readFile(path.join(workflowDir, `${itemId}.json`));
  if (topFile) files.push(topFile);
  // Step JSONs (skip .js script sidecars — content is inlined when parsing)
  const stepsDir = path.join(workflowDir, "steps");
  if (fs.existsSync(stepsDir)) {
    for (const stepDir of fs.readdirSync(stepsDir, { withFileTypes: true })) {
      if (!stepDir.isDirectory()) continue;
      const stepDirPath = path.join(stepsDir, stepDir.name);
      for (const stepFile of fs.readdirSync(stepDirPath, { withFileTypes: true })) {
        if (!stepFile.isFile()) continue;
        if (!stepFile.name.endsWith(".json") && !stepFile.name.endsWith(".js")) continue;
        const f = readFile(path.join(stepDirPath, stepFile.name));
        if (f) files.push(f);
      }
    }
  }
  return files;
}

function resolveJourneyFiles(configDir: string, itemId: string): ViewableFile[] {
  const realms = getRealms(configDir);
  for (const realm of realms) {
    const journeyDir = path.join(configDir, "realms", realm, "journeys", itemId);
    if (!fs.existsSync(journeyDir)) continue;
    // Return top-level JSON files only (skip nodes/ subdirectory)
    return readDir(journeyDir);
  }
  return [];
}

function resolveItemFiles(configDir: string, scope: string, itemId: string): ViewableFile[] {
  if (scope === "scripts")       return resolveScriptFiles(configDir, itemId);
  if (scope === "journeys")      return resolveJourneyFiles(configDir, itemId);
  if (scope === "iga-workflows") return resolveWorkflowFiles(configDir, itemId);

  // Realm-based scope — item is a directory name
  if (scope in REALM_SCOPE_SUBDIR) {
    const subdir = REALM_SCOPE_SUBDIR[scope];
    const realms = getRealms(configDir);
    for (const realm of realms) {
      const itemDir = path.join(configDir, "realms", realm, subdir, itemId);
      if (fs.existsSync(itemDir) && fs.statSync(itemDir).isDirectory()) {
        return readDir(itemDir);
      }
      // Could also be a file
      const itemFile = readFile(path.join(configDir, "realms", realm, subdir, itemId));
      if (itemFile) return [itemFile];
    }
    return [];
  }

  // Direct scope — item is a filename or directory
  const dirName = SCOPE_DIR[scope] ?? scope;
  const scopeDir = path.join(configDir, dirName);

  // Try as a subdirectory (managed-objects etc.)
  const itemDir = path.join(scopeDir, itemId);
  if (fs.existsSync(itemDir) && fs.statSync(itemDir).isDirectory()) {
    return readDir(itemDir);
  }

  // Try as a direct file
  const file = readFile(path.join(scopeDir, itemId));
  return file ? [file] : [];
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment");
  const scope = searchParams.get("scope");
  const item = searchParams.get("item");

  if (!environment || !scope || !item) {
    return NextResponse.json({ error: "Missing environment, scope, or item" }, { status: 400 });
  }

  const configDir = getConfigDir(environment);
  if (!configDir) {
    return NextResponse.json({ error: "Config dir not found" }, { status: 404 });
  }

  const files = resolveItemFiles(configDir, scope, item);
  if (files.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ files });
}
