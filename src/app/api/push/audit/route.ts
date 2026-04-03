import { NextRequest, NextResponse } from "next/server";
import { getConfigDir } from "@/lib/fr-config";
import { FILENAME_FILTER_SCOPES, NAME_FLAG_SCOPES, ConfigScope } from "@/lib/fr-config-types";
import fs from "fs";
import path from "path";

/**
 * List selectable items for a scope:
 * - FILENAME_FILTER_SCOPES: top-level JSON filenames
 * - NAME_FLAG_SCOPES: top-level subdirectory names (realm dirs)
 * - others: top-level filenames (display-only, not selectable)
 */
function listScopeItems(configDir: string, scope: string): string[] {
  const scopeDir = path.join(configDir, scope);
  if (!fs.existsSync(scopeDir) || !fs.statSync(scopeDir).isDirectory()) return [];

  const entries = fs.readdirSync(scopeDir, { withFileTypes: true });

  if ((NAME_FLAG_SCOPES as readonly string[]).includes(scope)) {
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  }

  return entries.filter((e) => e.isFile()).map((e) => e.name).sort();
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment");
  const scopesParam = searchParams.get("scopes");

  if (!environment) {
    return NextResponse.json({ error: "Missing environment" }, { status: 400 });
  }

  const configDir = getConfigDir(environment);
  if (!configDir) {
    return NextResponse.json({ error: "Config dir not found for environment" }, { status: 404 });
  }

  const scopes = scopesParam ? scopesParam.split(",").filter(Boolean) : [];

  const audit = scopes.map((scope) => {
    const scopeDir = path.join(configDir, scope);
    const exists = fs.existsSync(scopeDir);
    const items = listScopeItems(configDir, scope);
    const selectable = (FILENAME_FILTER_SCOPES as readonly string[]).includes(scope) ||
                       (NAME_FLAG_SCOPES as readonly string[]).includes(scope);
    return {
      scope,
      fileCount: countFiles(scopeDir),
      exists,
      items,
      selectable,
    };
  });

  return NextResponse.json(audit);
}
