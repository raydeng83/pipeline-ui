import { NextRequest, NextResponse } from "next/server";
import { getLogApiCredentials, getEnvFileContent } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { env, source, beginTime, endTime, pageSize = 50, cookie, loggingLevel } = body as {
    env: string;
    source: string;
    beginTime: string;
    endTime: string;
    pageSize?: number;
    cookie?: string;
    loggingLevel?: string;
  };

  if (!env || !source || !beginTime) {
    return NextResponse.json({ error: "env, source, and beginTime are required." }, { status: 400 });
  }

  const creds = getLogApiCredentials(env);
  if (!creds) return NextResponse.json({ error: "No Log API credentials configured." }, { status: 400 });

  const vars = parseEnvFile(getEnvFileContent(env));
  const tenantBaseUrl = vars.TENANT_BASE_URL?.replace(/\/+$/, "");
  if (!tenantBaseUrl) return NextResponse.json({ error: "No TENANT_BASE_URL in environment config." }, { status: 400 });

  const authorization = `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`;

  const params = new URLSearchParams({
    source,
    beginTime,
    ...(endTime ? { endTime } : {}),
    _pageSize: String(pageSize),
    ...(cookie ? { _pagedResultsCookie: cookie } : {}),
    ...(loggingLevel ? { loggingLevel } : {}),
  });

  try {
    const res = await fetch(`${tenantBaseUrl}/monitoring/logs?${params}`, {
      headers: { Authorization: authorization },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `HTTP ${res.status}: ${text}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
