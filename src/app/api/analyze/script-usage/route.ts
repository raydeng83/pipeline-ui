import { NextRequest, NextResponse } from "next/server";
import { getConfigDir } from "@/lib/fr-config";
import fs from "fs";
import path from "path";

/** Resolve script UUID(s) from a human-readable name by scanning scripts-config dirs. */
function resolveScriptIdsByName(realmsDir: string, scriptName: string): string[] {
  const ids: string[] = [];
  if (!fs.existsSync(realmsDir)) return ids;
  for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
    if (!realm.isDirectory()) continue;
    const scriptsConfigDir = path.join(realmsDir, realm.name, "scripts", "scripts-config");
    if (!fs.existsSync(scriptsConfigDir)) continue;
    for (const file of fs.readdirSync(scriptsConfigDir)) {
      const fp = path.join(scriptsConfigDir, file);
      try {
        const json = JSON.parse(fs.readFileSync(fp, "utf-8"));
        if (json.name === scriptName) {
          const uuid = path.basename(file, ".json");
          if (!ids.includes(uuid)) ids.push(uuid);
        }
      } catch { /* skip */ }
    }
  }
  return ids;
}

export async function GET(req: NextRequest) {
  const env = req.nextUrl.searchParams.get("env");
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  const scriptName = req.nextUrl.searchParams.get("scriptName");

  if (!env) return NextResponse.json({ error: "env required" }, { status: 400 });

  const configDir = getConfigDir(env);
  if (!configDir) return NextResponse.json({ error: "Config dir not found" }, { status: 404 });

  const realmsDir = path.join(configDir, "realms");
  if (!fs.existsSync(realmsDir)) return NextResponse.json({ usedBy: [] });

  // If only a name is provided, resolve it to UUID(s) first
  let resolvedIds: string[] | null = null;
  if (!scriptId && scriptName) {
    resolvedIds = resolveScriptIdsByName(realmsDir, scriptName);
    if (resolvedIds.length === 0) return NextResponse.json({ usedBy: [] });
  }

  // If scriptId is provided, find usage for that specific script
  // If not, return all script usages (for the full panel)
  const usedBy: { journey: string; nodeName: string; nodeType: string; nodeUuid: string; scriptUuid: string; scriptName: string }[] = [];

  for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
    if (!realm.isDirectory()) continue;
    const journeysDir = path.join(realmsDir, realm.name, "journeys");
    if (!fs.existsSync(journeysDir)) continue;

    for (const jDir of fs.readdirSync(journeysDir, { withFileTypes: true })) {
      if (!jDir.isDirectory()) continue;
      const nodesDir = path.join(journeysDir, jDir.name, "nodes");
      if (!fs.existsSync(nodesDir)) continue;

      for (const nf of fs.readdirSync(nodesDir)) {
        const fp = path.join(nodesDir, nf);
        if (fs.statSync(fp).isDirectory()) continue;
        try {
          const nd = JSON.parse(fs.readFileSync(fp, "utf-8")) as {
            script?: string;
            _type?: { _id?: string; name?: string };
          };
          if (!nd.script) continue;
          if (scriptId && nd.script !== scriptId) continue;
          if (!scriptId && resolvedIds && !resolvedIds.includes(nd.script)) continue;
          const nodeUuidMatch = nf.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i);
          usedBy.push({
            journey: jDir.name,
            nodeName: nd._type?.name ?? nf.replace(/\s*-\s*[0-9a-f-]+\.json$/i, ""),
            nodeType: nd._type?._id ?? "unknown",
            nodeUuid: nodeUuidMatch?.[1] ?? "",
            scriptUuid: nd.script,
            scriptName: "",
          });
        } catch { /* skip */ }
      }
    }
  }

  return NextResponse.json({ usedBy });
}
