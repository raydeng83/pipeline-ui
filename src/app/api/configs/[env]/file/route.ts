import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getEnvFilePath } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";

const ENVIRONMENTS_DIR = path.join(process.cwd(), "environments");

function resolveConfigDir(envName: string): string | null {
  const envFile = getEnvFilePath(envName);
  if (!fs.existsSync(envFile)) return null;
  const vars = parseEnvFile(fs.readFileSync(envFile, "utf-8"));
  const configDirRaw = vars.CONFIG_DIR ?? "./config";
  const envDir = path.join(ENVIRONMENTS_DIR, envName);
  return path.resolve(envDir, configDirRaw);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ env: string }> }
) {
  const { env } = await params;
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const configDir = resolveConfigDir(env);
  if (!configDir) return NextResponse.json({ error: "Environment not found" }, { status: 404 });

  // Prevent directory traversal
  const resolved = path.resolve(configDir, filePath);
  if (!resolved.startsWith(configDir + path.sep) && resolved !== configDir) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = fs.readFileSync(resolved, "utf-8");
  return NextResponse.json({ content });
}
