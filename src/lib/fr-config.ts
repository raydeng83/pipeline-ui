import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { parseEnvFile } from "./env-parser";
export type { FrCommand, ConfigScope, Environment, RunOptions } from "./fr-config-types";
export { CONFIG_SCOPES } from "./fr-config-types";
import type { Environment, RunOptions } from "./fr-config-types";

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

/** Load an env file and merge its values into process.env for a child process. */
function buildEnv(environmentName: string): NodeJS.ProcessEnv {
  const filePath = getEnvFilePath(environmentName);
  const fileVars = fs.existsSync(filePath)
    ? parseEnvFile(fs.readFileSync(filePath, "utf-8"))
    : {};
  return { ...process.env, ...fileVars };
}

export function spawnFrConfig(options: RunOptions): {
  stream: ReadableStream<string>;
  abort: () => void;
} {
  const { command, environment, scopes } = options;
  const env = buildEnv(environment);

  // No scopes = run `all`; otherwise run each scope as its own subcommand sequentially
  const subcommands: string[] =
    !scopes || scopes.length === 0 ? ["all"] : [...scopes];

  let currentProc: ReturnType<typeof spawn> | null = null;
  let aborted = false;

  const stream = new ReadableStream<string>({
    async start(controller) {
      const encode = (data: string, type: "stdout" | "stderr") => {
        controller.enqueue(JSON.stringify({ type, data, ts: Date.now() }) + "\n");
      };

      for (const sub of subcommands) {
        if (aborted) break;

        if (subcommands.length > 1) {
          encode(`\n▶ Running: ${command} ${sub}\n`, "stdout");
        }

        const exitCode = await new Promise<number | null>((resolve) => {
          const envDir = path.join(ENVIRONMENTS_DIR, environment);
          const proc = spawn(command, [sub, "--debug"], { env, shell: true, cwd: envDir });
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

        if (exitCode !== 0) {
          controller.enqueue(
            JSON.stringify({ type: "exit", code: exitCode, ts: Date.now() }) + "\n"
          );
          controller.close();
          return;
        }
      }

      controller.enqueue(
        JSON.stringify({ type: "exit", code: aborted ? 130 : 0, ts: Date.now() }) + "\n"
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
