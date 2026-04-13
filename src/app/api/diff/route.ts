import { NextResponse } from "next/server";
import { runDiffSummary } from "@/lib/fr-config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const target = url.searchParams.get("target");
  const scopesParam = url.searchParams.get("scopes");
  if (!source || !target) {
    return NextResponse.json({ error: "missing source or target" }, { status: 400 });
  }
  const scopes = scopesParam ? scopesParam.split(",").filter(Boolean) : [];
  try {
    const diff = await runDiffSummary(source, target, scopes);
    return NextResponse.json(diff);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
