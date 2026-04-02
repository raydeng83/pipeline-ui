import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope } from "@/lib/fr-config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, scopes } = body as {
    environment: string;
    scopes?: ConfigScope[];
  };

  if (!environment) {
    return new Response("Missing environment", { status: 400 });
  }

  const { stream } = spawnFrConfig({
    command: "fr-config-push",
    environment,
    scopes,
  });

  return new Response(stream as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
