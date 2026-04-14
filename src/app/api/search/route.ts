import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { getConfigDir } from "@/lib/fr-config";
import type { SearchResponse, SearchFileResult } from "@/app/search/types";

export const dynamic = "force-dynamic";

interface RgJsonEvent {
  type: string;
  data: {
    path?: { text: string };
    lines?: { text: string };
    line_number?: number;
    submatches?: { start: number; end: number }[];
  };
}

const MAX_RESULTS = 500;          // hard cap on file results
const MAX_MATCHES_PER_FILE = 50;  // cap per file so a pathological file can't dominate

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const env = sp.get("env") ?? "";
  const q = sp.get("q") ?? "";
  const isRegex = sp.get("regex") === "1";
  const isCase = sp.get("case") === "1";
  const isWord = sp.get("word") === "1";
  const scopes = (sp.get("scopes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const glob = sp.get("glob") ?? "";

  if (!env || !q) {
    return NextResponse.json({ error: "Missing env or q" } satisfies SearchResponse | { error: string }, { status: 400 });
  }

  const configDir = getConfigDir(env);
  if (!configDir || !fs.existsSync(configDir)) {
    return NextResponse.json({ error: "Environment config directory not found" }, { status: 404 });
  }

  const args: string[] = [
    "--json",
    "--max-count", String(MAX_MATCHES_PER_FILE),
    "--max-columns", "500",
    "--max-columns-preview",
    "--hidden",
    "--glob", "!.git",
  ];
  if (!isRegex) args.push("--fixed-strings");
  if (isCase) args.push("--case-sensitive");
  else args.push("--smart-case");
  if (isWord) args.push("--word-regexp");
  if (glob) args.push("--glob", glob);
  for (const scope of scopes) {
    // rg globs: restrict to files under that top-level dir
    args.push("--glob", `${scope}/**`);
  }
  args.push("--", q, configDir);

  return new Promise<NextResponse>((resolve) => {
    const results = new Map<string, SearchFileResult>();
    let totalMatches = 0;
    let truncated = false;
    let stderrBuf = "";
    let buf = "";

    const child = spawn("rg", args, { cwd: configDir });

    child.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let evt: RgJsonEvent;
        try { evt = JSON.parse(line); } catch { continue; }
        if (evt.type !== "match") continue;
        const absPath = evt.data.path?.text;
        const lineNo = evt.data.line_number;
        const text = evt.data.lines?.text ?? "";
        if (!absPath || typeof lineNo !== "number") continue;

        const rel = path.relative(configDir, absPath).split(path.sep).join("/");
        const scope = rel.split("/")[0] ?? "";

        let file = results.get(rel);
        if (!file) {
          if (results.size >= MAX_RESULTS) { truncated = true; continue; }
          file = { path: rel, scope, matches: [] };
          results.set(rel, file);
        }
        file.matches.push({
          line: lineNo,
          text: text.replace(/\n$/, ""),
          submatches: (evt.data.submatches ?? []).map((s) => ({ start: s.start, end: s.end })),
        });
        totalMatches += 1;
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      resolve(NextResponse.json({ error: `Failed to run ripgrep: ${err.message}` }, { status: 500 }));
    });

    child.on("close", (code) => {
      // rg exit: 0 = matches, 1 = no matches, 2 = error
      if (code === 2) {
        resolve(NextResponse.json({ error: stderrBuf.trim() || "ripgrep error" }, { status: 500 }));
        return;
      }
      const out: SearchResponse = {
        results: Array.from(results.values()).sort((a, b) => a.path.localeCompare(b.path)),
        totalFiles: results.size,
        totalMatches,
        truncated,
      };
      resolve(NextResponse.json(out));
    });
  });
}
