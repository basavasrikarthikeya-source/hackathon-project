// ═══ SatQuery API layer — DIRECT MODE v1.1 ═════════════════════════════
// Contract: docs/01-ENDPOINT-CONTRACT.md. This is the single AI
// touchpoint: swap the base URL here (or via settings) and nothing else
// in the app changes. No other file may call the network for AI features.

const LS_KEY = "satquery_api_base";

export const CONFIG = {
  baseUrl: "",            // build-time default; runtime override wins
  mock: false,            // true = canned answers, zero backend needed
  pollMs: 20000,          // health poll interval
  watchdogMs: 150000,     // 150 s hard timeout per call
};

export function getApiBase() {
  const q  = typeof location !== "undefined" ? new URLSearchParams(location.search).get("api") : null;
  const ls = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  return (q || ls || CONFIG.baseUrl || "").replace(/\/+$/, "");
}
export function setApiBase(u) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LS_KEY, String(u).replace(/\/+$/, ""));
  }
}
export function clearApiBase() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LS_KEY);
  }
}
export function isMock() {
  const b = getApiBase();
  return CONFIG.mock || !b || b.toLowerCase() === "mock";
}

let _client = null, _clientUrl = null;
async function client() {
  const url = getApiBase();
  if (isMock()) throw new Error("mock mode: no client");
  if (!_client || _clientUrl !== url) {
    const { Client } =
      await import("https://cdn.jsdelivr.net/npm/@gradio/client@1/+esm");
    _client = await Client.connect(url);          // throws if offline
    _clientUrl = url;
  }
  return _client;
}

function withWatchdog(p) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(
      () => rej(new Error("WATCHDOG: no result within 150 s — " +
                          "engine likely offline or queue stuck")),
      CONFIG.watchdogMs)),
  ]);
}

// Parse "[VERDICT] body ... confidence: N/100" — contract §4.
export function parseAnswer(text) {
  const raw = String(text || "");
  const v   = raw.match(/^\s*\[(ANSWERED|UNCERTAIN|REFUSED|ERROR)\]\s*/i);
  const verdict = v ? v[1].toUpperCase() : null;
  let body = v ? raw.slice(v[0].length) : raw;
  const c  = body.match(/confidence:\s*(\d+)\s*\/\s*100/i);
  const confidence = c ? parseInt(c[1], 10) : null;
  if (c) body = body.replace(c[0], "");
  return { verdict, body: body.trim(), confidence };
}

function _meta(x) {
  if (x && typeof x === "object") return x;
  try { return JSON.parse(x); } catch { return {}; }
}
function _imgUrl(x) {
  return (x && typeof x === "object" && (x.url || x.path)) || x || null;
}

export async function health() {
  if (isMock()) return { status: "online", model: "mock", queue: 0,
                         version: "mock" };
  const app = await client();
  const r = await app.predict("/health", []);
  return _meta(r.data[0]);
}

export async function chat({ image, question, threshold }) {
  // image: File | Blob | null. threshold: 1.0 | 0.8 | 0.5 (NUMBER).
  if (isMock()) return mockChat(question);
  const app = await client();
  const r = await withWatchdog(
    app.predict("/chat", [image, question || "", Number(threshold) || 0.8]));
  return { ...parseAnswer(r.data[0]), markedUrl: _imgUrl(r.data[1]),
           meta: _meta(r.data[2]) };
}

export async function compare({ pastImage, presentImage, question,
                                intervalMonths }) {
  if (isMock()) return mockCompare(question);
  const app = await client();
  const r = await withWatchdog(app.predict("/compare",
    [pastImage, presentImage, question || "",
     Number(intervalMonths) || 6]));
  return { ...parseAnswer(r.data[0]), markedUrl: _imgUrl(r.data[1]),
           meta: _meta(r.data[2]) };
}

// ---- mock mode (build/demo with zero backend) ---------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mockChat(question) {
  await sleep(2500);
  const q = String(question || "").toLowerCase();
  if (q.includes("population") || q.includes("who owns") || q.includes("refuse")) {
    return {
      ...parseAnswer("[REFUSED] Satellite pixels cannot answer this — population, demographics, names, prices, ownership, reasons, predictions and personal data are not visible from above. Refusing by design.\n\nconfidence: 100/100"),
      markedUrl: "assets/mock_marked.png",
      meta: {
        verdict: "REFUSED",
        confidence: 100,
        reasons: ["R4: question class unanswerable from imagery"],
        latency_s: 0.8,
        mode: "chat",
        version: "mock"
      }
    };
  }
  return {
    ...parseAnswer("[ANSWERED] MOCK: 3 buildings and 2 vehicles detected, each boxed on the evidence image.\n\nconfidence: 76/100"),
    markedUrl: "assets/mock_marked.png",
    meta: {
      verdict: "ANSWERED",
      confidence: 76,
      reasons: ["R7: crop check verified evidence boxes #1, #2, #3", "R6: overlap audit passed (no redundant boxes)"],
      latency_s: 2.5,
      mode: "chat",
      version: "mock"
    }
  };
}

async function mockCompare(question) {
  await sleep(3200);
  const q = String(question || "").toLowerCase();
  if (q.includes("population") || q.includes("who owns") || q.includes("price") || q.includes("refuse")) {
    return {
      ...parseAnswer("[REFUSED] Satellite pixels cannot answer this — population, demographics, names, prices, ownership, reasons, predictions and personal data are not visible from above. Refusing by design.\n\nconfidence: 100/100"),
      markedUrl: "assets/mock_marked.png",
      meta: {
        verdict: "REFUSED",
        confidence: 100,
        reasons: ["R4: question class unanswerable from imagery"],
        latency_s: 0.9,
        retries: 0,
        mode: "compare",
        changes_count: 0,
        change_types: {},
        interval_months: 6,
        version: "mock"
      }
    };
  }
  return {
    ...parseAnswer("[ANSWERED] MOCK: vegetation loss along the river edge and one new structure north-east.\n\nChanges detected (boxed on the present image): new structure x 1, vegetation loss x 3\n\nconfidence: 71/100"),
    markedUrl: "assets/mock_marked.png",
    meta: {
      verdict: "ANSWERED",
      confidence: 71,
      reasons: ["R6: 4 candidate change clusters audited", "1 merged duplicate dropped", "3 verified vegetation shifts"],
      latency_s: 3.2,
      mode: "compare",
      changes_count: 4,
      change_types: { "new structure": 1, "vegetation loss": 3 },
      interval_months: 6,
      version: "mock"
    }
  };
}
