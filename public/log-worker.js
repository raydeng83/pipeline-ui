/**
 * Log fetch worker — runs entirely off the main thread.
 *
 * Inbound messages (from component):
 *   { type: "fetch",      env, source, beginTime, endTime }
 *   { type: "fetch-pause" }
 *   { type: "fetch-resume" }
 *   { type: "fetch-stop" }
 *   { type: "tail-start", env, source, tailSecs }
 *   { type: "tail-stop" }
 *   { type: "cancel" }
 *
 * Outbound messages (to component):
 *   { type: "entries",  entries: LogEntry[], append: boolean }
 *   { type: "status",   loading: boolean }
 *   { type: "progress", loaded: number, page: number, done: boolean, paused: boolean }
 *   { type: "error",    message: string }
 */

let tailInterval = null;
let tailCookie = null;
let currentFetchId = 0;

// Search pagination state
let searchCookie = null;
let searchParams = null;
let searchPaused = false;
let searchResolveResume = null; // resolve function for pause promise
let sleepReject = null; // reject function to interrupt sleep on stop

const RATE_LIMIT_DELAY = 1100; // 1.1s between pages (60 req/min limit)
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => { sleepReject = null; resolve(); }, ms);
    sleepReject = () => { clearTimeout(id); reject(new Error("cancelled")); sleepReject = null; };
  });
}

async function apiPost(body, retries = MAX_RETRIES) {
  const res = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
    const waitMs = Math.max(retryAfter * 1000, RATE_LIMIT_DELAY);
    self.postMessage({ type: "error", message: `Rate limited — retrying in ${Math.ceil(waitMs / 1000)}s…` });
    await sleep(waitMs);
    return apiPost(body, retries - 1);
  }
  return res.json();
}

function waitForResume() {
  return new Promise((resolve) => { searchResolveResume = resolve; });
}

async function doFetch(env, source, beginTime, endTime, fetchId) {
  self.postMessage({ type: "status", loading: true });

  let cookie = null;
  let isFirst = true;
  let totalLoaded = 0;
  let pageNum = 0;

  try {
    do {
      if (fetchId !== currentFetchId) return;

      // Check if paused
      if (searchPaused) {
        self.postMessage({ type: "progress", loaded: totalLoaded, page: pageNum, done: false, paused: true });
        await waitForResume();
        if (fetchId !== currentFetchId) return;
      }

      // Rate limit delay between pages (skip first request)
      if (!isFirst) await sleep(RATE_LIMIT_DELAY);

      pageNum++;
      const data = await apiPost({
        env, source, beginTime, endTime,
        cookie: cookie ?? undefined,
      });

      if (fetchId !== currentFetchId) return;

      if (data.error) {
        self.postMessage({ type: "error", message: data.error });
        self.postMessage({ type: "status", loading: false });
        self.postMessage({ type: "progress", loaded: totalLoaded, page: pageNum, done: true, paused: false });
        return;
      }

      const entries = Array.isArray(data.result) ? data.result : [];
      cookie = data.pagedResultsCookie ?? null;
      totalLoaded += entries.length;

      // Store for resume
      searchCookie = cookie;
      searchParams = { env, source, beginTime, endTime };

      self.postMessage({ type: "entries", entries, append: !isFirst });
      self.postMessage({ type: "progress", loaded: totalLoaded, page: pageNum, done: !cookie, paused: false });

      if (isFirst) {
        self.postMessage({ type: "status", loading: false });
        isFirst = false;
      }
    } while (cookie);

    self.postMessage({ type: "progress", loaded: totalLoaded, page: pageNum, done: true, paused: false });
  } catch (e) {
    if (fetchId !== currentFetchId) return;
    self.postMessage({ type: "error", message: String(e) });
    self.postMessage({ type: "status", loading: false });
    self.postMessage({ type: "progress", loaded: totalLoaded, page: pageNum, done: true, paused: false });
  }
}

async function doTailPoll(env, source) {
  try {
    const data = await apiPost({ env, source, tail: true, cookie: tailCookie ?? undefined }, MAX_RETRIES);

    if (data.error) {
      self.postMessage({ type: "error", message: data.error });
      return;
    }

    const entries = Array.isArray(data.result) ? data.result : [];
    tailCookie = data.pagedResultsCookie ?? null;

    if (entries.length > 0) {
      self.postMessage({ type: "entries", entries, append: true });
    }
  } catch (e) {
    self.postMessage({ type: "error", message: String(e) });
  }
}

function stopTail() {
  if (tailInterval !== null) {
    clearInterval(tailInterval);
    tailInterval = null;
  }
  tailCookie = null;
}

function stopSearch() {
  searchCookie = null;
  searchParams = null;
  searchPaused = false;
  if (searchResolveResume) { searchResolveResume(); searchResolveResume = null; }
  if (sleepReject) { sleepReject(); sleepReject = null; }
}

self.onmessage = async function (e) {
  const msg = e.data;

  switch (msg.type) {
    case "fetch":
      stopTail();
      stopSearch();
      sleepReject = null; // ensure no stale reject from previous operations
      currentFetchId++;
      await doFetch(msg.env, msg.source, msg.beginTime, msg.endTime, currentFetchId);
      break;

    case "fetch-pause":
      searchPaused = true;
      break;

    case "fetch-resume":
      searchPaused = false;
      if (searchResolveResume) { searchResolveResume(); searchResolveResume = null; }
      break;

    case "fetch-stop":
      stopSearch();
      currentFetchId++;
      self.postMessage({ type: "status", loading: false });
      self.postMessage({ type: "progress", loaded: 0, page: 0, done: true, paused: false });
      break;

    case "tail-start":
      stopTail();
      stopSearch();
      currentFetchId++;
      await doTailPoll(msg.env, msg.source);
      tailInterval = setInterval(() => doTailPoll(msg.env, msg.source), msg.tailSecs * 1000);
      break;

    case "tail-stop":
      stopTail();
      break;

    case "cancel":
      stopTail();
      stopSearch();
      currentFetchId++;
      self.postMessage({ type: "status", loading: false });
      self.postMessage({ type: "progress", loaded: 0, page: 0, done: true, paused: false });
      break;
  }
};
