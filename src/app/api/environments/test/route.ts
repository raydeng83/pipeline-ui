import { NextRequest } from "next/server";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { envVars, debug } = body as {
    envVars: Record<string, string>;
    debug?: boolean;
  };

  const args = debug ? ["test", "--debug"] : ["test"];
  const env = { ...process.env, ...envVars };

  const stream = new ReadableStream<string>({
    start(controller) {
      const encode = (data: string, type: string) =>
        controller.enqueue(JSON.stringify({ type, data, ts: Date.now() }) + "\n");

      const proc = spawn("fr-config-pull", args, { env, shell: true });

      proc.stdout.on("data", (chunk: Buffer) => encode(chunk.toString(), "stdout"));
      proc.stderr.on("data", (chunk: Buffer) => encode(chunk.toString(), "stderr"));
      proc.on("close", (code) => {
        controller.enqueue(
          JSON.stringify({ type: "exit", code, ts: Date.now() }) + "\n"
        );
        controller.close();
      });
      proc.on("error", (err) => {
        encode(err.message, "stderr");
        controller.enqueue(
          JSON.stringify({ type: "exit", code: 1, ts: Date.now() }) + "\n"
        );
        controller.close();
      });
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
