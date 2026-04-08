/**
 * IGA REST API runner — handles iga-applications, iga-entitlements, iga-notifications.
 * Authenticates using the service account JWK and calls /iga/governance/* endpoints.
 */

import path from "path";
import fs from "fs";
import { SignJWT, importJWK } from "jose";
import { randomUUID } from "crypto";
import { getConfigDir, getEnvFileContent } from "./fr-config";
import { parseEnvFile } from "./env-parser";

// ── Scope → API config ────────────────────────────────────────────────────────

interface IgaScopeConfig {
  /** IGA REST API endpoint path */
  endpoint: string;
  /** Subdirectory under configDir where files are stored */
  subdir: string;
  /** Field in each result item to use as the file ID */
  idField: string;
  /** Whether to fetch full item detail by ID (some endpoints only list summary) */
  fetchDetail: boolean;
  /** Whether push (import) is supported */
  pushSupported: boolean;
  /** Pagination style: "cursor" = searchAfterKey, "offset" = _pagedResultsOffset + _queryFilter */
  pagination: "cursor" | "offset";
}

const IGA_SCOPE_CONFIG: Record<string, IgaScopeConfig> = {
  "iga-applications": {
    endpoint: "/iga/governance/application",
    subdir: "iga/applications",
    idField: "id",
    fetchDetail: true,
    pushSupported: true,
    pagination: "cursor",
  },
  "iga-entitlements": {
    endpoint: "/iga/governance/entitlement",
    subdir: "iga/entitlements",
    idField: "id",
    fetchDetail: false,
    pushSupported: false,
    pagination: "cursor",
  },
  "iga-forms": {
    endpoint: "/iga/governance/requestForms",
    subdir: "iga/forms",
    idField: "id",
    fetchDetail: true,
    pushSupported: true,
    pagination: "offset",
  },
  "iga-notifications": {
    endpoint: "/iga/governance/notification",
    subdir: "iga/notifications",
    idField: "_id",
    fetchDetail: false,
    pushSupported: false,
    pagination: "cursor",
  },
};

export const IGA_API_SCOPES = Object.keys(IGA_SCOPE_CONFIG);

// ── Token acquisition ─────────────────────────────────────────────────────────

async function getAccessToken(envVars: Record<string, string>): Promise<string> {
  const tenantUrl = envVars.TENANT_BASE_URL ?? "";
  const saId = envVars.SERVICE_ACCOUNT_ID ?? "";
  const saKey = envVars.SERVICE_ACCOUNT_KEY ?? "";
  const clientId = envVars.SERVICE_ACCOUNT_CLIENT_ID ?? "service-account";
  const scope = (envVars.SERVICE_ACCOUNT_SCOPE ?? "fr:am:* fr:idm:* fr:iga:*")
    .split(" ").filter(Boolean).join(" ");

  const tokenEndpoint = `${tenantUrl}/am/oauth2/access_token`;
  const jwk = JSON.parse(saKey);
  const key = await importJWK(jwk, "RS256");

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(saId)
    .setSubject(saId)
    .setAudience(tokenEndpoint)
    .setJti(randomUUID())
    .setExpirationTime("3m")
    .sign(key);

  const params = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    client_id: clientId,
    scope,
    assertion: jwt,
  });

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Token error: ${data.error ?? JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── Pagination helpers ────────────────────────────────────────────────────────

/** Cursor-based pagination using searchAfterKey (application, entitlement, notification). */
async function* paginateCursor(
  tenantUrl: string,
  endpoint: string,
  token: string,
  pageSize = 100
): AsyncGenerator<Record<string, unknown>> {
  let searchAfterKey: unknown[] | null = null;

  while (true) {
    const url = new URL(`${tenantUrl}${endpoint}`);
    url.searchParams.set("_pageSize", String(pageSize));
    if (searchAfterKey) {
      url.searchParams.set("_searchAfterKey", JSON.stringify(searchAfterKey));
    }

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`IGA API ${res.status}: ${endpoint}`);

    const data = await res.json() as {
      result?: Record<string, unknown>[];
      searchAfterKey?: unknown[];
    };

    const items = data.result ?? [];
    for (const item of items) yield item;
    if (!data.searchAfterKey || items.length === 0) break;
    searchAfterKey = data.searchAfterKey;
  }
}

/** Offset-based pagination using _pagedResultsOffset + _queryFilter (requestForms). */
async function* paginateOffset(
  tenantUrl: string,
  endpoint: string,
  token: string,
  pageSize = 100
): AsyncGenerator<Record<string, unknown>> {
  let offset = 0;

  while (true) {
    const url = new URL(`${tenantUrl}${endpoint}`);
    url.searchParams.set("_pageSize", String(pageSize));
    url.searchParams.set("_pagedResultsOffset", String(offset));
    url.searchParams.set("_queryFilter", "true");

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`IGA API ${res.status}: ${endpoint}`);

    const data = await res.json() as {
      result?: Record<string, unknown>[];
      resultCount?: number;
      totalCount?: number;
    };

    const items = data.result ?? [];
    for (const item of items) yield item;
    if (items.length < pageSize) break;
    offset += items.length;
  }
}

function paginateIga(
  tenantUrl: string,
  endpoint: string,
  token: string,
  cfg: IgaScopeConfig,
  pageSize = 100
): AsyncGenerator<Record<string, unknown>> {
  return cfg.pagination === "offset"
    ? paginateOffset(tenantUrl, endpoint, token, pageSize)
    : paginateCursor(tenantUrl, endpoint, token, pageSize);
}

// ── Runner ────────────────────────────────────────────────────────────────────

export function runIgaApi(options: {
  command: "fr-config-pull" | "fr-config-push";
  scopes: string[];
  environment: string;
}): { stream: ReadableStream<string>; abort: () => void } {
  const { command, scopes, environment } = options;
  const isPull = command === "fr-config-pull";

  let aborted = false;

  const stream = new ReadableStream<string>({
    async start(controller) {
      const emit = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(JSON.stringify({ type, ...data, ts: Date.now() }) + "\n");
      };
      const log = (text: string, isErr = false) => {
        controller.enqueue(
          JSON.stringify({ type: isErr ? "stderr" : "stdout", data: text + "\n", ts: Date.now() }) + "\n"
        );
      };

      const configDir = getConfigDir(environment);
      if (!configDir) {
        log(`Config dir not found for environment "${environment}"`, true);
        emit("exit", { code: 1 });
        controller.close();
        return;
      }

      const envVars = parseEnvFile(getEnvFileContent(environment));
      const tenantUrl = envVars.TENANT_BASE_URL ?? "";

      let anyFailed = false;

      for (const scope of scopes) {
        if (aborted) break;
        const cfg = IGA_SCOPE_CONFIG[scope];
        if (!cfg) continue;

        emit("scope-start", { scope });

        try {
          log(`[${scope}] Acquiring access token…`);
          const token = await getAccessToken(envVars);
          log(`[${scope}] Token acquired.`);

          if (isPull) {
            // ── Pull (export) ────────────────────────────────────────────────
            const scopeDir = path.join(configDir, cfg.subdir);
            if (!fs.existsSync(scopeDir)) fs.mkdirSync(scopeDir, { recursive: true });

            log(`[${scope}] Fetching from ${tenantUrl}${cfg.endpoint}…`);
            let count = 0;

            for await (const item of paginateIga(tenantUrl, cfg.endpoint, token, cfg)) {
              if (aborted) break;
              const rawId = item[cfg.idField];
              const id = typeof rawId === "string" ? rawId : JSON.stringify(rawId);
              if (!id) continue;

              let fullItem = item;

              // Fetch full detail if the list only returns a summary
              if (cfg.fetchDetail) {
                const detailRes = await fetch(
                  `${tenantUrl}${cfg.endpoint}/${encodeURIComponent(id)}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (detailRes.ok) {
                  fullItem = await detailRes.json() as Record<string, unknown>;
                }
              }

              const fileName = path.join(scopeDir, `${id}.json`);
              fs.writeFileSync(fileName, JSON.stringify(fullItem, null, 2));
              count++;
              if (count % 10 === 0) log(`[${scope}] Saved ${count} items…`);
            }

            log(`[${scope}] Done. Saved ${count} item(s) to ${cfg.subdir}/`);

          } else {
            // ── Push (import) ────────────────────────────────────────────────
            if (!cfg.pushSupported) {
              log(`[${scope}] Push not supported for this scope (read-only).`, true);
              emit("scope-end", { scope, code: 1 });
              anyFailed = true;
              continue;
            }

            const scopeDir = path.join(configDir, cfg.subdir);
            if (!fs.existsSync(scopeDir)) {
              log(`[${scope}] No local files found at ${cfg.subdir}/`, true);
              emit("scope-end", { scope, code: 1 });
              anyFailed = true;
              continue;
            }

            const files = fs.readdirSync(scopeDir).filter((f) => f.endsWith(".json"));
            log(`[${scope}] Pushing ${files.length} item(s)…`);
            let pushed = 0;

            for (const file of files) {
              if (aborted) break;
              try {
                const content = JSON.parse(fs.readFileSync(path.join(scopeDir, file), "utf-8")) as Record<string, unknown>;
                const rawId = content[cfg.idField];
                const id = typeof rawId === "string" ? rawId : path.basename(file, ".json");

                // Try PUT (update); fall back to POST (create)
                const putRes = await fetch(
                  `${tenantUrl}${cfg.endpoint}/${encodeURIComponent(id)}`,
                  {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify(content),
                  }
                );

                if (putRes.ok) {
                  log(`[${scope}] Updated: ${id}`);
                } else {
                  const postRes = await fetch(
                    `${tenantUrl}${cfg.endpoint}`,
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify(content),
                    }
                  );
                  if (postRes.ok) {
                    log(`[${scope}] Created: ${id}`);
                  } else {
                    const errBody = await postRes.text();
                    log(`[${scope}] Failed to push ${id}: ${postRes.status} ${errBody.slice(0, 100)}`, true);
                  }
                }
                pushed++;
              } catch (err) {
                log(`[${scope}] Error pushing ${file}: ${err instanceof Error ? err.message : String(err)}`, true);
              }
            }

            log(`[${scope}] Done. Pushed ${pushed}/${files.length} item(s).`);
          }

          emit("scope-end", { scope, code: 0 });

        } catch (err) {
          log(`[${scope}] Error: ${err instanceof Error ? err.message : String(err)}`, true);
          emit("scope-end", { scope, code: 1 });
          anyFailed = true;
        }
      }

      emit("exit", { code: aborted ? 130 : (anyFailed ? 1 : 0) });
      controller.close();
    },
  });

  return {
    stream,
    abort: () => { aborted = true; },
  };
}

// ── Directory helpers for audit ────────────────────────────────────────────────

export function getIgaScopeDir(scope: string): string | null {
  return IGA_SCOPE_CONFIG[scope]?.subdir ?? null;
}

export function isIgaPushSupported(scope: string): boolean {
  return IGA_SCOPE_CONFIG[scope]?.pushSupported ?? false;
}
