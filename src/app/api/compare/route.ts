import { NextRequest } from "next/server";
import os from "os";
import path from "path";
import fs from "fs";
import { spawnFrConfig, getConfigDir, ConfigScope } from "@/lib/fr-config";
import { buildReport } from "@/lib/diff";
import type { CompareEndpoint } from "@/lib/diff-types";
import { appendHistory, createHistoryRecord } from "@/lib/history";
import type { LogEntry } from "@/lib/history";
import { resolveJourneyDeps } from "@/lib/resolve-journey-deps";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, target, scopes, scopeSelections, includeDeps, diffOptions } = body as {
    source: CompareEndpoint;
    target: CompareEndpoint;
    scopes?: ConfigScope[];
    scopeSelections?: import("@/lib/fr-config-types").ScopeSelection[];
    includeDeps?: boolean;
    diffOptions?: { includeMetadata?: boolean; ignoreWhitespace?: boolean };
  };

  // Derive scope names from scopeSelections if provided
  const effectiveScopes: ConfigScope[] = scopeSelections
    ? scopeSelections.map((s) => s.scope as ConfigScope)
    : scopes ?? [];

  if (!source?.environment || !target?.environment) {
    return new Response("Missing source or target", { status: 400 });
  }

  const ts = Date.now();
  const sourceTempDir = source.mode === "remote"
    ? path.join(os.tmpdir(), `fr-compare-${ts}-source`)
    : null;
  const targetTempDir = target.mode === "remote"
    ? path.join(os.tmpdir(), `fr-compare-${ts}-target`)
    : null;

  if (sourceTempDir) fs.mkdirSync(sourceTempDir, { recursive: true });
  if (targetTempDir) fs.mkdirSync(targetTempDir, { recursive: true });

  const sourceConfigDir = source.mode === "local"
    ? getConfigDir(source.environment)
    : sourceTempDir!;
  const targetConfigDir = target.mode === "local"
    ? getConfigDir(target.environment)
    : targetTempDir!;

  if (!sourceConfigDir) return new Response("Source environment not found", { status: 404 });
  if (!targetConfigDir) return new Response("Target environment not found", { status: 404 });

  let abortSource: (() => void) | null = null;
  let abortTarget: (() => void) | null = null;

  const cleanup = () => {
    if (sourceTempDir && fs.existsSync(sourceTempDir)) {
      fs.rmSync(sourceTempDir, { recursive: true, force: true });
    }
    if (targetTempDir && fs.existsSync(targetTempDir)) {
      fs.rmSync(targetTempDir, { recursive: true, force: true });
    }
  };

  const startTime = Date.now();
  const startedAt = new Date(startTime).toISOString();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const collectedLogs: LogEntry[] = [];

      const enqueue = (obj: object) => {
        collectedLogs.push(obj as LogEntry);
        controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      };

      const pullSide = async (side: "source" | "target", endpoint: CompareEndpoint, tempDir: string | null) => {
        if (endpoint.mode === "local") {
          enqueue({ type: "exit", code: 0, side, ts: Date.now() });
          return;
        }

        const { stream: pullStream, abort } = spawnFrConfig({
          command: "fr-config-pull",
          environment: endpoint.environment,
          ...(scopeSelections ? { scopeSelections } : { scopes: effectiveScopes }),
          envOverrides: { CONFIG_DIR: tempDir! },
        });

        if (side === "source") abortSource = abort;
        else abortTarget = abort;

        const reader = pullStream.getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              enqueue({ ...JSON.parse(line), side });
            } catch { /* skip malformed */ }
          }
        }
        if (buffer.trim()) {
          try { enqueue({ ...JSON.parse(buffer), side }); } catch { /* skip */ }
        }
      };

      let failed = false;
      try {
        await Promise.all([
          pullSide("source", source, sourceTempDir),
          pullSide("target", target, targetTempDir),
        ]);

        // Always resolve journey dependencies so the dry-run comparison
        // shows sub-journeys and scripts referenced by the selected journey.
        // This lets the user see whether dependencies exist on the target
        // and their actual status (unchanged/modified), regardless of
        // whether includeDeps is enabled for the push step.
        let resolvedSubJourneys: string[] = [];
        if (scopeSelections) {
          const journeyScopes = scopeSelections.filter(
            (s) => s.scope === "journeys" && s.items && s.items.length > 0
          );
          if (journeyScopes.length > 0) {
            const journeyNames = journeyScopes.flatMap((s) => s.items!);
            const deps = resolveJourneyDeps(sourceConfigDir, journeyNames);
            resolvedSubJourneys = deps.subJourneys;

            // Add sub-journeys to the journeys scope selection
            if (deps.subJourneys.length > 0) {
              const journeySel = scopeSelections.find((s) => s.scope === "journeys");
              if (journeySel?.items) {
                for (const sub of deps.subJourneys) {
                  if (!journeySel.items.includes(sub)) journeySel.items.push(sub);
                }
              }
            }

            // Add scripts to scope selections
            if (deps.scriptUuids.length > 0) {
              let scriptSel = scopeSelections.find((s) => s.scope === "scripts");
              if (!scriptSel) {
                scriptSel = { scope: "scripts" as any, items: [] };
                scopeSelections.push(scriptSel);
              }
              if (!scriptSel.items) scriptSel.items = [];
              for (const uuid of deps.scriptUuids) {
                const configFile = uuid + ".json";
                if (!scriptSel.items.includes(configFile)) {
                  scriptSel.items.push(configFile);
                  // Also add by name for scripts-content matching
                  const name = deps.scriptNames.get(uuid);
                  if (name) scriptSel.items.push("name:" + name);
                }
              }
              // Add scripts to effectiveScopes so buildReport includes the scripts directory
              if (!effectiveScopes.includes("scripts" as ConfigScope)) {
                effectiveScopes.push("scripts" as ConfigScope);
              }
            }
          }
        }

        const report = buildReport(source, sourceConfigDir, target, targetConfigDir, effectiveScopes, diffOptions);

        // When scopeSelections has item-level filters, narrow the diff to only matching files
        if (scopeSelections?.some((s) => s.items && s.items.length > 0)) {
          const itemPatterns: RegExp[] = [];
          for (const sel of scopeSelections) {
            if (!sel.items || sel.items.length === 0) continue; // all items — no filter
            const isJourney = sel.scope === "journeys";
            for (let item of sel.items) {
              // Strip name: prefix used for script content files
              if (item.startsWith("name:")) item = item.slice(5);
              const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              if (isJourney) {
                // Match the journey directory (tree JSON + nodes)
                itemPatterns.push(new RegExp(`(^|/)journeys/${escaped}/`, "i"));
              } else {
                // Match file paths containing the item name (directory name or filename stem)
                itemPatterns.push(new RegExp(`(^|/)${escaped}(/|\\.|$)`, "i"));
              }
            }
          }
          if (itemPatterns.length > 0) {
            report.files = report.files.filter(
              (f) => itemPatterns.some((p) => p.test(f.relativePath))
            );
            // Recalculate summary
            report.summary = { added: 0, removed: 0, modified: 0, unchanged: 0 };
            for (const f of report.files) report.summary[f.status]++;
          }

          // Filter journey tree: always include selected journeys AND their
          // resolved sub-journeys so the tree shows the full dependency chain.
          const journeySelection = scopeSelections.find(
            (s) => s.scope === "journeys" && s.items && s.items.length > 0
          );
          if (journeySelection && report.journeyTree) {
            const selectedNames = new Set(journeySelection.items!.map((n) => n.toLowerCase()));
            // Always include resolved sub-journeys in the tree
            for (const sub of resolvedSubJourneys) {
              selectedNames.add(sub.toLowerCase());
            }
            const filterTree = (
              nodes: import("@/lib/diff-types").JourneyTreeNode[]
            ): import("@/lib/diff-types").JourneyTreeNode[] =>
              nodes
                .filter((node) => selectedNames.has(node.name.toLowerCase()))
                .map((node) => ({ ...node, subJourneys: filterTree(node.subJourneys) }));
            report.journeyTree = filterTree(report.journeyTree);
          }
        }

        // Strip journey tree if journeys aren't in the selected scopes
        if (scopeSelections && !effectiveScopes.includes("journeys" as ConfigScope)) {
          report.journeyTree = undefined;
        }

        enqueue({ type: "report", data: JSON.stringify(report), ts: Date.now() });
        enqueue({ type: "exit", code: 0, ts: Date.now() });

        // Record history with full compare report
        try {
          const { summary } = report;
          const summaryText = `${summary.added} added, ${summary.removed} removed, ${summary.modified} modified across ${report.files.length} files`;
          const scopeList = effectiveScopes;

          const record = createHistoryRecord({
            type: "compare",
            environment: `${source.environment} → ${target.environment}`,
            source,
            target,
            scopes: scopeList.length ? scopeList : ["all"],
            status: "success",
            commitHash: null,
            startedAt,
            startTime,
            summary: summaryText,
          });
          appendHistory(record, { compareReport: report, logs: collectedLogs });
        } catch {
          // ignore
        }
      } catch {
        failed = true;
        // Record failed compare
        try {
          const record = createHistoryRecord({
            type: "compare",
            environment: `${source.environment} → ${target.environment}`,
            source,
            target,
            scopes: scopes ?? ["all"],
            status: "failed",
            commitHash: null,
            startedAt,
            startTime,
            summary: "Compare failed",
          });
          appendHistory(record, { logs: collectedLogs });
        } catch {
          // ignore
        }
      } finally {
        cleanup();
        if (failed) {
          enqueue({ type: "exit", code: 1, ts: Date.now() });
        }
        controller.close();
      }
    },
    cancel() {
      abortSource?.();
      abortTarget?.();
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
