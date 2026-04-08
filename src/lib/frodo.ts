/**
 * Frodo CLI runner — handles am-agents and oidc-providers scopes.
 * Spawns `frodo` commands using the service account credentials from the .env file.
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { getConfigDir, getEnvFileContent } from "./fr-config";
import { parseEnvFile } from "./env-parser";

// ── Scope → frodo command mapping ─────────────────────────────────────────────

interface FrodoScopeConfig {
  pullArgs: string[];
  pushArgs: string[];
  /** Subdirectory under configDir where files are stored */
  subdir: string;
}

const FRODO_SCOPE_CONFIG: Record<string, FrodoScopeConfig> = {
  "am-agents": {
    pullArgs: ["agent", "export", "-A"],
    pushArgs: ["agent", "import", "-A"],
    subdir: "agents",
  },
  "oidc-providers": {
    pullArgs: ["idp", "export", "-A"],
    pushArgs: ["idp", "import", "-A"],
    subdir: "idp",
  },
};

export const FRODO_SCOPES = Object.keys(FRODO_SCOPE_CONFIG);

// ── Spawn helper ───────────────────────────────────────────────────────────────

export function spawnFrodo(options: {
  command: "fr-config-pull" | "fr-config-push";
  scopes: string[];
  environment: string;
}): { stream: ReadableStream<string>; abort: () => void } {
  const { command, scopes, environment } = options;
  const isPull = command === "fr-config-pull";

  const configDir = getConfigDir(environment);
  const envContent = getEnvFileContent(environment);
  const envVars = parseEnvFile(envContent);

  const frodoEnv: NodeJS.ProcessEnv = {
    ...process.env,
    FRODO_HOST: envVars.TENANT_BASE_URL ?? "",
    FRODO_SA_ID: envVars.SERVICE_ACCOUNT_ID ?? "",
    FRODO_SA_JWK: envVars.SERVICE_ACCOUNT_KEY ?? "",
    FRODO_REALM: JSON.parse(envVars.REALMS ?? '["alpha"]')[0] ?? "alpha",
    FRODO_NO_CACHE: "1",
  };

  let currentProc: ReturnType<typeof spawn> | null = null;
  let aborted = false;

  const stream = new ReadableStream<string>({
    async start(controller) {
      const encode = (data: string, type: "stdout" | "stderr") => {
        controller.enqueue(JSON.stringify({ type, data, ts: Date.now() }) + "\n");
      };

      let anyFailed = false;

      for (const scope of scopes) {
        if (aborted) break;
        const cfg = FRODO_SCOPE_CONFIG[scope];
        if (!cfg) continue;

        const args = isPull ? cfg.pullArgs : cfg.pushArgs;
        const targetDir = configDir ? path.join(configDir, cfg.subdir) : "";

        if (!configDir) {
          encode(`Config dir not found for environment "${environment}"`, "stderr");
          anyFailed = true;
          continue;
        }

        // Ensure target directory exists for pull
        if (isPull && !fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        controller.enqueue(
          JSON.stringify({ type: "scope-start", scope, ts: Date.now() }) + "\n"
        );

        const exitCode = await new Promise<number | null>((resolve) => {
          const proc = spawn(
            "frodo",
            [...args, "-D", targetDir],
            { env: frodoEnv, shell: true, cwd: targetDir }
          );
          currentProc = proc;

          proc.stdout.on("data", (chunk: Buffer) => encode(chunk.toString(), "stdout"));
          proc.stderr.on("data", (chunk: Buffer) => encode(chunk.toString(), "stderr"));
          proc.on("close", (code) => { currentProc = null; resolve(code); });
          proc.on("error", (err) => {
            encode(`frodo not found: ${err.message}`, "stderr");
            currentProc = null;
            resolve(1);
          });
        });

        if (exitCode !== 0) anyFailed = true;

        controller.enqueue(
          JSON.stringify({ type: "scope-end", scope, code: exitCode, ts: Date.now() }) + "\n"
        );
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

// ── Directory helpers for audit ────────────────────────────────────────────────

export function getFrodoScopeDir(scope: string): string | null {
  return FRODO_SCOPE_CONFIG[scope]?.subdir ?? null;
}
