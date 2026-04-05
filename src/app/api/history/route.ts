import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readHistory, appendHistory } from "@/lib/history";
import type { HistoryRecord, HistoryDetail } from "@/lib/history";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const envFilter = searchParams.get("environment");
  const typeFilter = searchParams.get("type");

  let records = readHistory();
  if (envFilter) records = records.filter((r) => r.environment === envFilter);
  if (typeFilter) records = records.filter((r) => r.type === typeFilter);

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { record, detail } = body as { record: Partial<HistoryRecord>; detail?: HistoryDetail };

  if (!record?.type) {
    return NextResponse.json({ error: "Missing record type" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const full: HistoryRecord = {
    id,
    type: record.type as HistoryRecord["type"],
    environment: record.environment ?? "",
    scopes: record.scopes ?? [],
    status: record.status ?? "success",
    commitHash: record.commitHash ?? null,
    startedAt: record.startedAt ?? new Date().toISOString(),
    completedAt: record.completedAt ?? new Date().toISOString(),
    duration: record.duration ?? 0,
    summary: record.summary ?? "",
    logSource: record.logSource,
    logMode: record.logMode,
    logPreset: record.logPreset,
    logEntryCount: record.logEntryCount,
    source: record.source,
    target: record.target,
  };

  appendHistory(full, detail);
  return NextResponse.json({ id: full.id });
}
