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
  const journey     = searchParams.get("journey");
  const nodeId      = searchParams.get("nodeId");

  if (!environment || !journey || !nodeId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const configDir = getConfigDir(environment);
  if (!configDir) return NextResponse.json({ error: "Config dir not found" }, { status: 404 });

  for (const realm of getRealms(configDir)) {
    const nodesDir = path.join(configDir, "realms", realm, "journeys", journey, "nodes");
    if (!fs.existsSync(nodesDir)) continue;

    // Node files are named "<NodeType> - <uuid>.json" — match by UUID suffix
    const match = fs.readdirSync(nodesDir).find((f) => f.includes(nodeId) && f.endsWith(".json"));
    if (!match) continue;

    const content = fs.readFileSync(path.join(nodesDir, match), "utf-8");
    return NextResponse.json({ file: { name: match, content, language: "json" } });
  }

  return NextResponse.json({ error: "Node file not found" }, { status: 404 });
}
