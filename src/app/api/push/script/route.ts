import { NextRequest, NextResponse } from "next/server";
import { getConfigDir } from "@/lib/fr-config";
import fs from "fs";
import path from "path";

function getRealms(configDir: string): string[] {
  const realmsDir = path.join(configDir, "realms");
  if (!fs.existsSync(realmsDir)) return [];
  return fs.readdirSync(realmsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment");
  const scriptId    = searchParams.get("scriptId");

  if (!environment || !scriptId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const configDir = getConfigDir(environment);
  if (!configDir) return NextResponse.json({ error: "Config dir not found" }, { status: 404 });

  for (const realm of getRealms(configDir)) {
    const configFile = path.join(configDir, "realms", realm, "scripts", "scripts-config", `${scriptId}.json`);
    if (!fs.existsSync(configFile)) continue;

    let scriptMeta: { name?: string; script?: { file?: string } };
    try {
      scriptMeta = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch {
      continue;
    }

    const relFile = scriptMeta.script?.file;
    if (!relFile) {
      return NextResponse.json({ name: scriptMeta.name ?? scriptId, content: null });
    }

    const contentFile = path.join(configDir, "realms", realm, "scripts", relFile);
    if (!fs.existsSync(contentFile)) {
      return NextResponse.json({ name: scriptMeta.name ?? scriptId, content: null });
    }

    const content = fs.readFileSync(contentFile, "utf-8");
    return NextResponse.json({ name: scriptMeta.name ?? scriptId, content });
  }

  return NextResponse.json({ error: "Script not found" }, { status: 404 });
}
