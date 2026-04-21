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
  /** Per-type explanation when count is null (HTTP status, "totalPagedResults=-1", etc.). */
  reasons: Record<string, string>;
  error?: string;
}

const MAX_TYPES = 80;

function envVarsFor(env: string): Record<string, string> | null {
  const envFile = path.join(cwd(), "environments", env, ".env");
  if (!fs.existsSync(envFile)) return null;
  return parseEnvFile(fs.readFileSync(envFile, "utf-8")) as Record<string, string>;
}

type ProbeResult = { count: number } | { count: null; reason: string };

async function probe(
  tenantUrl: string,
  type: string,
  token: string,
  policy: "EXACT" | "ESTIMATE" | "NONE",
): Promise<ProbeResult> {
  const url = new URL(`${tenantUrl}/openidm/managed/${type}`);
  url.searchParams.set("_queryFilter", "true");
  if (policy !== "NONE") url.searchParams.set("_countPolicy", policy);
  url.searchParams.set("_pageSize", "1");
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const snippet = body.slice(0, 120).replace(/\s+/g, " ").trim();
      return { count: null, reason: `${policy} → HTTP ${res.status}${snippet ? `: ${snippet}` : ""}` };
    }
    const data = await res.json() as { totalPagedResults?: number };
    if (typeof data.totalPagedResults !== "number") {
      return { count: null, reason: `${policy} → response had no totalPagedResults` };
    }
    if (data.totalPagedResults < 0) {
      return { count: null, reason: `${policy} → totalPagedResults=${data.totalPagedResults}` };
    }
    return { count: data.totalPagedResults };
  } catch (e) {
    return { count: null, reason: `${policy} → ${(e as Error).message}` };
  }
}

// Some AIC tenants reject _countPolicy outright (HTTP 400 "unrecognized
// parameter"). Fallback: paginate with _fields=_id so each page's payload is
// tiny (just ids), counting as we go. Bounded by PAGINATION_COUNT_CAP to
// keep the probe responsive even for huge types — result is suffixed with
// "+" in the reason when we capped out.
const ID_PAGE_SIZE = 1000;
const PAGINATION_COUNT_CAP = 200_000;

async function countByIdPagination(
  tenantUrl: string,
  type: string,
  token: string,
): Promise<ProbeResult> {
  let cookie: string | null = null;
  let total = 0;
  let pages = 0;
  while (true) {
    const url = new URL(`${tenantUrl}/openidm/managed/${type}`);
    url.searchParams.set("_queryFilter", "true");
    url.searchParams.set("_fields", "_id");
    url.searchParams.set("_pageSize", String(ID_PAGE_SIZE));
    if (cookie) url.searchParams.set("_pagedResultsCookie", cookie);
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const snippet = body.slice(0, 120).replace(/\s+/g, " ").trim();
        return { count: null, reason: `pagination → HTTP ${res.status}${snippet ? `: ${snippet}` : ""}` };
      }
      const data = await res.json() as { result?: unknown[]; pagedResultsCookie?: string | null };
      const n = Array.isArray(data.result) ? data.result.length : 0;
      total += n;
      pages++;
      cookie = data.pagedResultsCookie ?? null;
      if (!cookie) break;
      if (total >= PAGINATION_COUNT_CAP) {
        return { count: null, reason: `pagination → >${PAGINATION_COUNT_CAP.toLocaleString()} (too many to count, capped after ${pages} pages)` };
      }
    } catch (e) {
      return { count: null, reason: `pagination → ${(e as Error).message}` };
    }
  }
  return { count: total };
}

async function probeWithFallback(tenantUrl: string, type: string, token: string): Promise<ProbeResult> {
  const exact = await probe(tenantUrl, type, token, "EXACT");
  if (exact.count !== null) return exact;
  const estimate = await probe(tenantUrl, type, token, "ESTIMATE");
  if (estimate.count !== null) return estimate;
  // Both policies failed. If both responses were rejected with "unrecognized
  // parameter" (this AIC doesn't support _countPolicy at all), skip the
  // second attempt next time by starting from pagination.
  const paginated = await countByIdPagination(tenantUrl, type, token);
  if (paginated.count !== null) return paginated;
  return { count: null, reason: `${exact.reason}; ${estimate.reason}; ${paginated.reason}` };
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
    return NextResponse.json({ counts: {}, reasons: {} } satisfies CountResponse);
  }

  const envVars = envVarsFor(env);
  if (!envVars) return NextResponse.json({ error: "env not found", counts: {}, reasons: {} } satisfies CountResponse, { status: 404 });

  let token: string;
  try {
    token = await getAccessToken(envVars);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, counts: {}, reasons: {} } satisfies CountResponse,
      { status: 502 },
    );
  }

  const tenantUrl = envVars.TENANT_BASE_URL ?? "";
  const results = await Promise.all(
    (types as string[]).map(async (t) => [t, await probeWithFallback(tenantUrl, t, token)] as const),
  );

  const counts: Record<string, number | null> = {};
  const reasons: Record<string, string> = {};
  for (const [t, r] of results) {
    counts[t] = r.count;
    if (r.count === null) reasons[t] = r.reason;
  }
  return NextResponse.json({ counts, reasons } satisfies CountResponse);
}
