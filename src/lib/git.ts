import { execSync } from "child_process";
import path from "path";

const REPO_ROOT = process.cwd();
const ENVIRONMENTS_DIR = path.join(REPO_ROOT, "environments");

/** Get the relative path from repo root for an environment's directory. */
function envRelPath(environment: string): string {
  return path.relative(REPO_ROOT, path.join(ENVIRONMENTS_DIR, environment));
}

/** Check whether an environment directory has uncommitted changes (staged or unstaged, plus untracked). */
export function hasChanges(environment: string): boolean {
  const relPath = envRelPath(environment);
  const status = execSync(`git status --porcelain -- "${relPath}"`, {
    cwd: REPO_ROOT,
    encoding: "utf-8",
  }).trim();
  return status.length > 0;
}

/** Stage and commit all changes in an environment directory. Returns the short commit hash, or null if nothing to commit. */
export function autoCommit(
  environment: string,
  message: string
): string | null {
  if (!hasChanges(environment)) return null;

  const relPath = envRelPath(environment);
  execSync(`git add -- "${relPath}"`, { cwd: REPO_ROOT });
  execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: REPO_ROOT });

  const hash = execSync("git rev-parse --short HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf-8",
  }).trim();
  return hash;
}
