import { spawn } from "child_process";
import path from "path";
import fs from "fs";
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
  return path.join(ENVIRONMENTS_DIR, `${environmentName}.env`);
}

export function getEnvFileContent(environmentName: string): string {
  const filePath = getEnvFilePath(environmentName);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

export function saveEnvFile(environmentName: string, content: string): void {
  if (!fs.existsSync(ENVIRONMENTS_DIR)) {
    fs.mkdirSync(ENVIRONMENTS_DIR, { recursive: true });
  }
  fs.writeFileSync(getEnvFilePath(environmentName), content);
}

export function spawnFrConfig(options: RunOptions): {
  stream: ReadableStream<string>;
  abort: () => void;
} {
  const { command, environment, scopes, targetEnvironment } = options;
  const envFilePath = getEnvFilePath(environment);

  const args: string[] = [];
  if (scopes && scopes.length > 0) {
    args.push(...scopes);
  }
  if (command === "fr-config-promote" && targetEnvironment) {
    args.push("--target", getEnvFilePath(targetEnvironment));
  }

  const proc = spawn(command, args, {
    env: {
      ...process.env,
      DOTENV_CONFIG_PATH: envFilePath,
    },
    shell: true,
  });

  let abortCalled = false;

  const stream = new ReadableStream<string>({
    start(controller) {
      const encode = (data: string, type: "stdout" | "stderr") => {
        const line = JSON.stringify({ type, data, ts: Date.now() }) + "\n";
        controller.enqueue(line);
      };

      proc.stdout.on("data", (chunk) => encode(chunk.toString(), "stdout"));
      proc.stderr.on("data", (chunk) => encode(chunk.toString(), "stderr"));

      proc.on("close", (code) => {
        const line = JSON.stringify({ type: "exit", code, ts: Date.now() }) + "\n";
        controller.enqueue(line);
        controller.close();
      });

      proc.on("error", (err) => {
        const line = JSON.stringify({ type: "error", data: err.message, ts: Date.now() }) + "\n";
        controller.enqueue(line);
        controller.close();
      });
    },
    cancel() {
      if (!abortCalled) {
        abortCalled = true;
        proc.kill("SIGTERM");
      }
    },
  });

  return { stream, abort: () => proc.kill("SIGTERM") };
}
