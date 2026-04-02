import { NextRequest } from "next/server";
import { spawnFrConfig, ConfigScope } from "@/lib/fr-config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { environment, targetEnvironment, scopes } = body as {
    environment: string;
    targetEnvironment: string;
    scopes?: ConfigScope[];
  };

  if (!environment || !targetEnvironment) {
    return new Response("Missing environment or targetEnvironment", { status: 400 });
  }

  if (environment === targetEnvironment) {
    return new Response("Source and target environments must differ", { status: 400 });
  }

  const { stream } = spawnFrConfig({
    command: "fr-config-promote",
    environment,
    scopes,
    targetEnvironment,
  });

  return new Response(stream as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
