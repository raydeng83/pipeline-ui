import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope, getEnvFileContent } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";
import { autoCommit, analyzeChanges, scopeLabel as getScopeLabel } from "@/lib/git";
import { appendHistory, createHistoryRecord } from "@/lib/history";
import type { ScopeDetail, LogEntry } from "@/lib/history";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopes } = body as {
    environment: string;
    scopes?: ConfigScope[];
  };

  if (!environment) {
    return new Response("Missing environment", { status: 400 });
  }

  const scopesList = scopes ?? [];
  const scopeLabel = scopesList.length ? scopesList.join(", ") : "all";
  const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // Resolve CONFIG_DIR from .env for change analysis
  const envVars = parseEnvFile(getEnvFileContent(environment));
  const configDirRel = envVars.CONFIG_DIR ?? "./config";

  // Pre-pull: commit any existing uncommitted changes
  let preHash: string | null = null;
  let preCommitError: string | null = null;
  try {
    preHash = autoCommit(
      environment,
      `auto: save uncommitted changes for ${environment} before pull`,
      configDirRel
    );
  } catch (err) {
    preCommitError = err instanceof Error ? err.message : String(err);
  }

  // If the pre-pull commit failed, abort — return an error stream instead of pulling
  if (preCommitError) {
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(
          JSON.stringify({
            type: "git",
            action: "pre-pull-commit-error",
            message: `Git commit failed — pull aborted: ${preCommitError}`,
            ts: Date.now(),
          }) + "\n"
        );
        controller.enqueue(
          JSON.stringify({ type: "exit", code: 1, ts: Date.now() }) + "\n"
        );
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

  const { stream: pullStream } = spawnFrConfig({
    command: "fr-config-pull",
    environment,
    scopes,
  });

  // Wrap the pull stream to inject git events before and after
  const startTime = Date.now();
  const startedAt = new Date(startTime).toISOString();

  const stream = new ReadableStream<string>({
    async start(controller) {
      const collectedLogs: LogEntry[] = [];

      const emit = (data: object) => {
        const entry = data as LogEntry;
        collectedLogs.push(entry);
        controller.enqueue(JSON.stringify(data) + "\n");
      };

      // Emit pre-pull commit result
      if (preHash) {
        emit({
          type: "git",
          action: "pre-pull-commit",
          hash: preHash,
          message: `Committed uncommitted changes before pull (${preHash})`,
          ts: Date.now(),
        });
      } else {
        emit({
          type: "git",
          action: "pre-pull-clean",
          message: "No uncommitted changes — working tree clean",
          ts: Date.now(),
        });
      }

      // Pipe through the pull stream
      const reader = pullStream.getReader();
      let lastExitCode = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
        // Parse and collect log entries
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

      // Post-pull: commit and record history
      let scopeDetails: Record<string, ScopeDetail> = {};
      let summary = "Pull failed";
      let postHash: string | null = null;

      if (lastExitCode === 0) {
        // Capture changes BEFORE commit (commit cleans the working tree)
        const changes = analyzeChanges(environment, configDirRel);

        for (const c of changes) {
          scopeDetails[c.scope] = { added: c.added, modified: c.modified, deleted: c.deleted };
        }
        const totalItems = changes.reduce((s, c) => s + c.added.length + c.modified.length + c.deleted.length, 0);
        const scopeNames = changes.map((c) => getScopeLabel(c.scope)).join(", ");
        summary = totalItems > 0
          ? `${totalItems} items across ${changes.length} scope${changes.length !== 1 ? "s" : ""} (${scopeNames})`
          : "No changes";

        try {
          postHash = autoCommit(
            environment,
            `pull(${environment}): ${scopeLabel} @ ${ts}`,
            configDirRel
          );
          if (postHash) {
            emit({
              type: "git",
              action: "post-pull-commit",
              hash: postHash,
              message: `Auto-committed pull results (${postHash})`,
              ts: Date.now(),
            });
          } else {
            emit({
              type: "git",
              action: "post-pull-clean",
              message: "No changes from pull — nothing to commit",
              ts: Date.now(),
            });
          }
        } catch (err) {
          const postCommitError = err instanceof Error ? err.message : String(err);
          emit({
            type: "git",
            action: "post-pull-commit-error",
            message: `Git commit failed after pull: ${postCommitError}`,
            ts: Date.now(),
          });
        }
      }

      // Append history with detail
      try {
        const record = createHistoryRecord({
          type: "pull",
          environment,
          scopes: scopesList.length ? scopesList : ["all"],
          status: lastExitCode === 0 ? "success" : "failed",
          commitHash: postHash,
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
