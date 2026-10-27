================================================================================
    PROMPT 03 — FRONTEND AGENT  (paste-ready, self-contained)
   "Build the SatQuery chat interface — two modes, real Gradio endpoints"
================================================================================

HOW TO USE: paste everything between the >>>>>>>>> markers into the frontend
dev's coding agent (Cursor / Claude Code / Copilot) as ONE message, with
prompts/01-ENDPOINT-CONTRACT.md attached above it. Attach the team's mockup
file (ai_vision_analysis_app_wireframe_prototype.html) if the agent can read
files — it is the visual reference. WHEN: immediately at H+0, in mock mode —
this lane needs ZERO Kaggle access until the live-wire moment at H+3.

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

CONTEXT: SatQuery AI, hackathon ST-09. A locked architecture exists
(ARCHITECTURE-LOCK.txt v1.0) plus the approved DIRECT-MODE endpoint contract
v1.1 (prompts/01-ENDPOINT-CONTRACT.md — your bible). Your job: build the
public chat interface so every button performs its task against those
endpoints, exactly as specified. Execution, not redesign.

YOU ARE BUILDING: a static, hostable chat interface (single page, vanilla
HTML + CSS + JS, no build step required) with TWO modes and a live engine
connection layer. Deploy target: any static host (Vercel / Netlify drop /
GitHub Pages). The approved mockup defines the look; the endpoint contract
defines the behaviour.

THE MOCKUP (visual reference — follow layout, IDs and button placement; its
simulated backend logic is throwaway):
  - Dark slate theme (#0f172a / #1e293b), indigo accents, Inter font,
    FontAwesome icons, Tailwind (CDN fine for the static page).
  - Header: logo "VisionAI · Kaggle Pipeline", mode toggle (Interactive /
    Comparison), status badge.
  - Left sidebar: "What?" blurb, demo preset buttons, Limitations list.
  - MODE 1 "Interactive": chat history window; bottom bar with a '+'
    image-upload button (thumbnail preview + remove), text input, a
    CONFIDENCE dropdown (100% Strict / 80% Balanced / 50% Exploratory),
    and a GO submit button.
  - MODE 2 "Comparison": two dashed upload slots (PAST 5–6 months ago /
    PRESENT current), a "Run Kaggle Comparative Analysis" button, and a
    result panel with stat cards (Interval, Progression Status,
    Confidence Grade) + analytical findings text.
  - Mockup bugs to fix while building: (1) the mode buttons carry duplicate
    class attributes — clean that up; (2) ADD a question input to the
    Comparison mode (the team decision: questions ARE asked in comparison);
    (3) the confidence dropdown values must become NUMBERS 1.0 / 0.8 / 0.5
    in the payload — "80%" strings must never reach the endpoint.

──────────────────────────────────────────────────────────────────────────────
FILE 1 of 2 — api.js  (the ONE module that talks to the engine; verbatim)
──────────────────────────────────────────────────────────────────────────────

// ═══ SatQuery API layer — DIRECT MODE v1.1 ═════════════════════════════
// Contract: prompts/01-ENDPOINT-CONTRACT.md. This is the single AI
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
  const q  = new URLSearchParams(location.search).get("api");
  const ls = localStorage.getItem(LS_KEY);
  return (q || ls || CONFIG.baseUrl || "").replace(/\/+$/, "");
}
export function setApiBase(u) {
  localStorage.setItem(LS_KEY, String(u).replace(/\/+$/, ""));
}
export function clearApiBase() { localStorage.removeItem(LS_KEY); }
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
async function mockChat() {
  await sleep(2500);
  return { ...parseAnswer("[ANSWERED] MOCK: 3 buildings and 2 vehicles "
      + "detected, each boxed on the evidence image.\n\nconfidence: 76/100"),
    markedUrl: "assets/mock_marked.png",
    meta: { verdict: "ANSWERED", confidence: 76, reasons: ["mock mode"],
            latency_s: 2.5, mode: "chat", version: "mock" } };
}
async function mockCompare() {
  await sleep(3200);
  return { ...parseAnswer("[ANSWERED] MOCK: vegetation loss along the river "
      + "edge and one new structure north-east.\n\nChanges detected (boxed on "
      + "the present image): new structure x 1, vegetation loss x 3\n\n"
      + "confidence: 71/100"),
    markedUrl: "assets/mock_marked.png",
    meta: { verdict: "ANSWERED", confidence: 71, reasons: ["mock mode"],
            latency_s: 3.2, mode: "compare", changes_count: 4,
            change_types: { "new structure": 1, "vegetation loss": 3 },
            interval_months: 6, version: "mock" } };
}

──────────────────────────────────────────────────────────────────────────────
FILE 2 of 2 — the page  (structure, wiring, states — build to THIS spec)
──────────────────────────────────────────────────────────────────────────────

BUTTON → ENDPOINT MAP (every interactive element does its ONE job):

| Element                    | Mode        | Action on click/submit            |
|----------------------------|-------------|------------------------------------|
| '+' upload (bottom bar)    | Interactive | file picker → thumbnail preview,  |
|                            |             | hold File in state; remove button  |
|                            |             | clears it. No network call.        |
| Confidence dropdown        | Interactive | sets threshold value 1.0/0.8/0.5  |
|                            |             | (NUMBERS). Sent as /chat arg 3.    |
| GO button / Enter key      | Interactive | calls api.chat({image, question,   |
|                            |             | threshold}) → renders AI bubble    |
| '+' upload (PAST slot)     | Comparison  | file picker → fills slot preview.  |
|                            |             | No network call.                   |
| '+' upload (PRESENT slot)  | Comparison  | file picker → fills slot preview.  |
|                            |             | No network call.                   |
| Question input (NEW)       | Comparison  | text for /compare arg 3            |
| Run Comparative Analysis   | Comparison  | validate BOTH slots filled (else   |
|                            |             | inline error, not alert()) →       |
|                            |             | api.compare({pastImage,            |
|                            |             | presentImage, question,            |
|                            |             | intervalMonths: 6}) → render panel |
| Health dot / status badge  | both        | api.health() on load + every 20 s  |
| Settings gear (header)     | both        | modal: paste engine URL →          |
|                            |             | setApiBase(url) → re-check health  |
| Sidebar demo presets       | both        | load bundled sample images into    |
|                            |             | the right slots (mock-friendly)    |

AI MESSAGE RENDERING (both modes — identical component):
  1. verdict badge  — ANSWERED (green #16a34a) / UNCERTAIN (amber #d97706) /
     REFUSED (red #dc2626) / ERROR (red) — from parseAnswer().verdict.
  2. body text      — parseAnswer().body (tag and confidence line stripped).
  3. confidence bar — parseAnswer().confidence on the 4 bands
     (80–100 green, 55–79 amber, 30–54 orange #ea580c, refused none).
     Number absent → verdict-only styling; NEVER fabricate a number.
  4. marked image   — result.markedUrl, generous size, click-to-zoom if
     cheap. This is the evidence the product is judged on.
  5. audit tooltip  — hover badge/bar → meta.reasons list; latency chip
     "· 14.2 s" from meta.latency_s.
  6. below-bar note — if body contains "below your selected bar", style the
     whole answer with the low-confidence warning treatment (orange border).

COMPARISON RESULT PANEL (maps the mockup's cards to REAL data):
  - Interval Elapsed    ← meta.interval_months + " months" (passthrough)
  - Progression Status  ← verdict + summary: ANSWERED + changes_count 0 →
    "Stable / Minimal Variance" (green); changes_count > 0 →
    "Changes Detected" (amber); REFUSED → "Refused — see reason" (red)
  - Confidence Grade    ← band name + number ("High (84/100)")
  - Findings text       ← body text
  - marked image        ← markedUrl (boxes are on the PRESENT image)
  - NO similarity score. The mockup's "94.2% Similarity" is demo theater;
    the real contract ships change counts and types. Do not fake one.

UI STATES (all of them — this is what "never stuck" looks like):
  - THINKING: after GO / Run — user bubble immediately, AI bubble shows
    spinner + elapsed timer ("Analysing… 12 s"). Optional: queue position
    via app.submit() event stream.
  - SEND LOCK: while a job is in flight the send controls disable (the
    worker queue is serial); re-enable on completion/error.
  - OFFLINE: health() fails or watchdog fires → amber banner "AI engine
    offline — a Kaggle session is restarting, back in ~10 minutes." +
    button "Open engine settings". Send disabled. Health poll continues
    and auto-flips back to online.
  - ERROR: answer starts "[ERROR]" → render the message + Retry button.
  - MOCK: isMock() → small "MOCK MODE" chip next to the status badge; all
    flows work against canned answers + assets/mock_marked.png.
  - RECONNECT: settings modal (gear) — input pre-filled with getApiBase(),
    Save → setApiBase → health() → banner updates; also "Use mock mode"
    button → clearApiBase(). Support ?api=<url> deep-link too.

HARD RULES:
  1. POSITIONAL ARRAYS only — api.js already encodes them; never convert
     to object form (contract §3 rule 1, the #1 integration failure).
  2. Single touchpoint: only api.js touches the network. If you need a new
     call shape, change api.js — not scattered fetch() calls.
  3. Host the page over http(s) — file:// breaks SSE/fetch in strict
     browsers (contract §5 CORS note).
  4. Verdict/confidence parsing follows contract §4 exactly; a REFUSED
     answer is a SUCCESS state — render it as designed, never as an error.
  5. Keep the mockup's tone: dark slate, indigo Interactive / emerald
     Comparison accents, calm professional copy. No lorem ipsum.
  6. Images: client-side validation max 20 MB, jpg/jpeg/png/webp, both
     dimensions ≥ 256 px (mirrors AI-AGENT-BUILD-SPEC §5).
  7. 30-minute landing rule per feature; if a nicety (queue position,
     click-to-zoom) eats time, drop it — core flows first.

ACCEPTANCE (all green before reporting done — mock mode needs no backend):
  1. Page hosted (any static host), loads with MOCK chip if no URL set.
  2. Interactive: upload + question + 80% → mock AI bubble with badge,
     bar (76 → amber band), marked image, audit tooltip, 2.5 s later.
  3. Interactive: no image + GO → disabled (need image or question).
  4. Comparison: only one slot filled → inline error message, no call.
  5. Comparison: both slots + question → mock panel with 4 stat cards +
     findings + marked image, 3.2 s later.
  6. Settings gear: paste any URL → health check runs → offline banner
     (URL unreachable) → clear → back to mock mode. ?api= param works.
  7. Refusal rendering: temporarily hard-code a mock answer starting
     "[REFUSED] Satellite pixels cannot answer this… confidence: 100/100"
     → red badge, no bar, reason shown. Then revert.
  8. Live-wire day (when the team gives you the gradio.live URL): set it
     via settings gear → smoke A (real /chat) + smoke B (real /compare)
     pass end-to-end with real marked images.

BUILD ORDER: page shell + mode toggle → api.js → Interactive flow in mock
→ health/status/settings → Comparison flow in mock → states (offline,
error, lock) → polish. Report the hosted URL when acceptance 1–7 pass.

<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

NOTE FOR THE H+26 FULL SUBMISSION: the static page is the PROTOTYPE lane
(H+6 gate). The full submission upgrades to the Next.js + Supabase app per
AI-AGENT-BUILD-SPEC.txt (auth, persistent history, durable marked images).
The endpoint contract is shared, so this work is NOT throwaway: api.js's
chat()/compare() map 1:1 onto lib/engine.ts's triggerWorker() — same
positional-array discipline, same answer protocol.
================================================================================
