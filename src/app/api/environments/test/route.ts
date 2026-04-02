import { NextRequest, NextResponse } from "next/server";
import { getEnvFileContent } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Accept either an environment name (load from disk) or inline fields
  let tenantBaseUrl: string | undefined;
  let serviceAccountId: string | undefined;
  let serviceAccountKey: string | undefined;

  if (body.environmentName) {
    const content = getEnvFileContent(body.environmentName);
    const fields = parseEnvFile(content);
    tenantBaseUrl = fields["TENANT_BASE_URL"];
    serviceAccountId = fields["SERVICE_ACCOUNT_ID"];
    serviceAccountKey = fields["SERVICE_ACCOUNT_KEY"];
  } else {
    tenantBaseUrl = body.TENANT_BASE_URL;
    serviceAccountId = body.SERVICE_ACCOUNT_ID;
    serviceAccountKey = body.SERVICE_ACCOUNT_KEY;
  }

  if (!tenantBaseUrl) {
    return NextResponse.json({ ok: false, error: "TENANT_BASE_URL is not set" }, { status: 400 });
  }

  // TENANT_BASE_URL is the root domain (no /am suffix); append the health path directly
  const base = tenantBaseUrl.replace(/\/$/, "");
  const healthUrl = `${base}/am/json/health/live`;

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok || res.status === 401) {
      // 401 means the endpoint exists but needs auth — tenant is reachable
      return NextResponse.json({
        ok: true,
        status: res.status,
        message: res.ok ? "Tenant is reachable and healthy." : "Tenant is reachable (auth required).",
        url: healthUrl,
      });
    }

    return NextResponse.json({
      ok: false,
      status: res.status,
      error: `Tenant returned HTTP ${res.status}`,
      url: healthUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: `Connection failed: ${message}`,
      url: healthUrl,
    });
  }
}
