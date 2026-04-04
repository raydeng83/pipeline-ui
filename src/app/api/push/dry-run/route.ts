import { NextRequest, NextResponse } from "next/server";
import os from "os";
import path from "path";
import fs from "fs";
import { spawnFrConfig, getConfigDir, ConfigScope } from "@/lib/fr-config";
import { buildReport } from "@/lib/diff";
import { ScopeSelection } from "@/lib/fr-config-types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopeSelections } = body as {
    environment: string;
    scopeSelections?: ScopeSelection[];
  };

  if (!environment) {
    return NextResponse.json({ error: "Missing environment" }, { status: 400 });
  }

  const localConfigDir = getConfigDir(environment);
  if (!localConfigDir) {
    return NextResponse.json({ error: "Config dir not found" }, { status: 404 });
  }

  const scopes: ConfigScope[] = scopeSelections
    ? scopeSelections.map((s) => s.scope)
    : [];

  if (scopes.length === 0) {
    return NextResponse.json({ error: "No scopes selected" }, { status: 400 });
  }

  const tempDir = path.join(os.tmpdir(), `fr-dry-run-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const { stream: pullStream } = spawnFrConfig({
    command: "fr-config-pull",
    environment,
    scopes,
    envOverrides: { CONFIG_DIR: tempDir },
  });

  // Stream pull progress, then append the diff report at the end
  const stream = new ReadableStream<string>({
    async start(controller) {
      const emit = (obj: object) => {
        controller.enqueue(JSON.stringify(obj) + "\n");
      };

      try {
        // Pipe pull stream through to client
        const reader = pullStream.getReader();
        let pullFailed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          for (const line of (value ?? "").split("\n")) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "exit" && parsed.code !== 0) pullFailed = true;
            } catch {
              // ignore
            }
          }
        }

        if (!pullFailed) {
          // Build and emit the diff report
          const report = buildReport(
            { environment, mode: "remote" },
            tempDir,
            { environment, mode: "local" },
            localConfigDir,
            scopes
          );
          emit({ type: "report", data: JSON.stringify(report), ts: Date.now() });
        }

        emit({ type: "exit", code: pullFailed ? 1 : 0, ts: Date.now() });
      } finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        controller.close();
      }
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
