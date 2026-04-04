import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope } from "@/lib/fr-config";
import { ScopeSelection } from "@/lib/fr-config-types";
import { scopeLabel as getScopeLabel } from "@/lib/git";
import { appendHistory, createHistoryRecord } from "@/lib/history";
import type { ScopeDetail } from "@/lib/history";

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

  // Wrap the push stream to capture exit code and record history
  const stream = new ReadableStream<string>({
    async start(controller) {
      const reader = pushStream.getReader();
      let lastExitCode = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
        try {
          const parsed = JSON.parse(value.trim().split("\n").pop()!);
          if (parsed.type === "exit") lastExitCode = parsed.code;
        } catch {
          // ignore
        }
      }

      // Record history from request data
      try {
        const scopeList = scopeSelections
          ? scopeSelections.map((s) => s.scope)
          : scopes ?? [];

        const details: Record<string, ScopeDetail> = {};
        let totalItems = 0;

        if (scopeSelections) {
          for (const { scope, items } of scopeSelections) {
            if (items && items.length > 0) {
              details[scope] = { added: [], modified: items, deleted: [] };
              totalItems += items.length;
            } else {
              details[scope] = { added: [], modified: [], deleted: [] };
            }
          }
        }

        const scopeNames = scopeList.map((s) => getScopeLabel(s)).join(", ");
        const summary = totalItems > 0
          ? `${totalItems} items across ${scopeList.length} scope${scopeList.length !== 1 ? "s" : ""} (${scopeNames})`
          : `${scopeList.length} scope${scopeList.length !== 1 ? "s" : ""} (${scopeNames})`;

        appendHistory(createHistoryRecord({
          type: "push",
          environment,
          scopes: scopeList,
          status: lastExitCode === 0 ? "success" : "failed",
          commitHash: null,
          startedAt,
          startTime,
          summary,
          details,
        }));
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
