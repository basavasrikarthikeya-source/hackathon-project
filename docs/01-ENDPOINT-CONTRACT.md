================================================================================
        SATQUERY — GRADIO ENDPOINT CONTRACT (DIRECT MODE v1.1)
   The strong endpoint layer the frontend wires its buttons to. ONE file,
   shared by every team member and every AI coding agent. If any file in
   this kit disagrees with THIS file about an endpoint, THIS file wins.
================================================================================

Version : 1.1  (DIRECT MODE extension — see prompts/06-ARCHITECTURE-OVERVIEW.md)
Date    : 27 October 2026
Project : ST-09 SatQuery — Chakravyuh 2026
Audience: EVERYONE — frontend dev, backend dev, Kaggle operator, all coding agents
Relation to ARCHITECTURE-LOCK v1.0: this ADDS four named API endpoints to the
Gradio worker. The locked Supabase path (/predict + jobs table) is unchanged
and byte-identical. Direct mode is a V-tier extension approved by the team
lead for the H+6 prototype gate.

--------------------------------------------------------------------------------
0. WHY THIS FILE EXISTS (READ ONCE)
--------------------------------------------------------------------------------

The team frontend is a chat interface with TWO modes (the approved mockup):

  MODE 1 — INTERACTIVE: one image + a question + a confidence-threshold
  selector (100% / 80% / 50%). Press GO → the AI answers with evidence
  boxes drawn on the image, a verdict badge, and a confidence score.

  MODE 2 — COMPARISON: TWO images (PAST = 5–6 months ago, PRESENT = current)
  + a question about what changed. Press "Run Comparative Analysis" → the AI
  returns a typed change report, change boxes drawn on the PRESENT image,
  stats, and a confidence grade.

Every button in that interface maps to exactly ONE endpoint in this file.
Nothing is invented at integration time — the frontend and the backend are
built against the SAME signatures from hour zero, which is why nobody gets
stuck on connectivity.

THE WORKER IS THE KAGGLE NOTEBOOK. Kaggle accepts no inbound connections, so
the Gradio app dials OUT with launch(share=True), which prints a public URL:

    https://<random>.gradio.live            <- THE engine address

That URL is CONFIGURATION, never code. It changes whenever the Kaggle session
restarts. Section 7 defines the runtime-override pattern so a URL change costs
30 seconds and ZERO redeploys.


--------------------------------------------------------------------------------
1. THE FOUR ENDPOINTS (THE CONTRACT, IN FULL)
--------------------------------------------------------------------------------

The worker is a gr.Blocks app (code in prompts/02-PROMPT-BACKEND-KAGGLE.md)
with EXPLICIT api_name on every bound event — that is what makes the routes
stable and predictable. All calls use POSITIONAL ARRAYS (Section 3).

┌──────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT 1 — /health                                                         │
│ Purpose   : liveness + status. No GPU, returns in <100 ms.                   │
│ Called by : frontend on page load, then every 20 s (health poll).            │
│ Inputs    : none                    → payload: []                            │
│ Output    : [ status_json ]  where status_json is:                           │
│   {                                                                          │
│     "status"     : "online",                                                 │
│     "model"      : "Qwen2.5-VL-3B-Instruct (4-bit)",                         │
│     "engine"     : "refusal-v2 (24/24 self-tests)",                          │
│     "queue"      : 0,                                                        │
│     "uptime_min" : 41.7,                                                     │
│     "version"    : "st09-direct-v1.1"                                        │
│   }                                                                         │
│ Frontend   : green dot "Engine online · v1.1" while status=="online";        │
│              anything else → amber dot + offline banner (Section 7).         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT 2 — /chat  (MODE 1: INTERACTIVE — one image + question)             │
│ Purpose   : single-image grounded Q&A with the full refusal engine v2.       │
│ Called by : the GO button / Enter key in Interactive mode.                   │
│ Inputs    (positional array, EXACTLY this order):                           │
│   [0] image               : File | Blob | null   (the uploaded image)        │
│   [1] question            : string              (may be "" → auto-prompt)    │
│   [2] confidence_threshold: number              (1.0 | 0.8 | 0.5 — NUMERIC,  │
│                             NOT the "80%" string from the mockup)            │
│ Outputs   (positional array):                                                │
│   [0] answer    : string —  "[VERDICT] <human answer text>                   │
│                               \n\nconfidence: N/100"   (parse rules §4)      │
│   [1] marked    : image file — the SAME image with red evidence boxes;       │
│                   on REFUSED/ERROR it is the untouched original              │
│   [2] meta      : JSON string —                                              │
│   {                                                                          │
│     "verdict"   : "ANSWERED" | "UNCERTAIN" | "REFUSED" | "ERROR",            │
│     "confidence": 76,                         // 0-100 integer               │
│     "reasons"   : ["R7: crop check REJECTED box #1 -> dropped", ...],        │
│     "latency_s" : 14.2,                                                      │
│     "mode"      : "chat",                                                    │
│     "version"   : "st09-direct-v1.1"                                         │
│   }                                                                         │
│ Threshold semantics (the 100/80/50 dropdown): the engine ALWAYS computes     │
│ its own 0-100 confidence. The dropdown is the USER's bar. If computed        │
│ confidence < bar, the answer is still returned, but the backend appends:     │
│   "Note: confidence N/100 is below your selected bar (B/100). Treat this     │
│    as a lead for manual review, not a fact."                                 │
│ The threshold NEVER causes a refusal — refusal is rule-driven (R0–R7),       │
│ not preference-driven. The frontend styles below-bar answers with the        │
│ low-confidence warning (amber/orange band).                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT 3 — /compare  (MODE 2: COMPARISON — two images + question)          │
│ Purpose   : temporal change analysis. One model call, BOTH images, one       │
│             question. Boxes land on the PRESENT image (the "after").         │
│ Called by : the "Run Comparative Analysis" button.                           │
│ Inputs    (positional array, EXACTLY this order):                           │
│   [0] past_image     : File | Blob   (PAST slot — 5–6 months ago)            │
│   [1] present_image  : File | Blob   (PRESENT slot — current scan)           │
│   [2] question       : string        (comparison question; "" → default      │
│                        "What changed between these two images?")             │
│   [3] interval_months: number        (default 6; shown in the result stats)  │
│ Outputs   (positional array):                                                │
│   [0] report   : string — "[VERDICT] <summary sentence>                      │
│                    \n\nChanges detected (boxed on the present image):        │
│                    <type x count, ...>                                        │
│                    \n\nconfidence: N/100"                                    │
│   [1] marked   : image file — PRESENT image with red boxes on every change   │
│   [2] meta     : JSON string —                                              │
│   {                                                                          │
│     "verdict"        : "ANSWERED" | "UNCERTAIN" | "REFUSED" | "ERROR",       │
│     "confidence"     : 71,                                                   │
│     "reasons"        : [...audit trail...],                                  │
│     "latency_s"      : 18.9,                                                 │
│     "retries"        : 0,                                                    │
│     "mode"           : "compare",                                            │
│     "changes_count"  : 5,                                                    │
│     "change_types"   : {"new structure": 2, "vegetation loss": 3},           │
│     "interval_months": 6,                                                    │
│     "version"        : "st09-direct-v1.1"                                    │
│   }                                                                         │
│ Frontend stat cards map: Interval ← interval_months; Progression Status ←    │
│ verdict + summary (Stable/Changes detected/Refused); Confidence Grade ←     │
│ the confidence bands in §4. changes_count feeds the headline number.         │
│ NOTE: the mockup's "94.2% Similarity" card is demo theater — the real        │
│ contract returns change counts and types, not a similarity score. Do not     │
│ fabricate one in the UI.                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT 4 — /predict  (LOCKED — Supabase two-channel path, UNCHANGED)       │
│ Purpose   : the ARCHITECTURE-LOCK v1.0 worker doorbell for the               │
│             Vercel+Supabase production frontend. The DIRECT-mode page        │
│             NEVER calls this. Kept here so one worker can serve both.        │
│ Inputs    (positional array): [ job_id, prompt, image_paths[] ]              │
│ Output    : [ string ] — echo of answer text or "ERROR: ..."                 │
│ Full spec : ARCHITECTURE-LOCK.txt §7.2 + AI-AGENT-BUILD-SPEC.txt §6.         │
│ In the direct-mode prototype session this endpoint returns                   │
│ "ERROR: supabase path disabled (direct-mode prototype worker)" until         │
│ ENABLE_SUPABASE is flipped — that is correct behaviour, not a bug.           │
└──────────────────────────────────────────────────────────────────────────────┘


--------------------------------------------------------------------------------
2. SEQUENCE AND TIMING (WHAT TO EXPECT)
--------------------------------------------------------------------------------

- Inference on a T4 takes 8–25 s per question; comparisons 15–40 s.
- The worker queue is SERIAL (one GPU): concurrent demo requests queue in
  order. With @gradio/client, app.submit() streams queue-position events
  ("queue: 2 of 3") if you want a live position indicator (optional).
- The frontend watchdog for direct mode is 150 s (inference + queue margin).
  No result by then → treat as offline: amber banner, retry option.
- REFUSED answers are FAST (R0/R4 fire before any GPU call, <1 s).
- /health is exempt from the serial queue (parallel-safe, no GPU).


--------------------------------------------------------------------------------
3. CALLING METHOD A (PRIMARY) — @gradio/client FROM THE BROWSER
--------------------------------------------------------------------------------

For the static mockup-style page this is the recommended path: it handles
file uploads, queueing, and the event protocol for you.

  <!-- index.html -->
  <script type="module">
    import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/+esm";
    ...
  </script>

  // api.js — the ONE module that talks to the engine (full file in
  // prompts/03-PROMPT-FRONTEND.md)
  const app  = await Client.connect("https://xxxx.gradio.live");
  const r    = await app.predict("/chat", [imageFile, question, 0.8]);
  // r.data === [answerString, {path, url, ...}, metaJsonString]

RULES THAT MAKE OR BREAK THE CALL:
  1. POSITIONAL ARRAY, never object form:
       app.predict("/chat", [file, "question", 0.8])        // ✅ CORRECT
       app.predict("/chat", {image: ..., question: ...})    // ❌ FAILS
     Object keys never match the auto-generated component names — the classic
     "parameter error". This exact mistake is the #1 integration failure.
  2. Endpoint names carry the leading slash: "/chat", "/compare",
     "/health", "/predict" — matching api_name= in the worker.
  3. Images are passed as File/Blob objects (the client uploads them to the
     Gradio server automatically and converts to a server path).
  4. The returned image arrives as an object — read r.data[1].url for the
     displayable URL. It lives on the Gradio server and stays valid while
     the session runs (ephemeral — fine for chat display; the Supabase path
     is the durable one).
  5. Pin the versions: worker `pip install -U "gradio>=5"`; browser client
     @gradio/client@1. An old preinstalled Gradio 3.x speaks a different
     protocol (/api/predict routes) and gives 404s.


--------------------------------------------------------------------------------
4. THE ANSWER PROTOCOL (PARSE IT EXACTLY LIKE THIS)
--------------------------------------------------------------------------------

Every /chat and /compare text output follows ONE shape:

    [ANSWERED] I count 3 buildings — residential. Each one is boxed on the
    evidence image.

    confidence: 76/100

Parsing contract (byte-consistent with AI-AGENT-BUILD-SPEC.txt §9 and
OPERATIONS-26H.md §4):

  verdict    = /^\s*\[(ANSWERED|UNCERTAIN|REFUSED|ERROR)\]\s*/i   → strip it
               from the bubble text and render it as the badge
  confidence = /confidence:\s*(\d+)\s*\/\s*100/i                   → the bar;
               line absent → verdict-only styling, NEVER a fake number
  meta       = JSON.parse(data[2]) for the reasons[] tooltip + latency chip

Display bands (fixed colours — same as the whole kit):

  | Band    | Range    | Colour         | Meaning                                  |
  |---------|----------|----------------|------------------------------------------|
  | High    | 80–100   | green #16a34a  | evidence complete, self-checks passed    |
  | Medium  | 55–79    | amber #d97706  | usable, check the marked image           |
  | Low     | 30–54    | orange #ea580c | treat as a lead, not a fact              |
  | Refused | —        | red #dc2626    | no number; show the refusal reason       |

Tooltip on the badge/bar shows meta.reasons — the audit trail IS the product.


--------------------------------------------------------------------------------
5. CALLING METHOD B (FALLBACK) — RAW REST, ZERO DEPENDENCIES
--------------------------------------------------------------------------------

Gradio ≥ 4 exposes a REST event API on the tunnel. Use this if the CDN
module import is blocked or you want pure fetch:

  BASE = https://xxxx.gradio.live

  STEP 1 — upload images (only when the call carries files):
    POST {BASE}/gradio_api/upload        multipart/form-data, field "files"
    → ["tmp/gradio/abc123/img_0.png"]    (server file paths)

  STEP 2 — submit the call:
    POST {BASE}/gradio_api/call/chat
    Content-Type: application/json
    { "data": ["tmp/gradio/abc123/img_0.png", "how many buildings?", 0.8] }
    → { "event_id": "e5f6..." }

  STEP 3 — read the result (Server-Sent Events stream):
    GET {BASE}/gradio_api/call/chat/{event_id}     (fetch + ReadableStream)
    event: complete
    data: ["[ANSWERED] ...", {"path": "...", "url": "..."}, "{...meta...}"]

  /health has no files: STEP 1 skipped, body { "data": [] }.
  /compare submits [pastPath, presentPath, question, 6].

CORS: the gradio.live relay sends Access-Control-Allow-Origin: * — pages
served from https (Vercel/Netlify/GitHub Pages) connect fine. Pages opened
via file:// sometimes fail SSE in strict browsers — always HOST the page.


--------------------------------------------------------------------------------
6. CALLING METHOD C — TESTING FROM PYTHON / CURL
--------------------------------------------------------------------------------

Python (gradio_client, for smoke tests and the Kaggle operator):

    pip install -U gradio_client
    from gradio_client import Client, handle_file
    app = Client.connect("https://xxxx.gradio.live")

    app.predict("/health", [])                                    # status dict
    r = app.predict("/chat", [handle_file("test.png"),
                              "How many buildings are in this image?", 0.8])
    print(r)          # [answer, marked_path, meta_json]
    r = app.predict("/compare", [handle_file("past.png"),
                                 handle_file("present.png"),
                                 "What changed here?", 6])

curl /health (two steps, REST):

    curl -X POST https://xxxx.gradio.live/gradio_api/call/health \
         -H "Content-Type: application/json" -d '{"data": []}'
    #  -> {"event_id":"..."}   then:
    curl -N https://xxxx.gradio.live/gradio_api/call/health/<event_id>
    #  -> event: complete \n data: [{"status": "online", ...}]

Full runnable smoke-test scripts: prompts/05-GRADIO-CONNECTION-PROMPTS.md.


--------------------------------------------------------------------------------
7. THE TUNNEL URL IS CONFIGURATION — THE "NEVER STUCK" PATTERN
--------------------------------------------------------------------------------

The gradio.live URL changes at every session restart (Kaggle kills sessions
at 9–12 h). The frontend therefore treats it as RUNTIME configuration:

  Resolution order (first non-empty wins):
    1. ?api=https://...  URL query parameter
    2. localStorage key  "satquery_api_base"     (set by the settings gear)
    3. build-time default (NEXT_PUBLIC_GRADIO_URL / CONFIG.baseUrl)

  UI: a gear button in the header opens "Engine settings" → paste fresh URL
  → Save (writes localStorage) → immediate /health re-check → banner flips
  green. Session rotation costs 30 seconds, no redeploy, no developer.

  Offline banner text: "AI engine offline — a Kaggle session is restarting.
  Back in ~10 minutes." Health poll every 20 s auto-flips it back online.

  Mock mode: baseUrl unset or "mock" → canned answers + bundled sample
  marked image, 2.5 s delay. The frontend is fully buildable with ZERO
  Kaggle access (this is what makes the H+6 gate realistic).


--------------------------------------------------------------------------------
8. ERROR SEMANTICS (WHAT EACH FAILURE MEANS)
--------------------------------------------------------------------------------

  | Symptom                          | Meaning                    | Fix         |
  |----------------------------------|----------------------------|-------------|
  | predict throws "parameter error" | object-form payload        | §3 rule 1   |
  | 404 on /gradio_api/call/...      | old Gradio or wrong name   | pin gradio≥5|
  | connect() fails                  | session dead / wrong URL   | §7 + relaunch drill |
  | answer starts "[ERROR]"          | worker-side exception      | read Kaggle |
  |                                  |                            | cell output |
  | watchdog fires (150 s)           | offline or queue stuck     | banner+retry|
  | "[REFUSED] ..."                  | NOT an error — the product | render as   |
  |                                  |                            | designed    |

A worker NEVER crashes on a bad request: every endpoint wraps its body in
try/except and returns an "[ERROR] ..." answer string with meta.verdict ==
"ERROR". The UI shows the message + retry button; nothing hangs.


--------------------------------------------------------------------------------
9. CHANGE CONTROL
--------------------------------------------------------------------------------

The four endpoint names, their positional orders, and the answer protocol
(§4) are now part of the team contract — changing any of them is an L-tier
change: team decision + version bump of this file. Everything else (styling
of the marked image, extra meta fields, queue tuning) is V-tier and free.
================================================================================
