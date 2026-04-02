#!/usr/bin/env node
/**
 * Run any fr-config-* command with a named environment's credentials.
 *
 * Usage:
 *   node scripts/run.js <env-name> <command> [args...]
 *
 * Examples:
 *   node scripts/run.js ide3 fr-config-pull test
 *   node scripts/run.js ide3 fr-config-pull test --debug
 *   node scripts/run.js ide3 fr-config-pull journeys
 *   node scripts/run.js ide3 fr-config-push journeys
 *   node scripts/run.js ide3 fr-config-promote check-locked-status
 */

const { spawnSync } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const [, , envName, ...cmdArgs] = process.argv;

if (!envName || cmdArgs.length === 0) {
  console.error("Usage: node scripts/run.js <env-name> <command> [args...]");
  console.error("       node scripts/run.js ide3 fr-config-pull test");
  process.exit(1);
}

const envFile = resolve(__dirname, `../environments/${envName}.env`);
if (!existsSync(envFile)) {
  console.error(`Environment file not found: ${envFile}`);
  console.error(`Available environments:`);
  const { readdirSync } = require("fs");
  readdirSync(resolve(__dirname, "../environments"))
    .filter((f) => f.endsWith(".env"))
    .forEach((f) => console.error(`  ${f.replace(".env", "")}`));
  process.exit(1);
}

// Parse env file — mirrors env-parser.ts logic (handles \n-escaped multi-line values)
function parseEnvFile(content) {
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const unquoted =
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
    result[key] = unquoted.replace(/\\n/g, "\n");
  }
  return result;
}

const envVars = parseEnvFile(readFileSync(envFile, "utf-8"));
const [cmd, ...args] = cmdArgs;

const result = spawnSync(cmd, args, {
  env: { ...process.env, ...envVars },
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
