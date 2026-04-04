import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope, getEnvFileContent } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";
import { autoCommit } from "@/lib/git";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopes } = body as {
    environment: string;
    scopes?: ConfigScope[];
  };

  if (!environment) {
    return new Response("Missing environment", { status: 400 });
  }

  const scopeLabel = scopes?.length ? scopes.join(", ") : "all";
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
  const stream = new ReadableStream<string>({
    async start(controller) {
      const emit = (data: object) => {
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
        // Capture exit code from the pull stream
        try {
          const parsed = JSON.parse(value.trim().split("\n").pop()!);
          if (parsed.type === "exit") lastExitCode = parsed.code;
        } catch {
          // not JSON or parse error — ignore
        }
      }

      // Post-pull: commit the pulled changes (only if pull succeeded)
      if (lastExitCode === 0) {
        try {
          const postHash = autoCommit(
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
