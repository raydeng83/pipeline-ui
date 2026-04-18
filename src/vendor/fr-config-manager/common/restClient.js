/*
 * Subset of @forgerock/fr-config-manager/packages/fr-config-common/src/restClient.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Scope: exports only restGet — the one function pull/managed.js uses.
 * Retry count matches upstream default (2). No proxy support; add back if needed.
 */

const axios = require("axios");

const MAX_RETRIES = 2;

async function httpRequest(config, token) {
  const headers = { ...(config.headers ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const merged = {
    ...config,
    headers,
    validateStatus: (s) => s >= 200 && s < 300,
  };

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios(merged);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      if (status == null || status < 500 || status > 599) break;
      if (attempt < MAX_RETRIES) {
        // eslint-disable-next-line no-console
        console.error(`Retry ${attempt + 1}/${MAX_RETRIES} for ${config.url}...`);
      }
    }
  }
  throw lastErr;
}

async function restGet(url, params, token) {
  return httpRequest({ method: "GET", url, params }, token);
}

module.exports = { restGet };
