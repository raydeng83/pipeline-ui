/**
 * Log fetch worker — runs entirely off the main thread.
 *
 * Inbound messages (from component):
 *   { type: "fetch",      env, source, beginTime, endTime, pageSize }
 *   { type: "tail-start", env, source, tailSecs }
 *   { type: "tail-stop" }
 *   { type: "cancel" }
 *
 * Outbound messages (to component):
 *   { type: "entries", entries: LogEntry[], append: boolean }
 *   { type: "status",  loading: boolean }
 *   { type: "error",   message: string }
 */

let tailInterval = null;
let tailCookie = null;
let currentFetchId = 0; // incremented on every new command to cancel in-flight loops

async function apiPost(body) {
  const res = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function doFetch(env, source, beginTime, endTime, pageSize, fetchId) {
  self.postMessage({ type: "status", loading: true });

  let cookie = null;
  let isFirst = true;

  try {
    do {
      if (fetchId !== currentFetchId) return; // cancelled

      const data = await apiPost({ env, source, beginTime, endTime, pageSize, cookie: cookie ?? undefined });

      if (fetchId !== currentFetchId) return; // cancelled while awaiting

      if (data.error) {
        self.postMessage({ type: "error", message: data.error });
        self.postMessage({ type: "status", loading: false });
        return;
      }

      const entries = Array.isArray(data.result) ? data.result : [];
      cookie = data.pagedResultsCookie ?? null;

      self.postMessage({ type: "entries", entries, append: !isFirst });

      if (isFirst) {
        // Unblock UI after first page; remaining pages stream silently
        self.postMessage({ type: "status", loading: false });
        isFirst = false;
      }
    } while (cookie);
  } catch (e) {
    if (fetchId !== currentFetchId) return;
    self.postMessage({ type: "error", message: String(e) });
    self.postMessage({ type: "status", loading: false });
  }
}

async function doTailPoll(env, source) {
  try {
    const data = await apiPost({ env, source, tail: true, cookie: tailCookie ?? undefined });

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

self.onmessage = async function (e) {
  const msg = e.data;

  switch (msg.type) {
    case "fetch":
      stopTail();
      currentFetchId++;
      await doFetch(msg.env, msg.source, msg.beginTime, msg.endTime, msg.pageSize ?? 50, currentFetchId);
      break;

    case "tail-start":
      stopTail();
      currentFetchId++; // cancel any in-flight historical fetch
      // Immediate first poll
      await doTailPoll(msg.env, msg.source);
      // Then schedule subsequent polls
      tailInterval = setInterval(() => doTailPoll(msg.env, msg.source), msg.tailSecs * 1000);
      break;

    case "tail-stop":
      stopTail();
      break;

    case "cancel":
      stopTail();
      currentFetchId++;
      self.postMessage({ type: "status", loading: false });
      break;
  }
};
