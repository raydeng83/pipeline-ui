import { NextRequest, NextResponse } from "next/server";
import { getConfigDir } from "@/lib/fr-config";
import fs from "fs";
import path from "path";

export interface JourneyInfo {
  name: string;
  enabled: boolean;
  innerTreeOnly: boolean;
  nodeCount: number;
  subJourneys: string[];   // journeys this one calls
  calledBy: string[];      // journeys that call this one (computed)
}

export interface AnalyzeSummary {
  total: number;
  roots: number;
  orphaned: number;
  sharedSubJourneys: number;
  maxDepth: number;
  mostCalled: { name: string; count: number }[];
}

export interface AnalyzeResult {
  journeys: JourneyInfo[];
  summary: AnalyzeSummary;
}

function getDepth(name: string, map: Map<string, JourneyInfo>, visited = new Set<string>()): number {
  if (visited.has(name)) return 0; // cycle guard
  visited.add(name);
  const info = map.get(name);
  if (!info || info.subJourneys.length === 0) return 0;
  return 1 + Math.max(...info.subJourneys.map((s) => getDepth(s, map, new Set(visited))));
}

export async function POST(req: NextRequest) {
  const { env } = await req.json();
  if (!env) return NextResponse.json({ error: "env is required" }, { status: 400 });

  const configDir = getConfigDir(env);
  if (!configDir) return NextResponse.json({ error: "No config dir for environment." }, { status: 400 });

  const realmsDir = path.join(configDir, "realms");
  if (!fs.existsSync(realmsDir)) {
    return NextResponse.json({ error: "No realms directory found — pull config first." }, { status: 404 });
  }

  const journeyMap = new Map<string, JourneyInfo>();

  for (const realm of fs.readdirSync(realmsDir)) {
    const journeysDir = path.join(realmsDir, realm, "journeys");
    if (!fs.existsSync(journeysDir)) continue;

    for (const journeyName of fs.readdirSync(journeysDir)) {
      const journeyDir = path.join(journeysDir, journeyName);
      const stat = fs.statSync(journeyDir);
      if (!stat.isDirectory()) continue;

      const mainFile = path.join(journeyDir, `${journeyName}.json`);
      if (!fs.existsSync(mainFile)) continue;

      let journeyData: Record<string, unknown>;
      try {
        journeyData = JSON.parse(fs.readFileSync(mainFile, "utf-8"));
      } catch {
        continue;
      }

      const nodes = (journeyData.nodes ?? {}) as Record<string, { nodeType?: string }>;
      const nodeCount = Object.keys(nodes).length;

      // Collect UUIDs of InnerTreeEvaluatorNode nodes
      const innerTreeUUIDs = new Set<string>();
      for (const [uuid, node] of Object.entries(nodes)) {
        if (node.nodeType === "InnerTreeEvaluatorNode") innerTreeUUIDs.add(uuid);
      }

      // Read node files to resolve the `tree` field (the sub-journey name)
      const subJourneys: string[] = [];
      const nodesDir = path.join(journeyDir, "nodes");
      if (innerTreeUUIDs.size > 0 && fs.existsSync(nodesDir)) {
        for (const nodeFile of fs.readdirSync(nodesDir)) {
          const uuidMatch = nodeFile.match(/- ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i);
          if (!uuidMatch || !innerTreeUUIDs.has(uuidMatch[1])) continue;
          try {
            const nodeData = JSON.parse(fs.readFileSync(path.join(nodesDir, nodeFile), "utf-8")) as { tree?: string };
            if (nodeData.tree) subJourneys.push(nodeData.tree);
          } catch { /* skip malformed file */ }
        }
      }

      journeyMap.set(journeyName, {
        name: journeyName,
        enabled: (journeyData.enabled as boolean) ?? true,
        innerTreeOnly: (journeyData.innerTreeOnly as boolean) ?? false,
        nodeCount,
        subJourneys,
        calledBy: [],
      });
    }
  }

  // Build reverse index: calledBy
  for (const info of journeyMap.values()) {
    for (const sub of info.subJourneys) {
      const target = journeyMap.get(sub);
      if (target) target.calledBy.push(info.name);
    }
  }

  const journeys = Array.from(journeyMap.values());

  // Derive summary
  const roots     = journeys.filter((j) => j.calledBy.length === 0 && !j.innerTreeOnly);
  const orphaned  = journeys.filter((j) => j.calledBy.length === 0 && j.innerTreeOnly);
  const sharedSubs = journeys.filter((j) => j.calledBy.length >= 2);
  const maxDepth  = roots.length > 0
    ? Math.max(...roots.map((r) => getDepth(r.name, journeyMap)))
    : 0;
  const mostCalled = [...journeys]
    .filter((j) => j.calledBy.length > 0)
    .sort((a, b) => b.calledBy.length - a.calledBy.length)
    .slice(0, 8)
    .map((j) => ({ name: j.name, count: j.calledBy.length }));

  return NextResponse.json({
    journeys,
    summary: { total: journeys.length, roots: roots.length, orphaned: orphaned.length, sharedSubJourneys: sharedSubs.length, maxDepth, mostCalled },
  } satisfies AnalyzeResult);
}
