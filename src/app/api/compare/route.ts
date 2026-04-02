import { NextRequest } from "next/server";
import os from "os";
import path from "path";
import fs from "fs";
import { spawnFrConfig, getConfigDir } from "@/lib/fr-config";
import { buildReport } from "@/lib/diff";
import type { ConfigScope } from "@/lib/fr-config-types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopes = [] } = body as { environment: string; scopes?: ConfigScope[] };

  if (!environment) return new Response("Missing environment", { status: 400 });

  const localConfigDir = getConfigDir(environment);
  if (!localConfigDir) return new Response("Environment not found", { status: 404 });

  const tempDir = path.join(os.tmpdir(), `fr-config-compare-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let abortFn: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const enqueue = (obj: object) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

      try {
        const { stream: pullStream, abort } = spawnFrConfig({
          command: "fr-config-pull",
          environment,
          scopes,
          envOverrides: { CONFIG_DIR: tempDir },
        });
        abortFn = abort;

        const reader = pullStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Forward all pull events verbatim
          for (const line of value.split("\n")) {
            if (!line.trim()) continue;
            try { enqueue(JSON.parse(line)); } catch { /* skip malformed */ }
          }
        }

        // Always generate diff report — even partial pulls produce useful comparisons
        const report = buildReport(environment, tempDir, localConfigDir, scopes);
        enqueue({ type: "report", data: JSON.stringify(report), ts: Date.now() });
      } finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        controller.close();
      }
    },
    cancel() {
      abortFn?.();
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
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
