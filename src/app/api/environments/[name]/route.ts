import { NextRequest, NextResponse } from "next/server";
import {
  getEnvironments,
  saveEnvironments,
  getEnvFileContent,
  saveEnvFile,
  deleteEnvFolder,
} from "@/lib/fr-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const content = getEnvFileContent(name);
  return NextResponse.json({ content });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await req.json();
  const envs = getEnvironments();
  const idx = envs.findIndex((e) => e.name === name);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.label) envs[idx].label = body.label;
  if (body.color) envs[idx].color = body.color;
  saveEnvironments(envs);

  if (body.envContent !== undefined) {
    saveEnvFile(name, body.envContent);
  }

  return NextResponse.json(envs[idx]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const envs = getEnvironments();
  const filtered = envs.filter((e) => e.name !== name);
  if (filtered.length === envs.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  saveEnvironments(filtered);
  deleteEnvFolder(name);
  return NextResponse.json({ ok: true });
}
