import { NextResponse } from "next/server";
import { loadSettings, resolveTargetDir, targetHasGit, runGit } from "@/lib/git-settings";

export async function GET() {
  const settings = loadSettings();
  const cwd = resolveTargetDir(settings);

  if (!targetHasGit(settings)) {
    return NextResponse.json({
      initialized: false,
      targetDir: cwd,
      message: "Target directory is not a git repository.",
    });
  }

  const branchRes = runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  const remoteRes = runGit(["remote", "get-url", "origin"], cwd);
  const statusRes = runGit(["status", "--porcelain"], cwd);

  let ahead = 0;
  let behind = 0;
  const aheadBehind = runGit(
    ["rev-list", "--left-right", "--count", `origin/${settings.branch}...HEAD`],
    cwd,
  );
  if (aheadBehind.ok) {
    const parts = aheadBehind.stdout.split(/\s+/);
    behind = Number(parts[0] ?? 0);
    ahead = Number(parts[1] ?? 0);
  }

  const dirtyFiles: { path: string; status: string; label: string }[] = [];
  if (statusRes.ok) {
    for (const line of statusRes.stdout.split("\n")) {
      if (!line.trim()) continue;
      const code = line.substring(0, 2);
      const filePath = line.substring(3).trim();
      dirtyFiles.push({ path: filePath, status: code, label: statusLabel(code) });
    }
  }

  return NextResponse.json({
    initialized: true,
    targetDir: cwd,
    branch: branchRes.ok ? branchRes.stdout : null,
    remote: remoteRes.ok ? remoteRes.stdout : null,
    dirtyCount: dirtyFiles.length,
    dirtyFiles,
    ahead,
    behind,
  });
}

function statusLabel(code: string): string {
  const c = code.trim();
  if (c === "??") return "untracked";
  if (c === "A" || c === "AM") return "added";
  if (c === "M" || c === "MM") return "modified";
  if (c.startsWith("M")) return "modified";
  if (c.startsWith("A")) return "added";
  if (c.startsWith("D") || c.endsWith("D")) return "deleted";
  if (c.startsWith("R")) return "renamed";
  if (c.startsWith("C")) return "copied";
  if (c.startsWith("U") || c === "AA" || c === "DD") return "conflict";
  return c;
}
