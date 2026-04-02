import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getEnvFilePath } from "@/lib/fr-config";
import { parseEnvFile } from "@/lib/env-parser";

const ENVIRONMENTS_DIR = path.join(process.cwd(), "environments");

export interface FileNode {
  name: string;
  relativePath: string;
  type: "file" | "dir";
  children?: FileNode[];
}

function resolveConfigDir(envName: string): string | null {
  const envFile = getEnvFilePath(envName);
  if (!fs.existsSync(envFile)) return null;
  const vars = parseEnvFile(fs.readFileSync(envFile, "utf-8"));
  const configDirRaw = vars.CONFIG_DIR ?? "./config";
  const envDir = path.join(ENVIRONMENTS_DIR, envName);
  return path.resolve(envDir, configDirRaw);
}

function buildTree(dir: string, base: string): FileNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => {
      const full = path.join(dir, entry.name);
      const relativePath = path.relative(base, full);
      if (entry.isDirectory()) {
        return { name: entry.name, relativePath, type: "dir" as const, children: buildTree(full, base) };
      }
      return { name: entry.name, relativePath, type: "file" as const };
    });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ env: string }> }
) {
  const { env } = await params;
  const configDir = resolveConfigDir(env);
  if (!configDir) return NextResponse.json({ error: "Environment not found" }, { status: 404 });
  if (!fs.existsSync(configDir)) return NextResponse.json({ tree: [], configDir });
  const tree = buildTree(configDir, configDir);
  return NextResponse.json({ tree, configDir });
}
