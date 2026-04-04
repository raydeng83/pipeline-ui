import { NextRequest, NextResponse } from "next/server";
import { readHistory } from "@/lib/history";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const envFilter = searchParams.get("environment");
  const typeFilter = searchParams.get("type");

  let records = readHistory();
  if (envFilter) records = records.filter((r) => r.environment === envFilter);
  if (typeFilter) records = records.filter((r) => r.type === typeFilter);

  return NextResponse.json(records);
}
