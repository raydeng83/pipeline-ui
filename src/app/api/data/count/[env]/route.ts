// src/app/api/data/count/[env]/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { cwd } from "process";
import { parseEnvFile } from "@/lib/env-parser";
import { getAccessToken } from "@/lib/iga-api";

export const dynamic = "force-dynamic";

export interface CountResponse {
  counts: Record<string, number | null>;
  error?: string;
}

const MAX_TYPES = 80;

function envVarsFor(env: string): Record<string, string> | null {
  const envFile = path.join(cwd(), "environments", env, ".env");
  if (!fs.existsSync(envFile)) return null;
  return parseEnvFile(fs.readFileSync(envFile, "utf-8")) as Record<string, string>;
}

async function probe(
  tenantUrl: string,
  type: string,
  token: string,
  policy: "EXACT" | "ESTIMATE",
): Promise<number | null> {
  const url = new URL(`${tenantUrl}/openidm/managed/${type}`);
  url.searchParams.set("_queryFilter", "true");
  url.searchParams.set("_countPolicy", policy);
  url.searchParams.set("_pageSize", "1");
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { totalPagedResults?: number };
    return typeof data.totalPagedResults === "number" && data.totalPagedResults >= 0
      ? data.totalPagedResults
      : null;
  } catch {
    return null;
  }
}

async function probeWithFallback(tenantUrl: string, type: string, token: string): Promise<number | null> {
  const exact = await probe(tenantUrl, type, token, "EXACT");
  if (exact !== null) return exact;
  return probe(tenantUrl, type, token, "ESTIMATE");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ env: string }> },
) {
  const { env } = await params;
  const body = await req.json().catch(() => ({}));
  const types = Array.isArray(body.types)
    ? body.types.filter((t: unknown) => typeof t === "string").slice(0, MAX_TYPES)
    : [];

  if (types.length === 0) {
    return NextResponse.json({ counts: {} } satisfies CountResponse);
  }

  const envVars = envVarsFor(env);
  if (!envVars) return NextResponse.json({ error: "env not found", counts: {} } satisfies CountResponse, { status: 404 });

  let token: string;
  try {
    token = await getAccessToken(envVars);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, counts: {} } satisfies CountResponse,
      { status: 502 },
    );
  }

  const tenantUrl = envVars.TENANT_BASE_URL ?? "";
  const results = await Promise.all(
    (types as string[]).map(async (t) => [t, await probeWithFallback(tenantUrl, t, token)] as const),
  );

  const counts: Record<string, number | null> = {};
  for (const [t, n] of results) counts[t] = n;
  return NextResponse.json({ counts } satisfies CountResponse);
}
