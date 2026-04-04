import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope } from "@/lib/fr-config";
import { ScopeSelection } from "@/lib/fr-config-types";
import { scopeLabel as getScopeLabel } from "@/lib/git";
import { appendHistory, createHistoryRecord } from "@/lib/history";
import type { ScopeDetail, LogEntry } from "@/lib/history";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopes, scopeSelections } = body as {
    environment: string;
    scopes?: ConfigScope[];
    scopeSelections?: ScopeSelection[];
  };

  if (!environment) {
    return new Response("Missing environment", { status: 400 });
  }

  const { stream: pushStream } = spawnFrConfig({
    command: "fr-config-push",
    environment,
    ...(scopeSelections ? { scopeSelections } : { scopes }),
  });

  const startTime = Date.now();
  const startedAt = new Date(startTime).toISOString();

  // Wrap the push stream to capture logs and record history
  const stream = new ReadableStream<string>({
    async start(controller) {
      const collectedLogs: LogEntry[] = [];
      const reader = pushStream.getReader();
      let lastExitCode = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
        for (const line of value.split("\n")) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            collectedLogs.push(parsed);
            if (parsed.type === "exit") lastExitCode = parsed.code;
          } catch {
            // ignore
          }
        }
      }

      // Record history
      try {
        const scopeList = scopeSelections
          ? scopeSelections.map((s) => s.scope)
          : scopes ?? [];

        const scopeDetails: Record<string, ScopeDetail> = {};
        let totalItems = 0;

        if (scopeSelections) {
          for (const { scope, items } of scopeSelections) {
            if (items && items.length > 0) {
              scopeDetails[scope] = { added: [], modified: items, deleted: [] };
              totalItems += items.length;
            } else {
              scopeDetails[scope] = { added: [], modified: [], deleted: [] };
            }
          }
        }

        const scopeNames = scopeList.map((s) => getScopeLabel(s)).join(", ");
        const summary = totalItems > 0
          ? `${totalItems} items across ${scopeList.length} scope${scopeList.length !== 1 ? "s" : ""} (${scopeNames})`
          : `${scopeList.length} scope${scopeList.length !== 1 ? "s" : ""} (${scopeNames})`;

        const record = createHistoryRecord({
          type: "push",
          environment,
          scopes: scopeList,
          status: lastExitCode === 0 ? "success" : "failed",
          commitHash: null,
          startedAt,
          startTime,
          summary,
        });
        appendHistory(record, { scopeDetails, logs: collectedLogs });
      } catch {
        // history append failed — don't break the stream
      }

      controller.close();
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
