import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { parseEnvFile } from "./env-parser";
export type { FrCommand, ConfigScope, Environment, RunOptions, ScopeSelection } from "./fr-config-types";
export { CONFIG_SCOPES, FILENAME_FILTER_SCOPES, NAME_FLAG_SCOPES } from "./fr-config-types";
import type { Environment, RunOptions, ScopeSelection } from "./fr-config-types";
import { FILENAME_FILTER_SCOPES, NAME_FLAG_SCOPES } from "./fr-config-types";

const ENVIRONMENTS_DIR = path.join(process.cwd(), "environments");

export function getEnvironments(): Environment[] {
  const envPath = path.join(ENVIRONMENTS_DIR, "environments.json");
  if (!fs.existsSync(envPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(envPath, "utf-8"));
}

export function saveEnvironments(envs: Environment[]): void {
  if (!fs.existsSync(ENVIRONMENTS_DIR)) {
    fs.mkdirSync(ENVIRONMENTS_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(ENVIRONMENTS_DIR, "environments.json"),
    JSON.stringify(envs, null, 2)
  );
}

export function getEnvFilePath(environmentName: string): string {
  return path.join(ENVIRONMENTS_DIR, environmentName, ".env");
}

export function getEnvFileContent(environmentName: string): string {
  const filePath = getEnvFilePath(environmentName);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

export function saveEnvFile(environmentName: string, content: string): void {
  const dir = path.join(ENVIRONMENTS_DIR, environmentName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getEnvFilePath(environmentName), content);
}

export function deleteEnvFolder(environmentName: string): void {
  const dir = path.join(ENVIRONMENTS_DIR, environmentName);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function getConfigDir(environmentName: string): string | null {
  const filePath = getEnvFilePath(environmentName);
  if (!fs.existsSync(filePath)) return null;
  const vars = parseEnvFile(fs.readFileSync(filePath, "utf-8"));
  const configDirRaw = vars.CONFIG_DIR ?? "./config";
  const envDir = path.join(ENVIRONMENTS_DIR, environmentName);
  return path.resolve(envDir, configDirRaw);
}

// ── Log API credentials ──────────────────────────────────────────────────────

export interface LogApiCredentials {
  apiKey: string;
  apiSecret: string;
}

function logApiPath(environmentName: string): string {
  return path.join(ENVIRONMENTS_DIR, environmentName, "log-api.json");
}

export function getLogApiCredentials(environmentName: string): LogApiCredentials | null {
  const p = logApiPath(environmentName);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export function saveLogApiCredentials(environmentName: string, creds: LogApiCredentials): void {
  const dir = path.join(ENVIRONMENTS_DIR, environmentName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(logApiPath(environmentName), JSON.stringify(creds, null, 2));
}

/** Load an env file and merge its values into process.env for a child process. */
function buildEnv(environmentName: string, overrides?: Record<string, string>): NodeJS.ProcessEnv {
  const filePath = getEnvFilePath(environmentName);
  const fileVars = fs.existsSync(filePath)
    ? parseEnvFile(fs.readFileSync(filePath, "utf-8"))
    : {};
  return { ...process.env, ...fileVars, ...overrides };
}

// ── Subcommand entry ──────────────────────────────────────────────────────────

interface SubEntry {
  scope: string;
  extraArgs: string[];
  extraEnv: Record<string, string>;
}

/** Convert scopeSelections into a flat list of CLI invocations. */
function buildSubEntries(scopeSelections: ScopeSelection[]): SubEntry[] {
  const entries: SubEntry[] = [];

  for (const { scope, items } of scopeSelections) {
    const hasFilter = items && items.length > 0;

    if (!hasFilter) {
      // No filter — push everything in this scope
      entries.push({ scope, extraArgs: [], extraEnv: {} });
    } else if ((FILENAME_FILTER_SCOPES as readonly string[]).includes(scope)) {
      // Pass comma-separated filenames via filenameFilter env var (one run)
      entries.push({ scope, extraArgs: [], extraEnv: { filenameFilter: items!.join(",") } });
    } else if ((NAME_FLAG_SCOPES as readonly string[]).includes(scope)) {
      // --name accepts one value — run once per selected item
      for (const item of items!) {
        entries.push({ scope, extraArgs: ["--name", item], extraEnv: {} });
      }
    } else {
      // Scope doesn't support item-level filtering — push whole scope
      entries.push({ scope, extraArgs: [], extraEnv: {} });
    }
  }

  return entries;
}

// ── Retry config ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;         // up to 3 total attempts
const RETRY_DELAY_MS = 3000;   // 3 seconds between retries
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── spawnFrConfig ─────────────────────────────────────────────────────────────

export function spawnFrConfig(options: RunOptions & { envOverrides?: Record<string, string>; globalArgs?: string[] }): {
  stream: ReadableStream<string>;
  abort: () => void;
} {
  const { command, environment, scopes, scopeSelections, envOverrides, globalArgs = [] } = options;
  const baseEnv = buildEnv(environment, envOverrides);

  // Build the list of CLI invocations
  const subEntries: SubEntry[] = scopeSelections
    ? buildSubEntries(scopeSelections)
    : (scopes ?? []).map((scope) => ({ scope, extraArgs: [], extraEnv: {} }));

  let currentProc: ReturnType<typeof spawn> | null = null;
  let aborted = false;

  const stream = new ReadableStream<string>({
    async start(controller) {
      const encode = (data: string, type: "stdout" | "stderr") => {
        controller.enqueue(JSON.stringify({ type, data, ts: Date.now() }) + "\n");
      };

      let anyFailed = false;

      // Group consecutive entries by scope so the log viewer shows one section per scope
      let currentScope: string | null = null;

      for (const entry of subEntries) {
        if (aborted) break;

        if (entry.scope !== currentScope) {
          if (currentScope !== null) {
            // Close previous scope section only if switching scopes mid-stream.
            // (scope-end is emitted when the last entry for a scope finishes below)
          }
          currentScope = entry.scope;
          controller.enqueue(
            JSON.stringify({ type: "scope-start", scope: entry.scope, ts: Date.now() }) + "\n"
          );
        }

        const procEnv = { ...baseEnv, ...entry.extraEnv };
        let exitCode: number | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (aborted) break;
          if (attempt > 0) {
            encode(`Retry ${attempt}/${MAX_RETRIES} for ${entry.scope}...`, "stderr");
            await sleep(RETRY_DELAY_MS);
          }

          exitCode = await new Promise<number | null>((resolve) => {
            const envDir = path.join(ENVIRONMENTS_DIR, environment);
            const proc = spawn(
              command,
              [entry.scope, "--debug", ...globalArgs, ...entry.extraArgs],
              { env: procEnv, shell: true, cwd: envDir }
            );
            currentProc = proc;

            proc.stdout.on("data", (chunk: Buffer) => encode(chunk.toString(), "stdout"));
            proc.stderr.on("data", (chunk: Buffer) => encode(chunk.toString(), "stderr"));
            proc.on("close", (code) => { currentProc = null; resolve(code); });
            proc.on("error", (err) => {
              encode(err.message, "stderr");
              currentProc = null;
              resolve(1);
            });
          });

          if (exitCode === 0) break;
        }

        if (exitCode !== 0) anyFailed = true;

        // Emit scope-end when this scope won't appear again
        const nextEntry = subEntries[subEntries.indexOf(entry) + 1];
        if (!nextEntry || nextEntry.scope !== entry.scope) {
          controller.enqueue(
            JSON.stringify({ type: "scope-end", scope: entry.scope, code: exitCode, ts: Date.now() }) + "\n"
          );
        }
      }

      controller.enqueue(
        JSON.stringify({ type: "exit", code: aborted ? 130 : (anyFailed ? 1 : 0), ts: Date.now() }) + "\n"
      );
      controller.close();
    },
    cancel() {
      aborted = true;
      currentProc?.kill("SIGTERM");
    },
  });

  return {
    stream,
    abort: () => {
      aborted = true;
      currentProc?.kill("SIGTERM");
    },
  };
}

// ── runDiffSummary ────────────────────────────────────────────────────────────

export interface DiffSummary {
  scope: string;
  added: number;
  modified: number;
  removed: number;
}

/**
 * Run a dry-run compare between two environments and parse per-scope counts.
 * Uses existing compare/promote CLI under the hood (fr-config-promote --dry-run).
 * If the CLI fails, throws — callers should catch and surface a banner.
 */
export async function runDiffSummary(
  source: string,
  target: string,
  scopes: string[],
): Promise<DiffSummary[]> {
  const env = getEnvironments().find((e) => e.name === target);
  if (!env) throw new Error(`unknown target env: ${target}`);

  return new Promise((resolve, reject) => {
    const args = ["--source", source, "--target", target, "--dry-run", "--json"];
    if (scopes.length) args.push("--scopes", scopes.join(","));
    const proc = spawn("fr-config-promote", args, { env: process.env });
    let out = "";
    let err = "";
    proc.stdout.on("data", (b: Buffer) => { out += b.toString(); });
    proc.stderr.on("data", (b: Buffer) => { err += b.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(err || `diff failed: exit ${code}`));
      try {
        const parsed = JSON.parse(out);
        // Expected shape: { changes: [{ scope, added, modified, removed }] }
        const changes = (parsed.changes ?? []) as DiffSummary[];
        resolve(changes);
      } catch (e) {
        reject(new Error(`diff parse error: ${(e as Error).message}`));
      }
    });
  });
}
