================================================================================
  PROMPT 05 — GRADIO CONNECTION PROMPTS (the "are we connected?" toolkit)
     Every connectivity test, smoke test, and stuck-moment prompt in one place
================================================================================

HOW TO USE: each numbered block is a standalone prompt/script. Use them in
this order the first time (§1 → §6). After that, jump to whatever matches
your symptom (§7 decision tree). Blocks marked [AGENT] are paste-ready
prompts for a coding agent or an AI assistant; blocks marked [RUN] are
runnable scripts (Python via gradio_client, or shell). WHEN: integration
moments (H+3 live wire, every relaunch), and any time anyone says
"it's not connecting".

The endpoint definitions they test live in prompts/01-ENDPOINT-CONTRACT.md.
Every script assumes BASE = your current gradio.live URL, e.g.
https://a1b2c3d4e5f6.gradio.live — replace it everywhere it appears.


--------------------------------------------------------------------------------
§1 [RUN] THE 30-SECOND CONNECTIVITY CHECK (do this FIRST, always)
--------------------------------------------------------------------------------

One-liner from any laptop with Python (gradio_client talks the full
protocol — it is the reference client):

    pip install -U gradio_client
    python -c "
    from gradio_client import Client
    app = Client.connect('https://xxxx.gradio.live')
    print(app.predict('/health', []))
    "

PASS: prints a dict with "status": "online", "version": "st09-direct-v1.1",
      "engine": "refusal-v2 (24/24 self-tests)".
FAIL → §7 decision tree, row 1.

No Python handy? curl variant (two steps):

    curl -X POST https://xxxx.gradio.live/gradio_api/call/health \
         -H "Content-Type: application/json" -d '{"data": []}'
    #   -> {"event_id":"..."}  — then, with that id:
    curl -N https://xxxx.gradio.live/gradio_api/call/health/<event_id>

PASS: an SSE body containing event: complete and
data: [{"status": "online", ...}].

Even simpler browser check: open https://xxxx.gradio.live in any browser —
the worker's own manual test console should render (tabs: chat / compare /
health / predict). If the page loads but your app can't connect, it is a
frontend-side issue (URL typo, file:// protocol, object-form payload).


--------------------------------------------------------------------------------
§2 [RUN] SMOKE TEST A — /chat END-TO-END (single image)
--------------------------------------------------------------------------------

    from gradio_client import Client, handle_file

    BASE = "https://xxxx.gradio.live"
    app  = Client.connect(BASE)

    r = app.predict("/chat", [
            handle_file("test_image.png"),           # a real satellite crop
            "How many buildings are in this image?",
            0.8,                                      # threshold: NUMBER
        ])
    answer, marked, meta = r
    print("ANSWER :", answer[:300])
    print("MARKED :", marked)
    print("META   :", meta)

PASS: answer starts with [ANSWERED] / [UNCERTAIN] / [REFUSED] and contains
"confidence: N/100"; marked points at a file that exists; meta JSON parses
with verdict + reasons + latency_s. REFUSED is a PASS (the engine is
working) — check the reason to see which rule fired.

Also test the R4 fast-refusal path (must return in ~1 s, no GPU):

    r = app.predict("/chat", [
            handle_file("test_image.png"),
            "What is the population of this area?",
            0.8])
    print(r[0])      # -> [REFUSED] Satellite pixels cannot answer this ...

And the threshold note path (ask something borderline with 1.0):

    r = app.predict("/chat", [
            handle_file("test_image.png"),
            "Is there any vegetation near the road?", 1.0])
    print(r[0])      # may append "below your selected bar (100/100)"


--------------------------------------------------------------------------------
§3 [RUN] SMOKE TEST B — /compare END-TO-END (two images)
--------------------------------------------------------------------------------

    from gradio_client import Client, handle_file

    BASE = "https://xxxx.gradio.live"
    app  = Client.connect(BASE)

    r = app.predict("/compare", [
            handle_file("past.png"),        # PAST  slot (5–6 months ago)
            handle_file("present.png"),     # PRESENT slot (current)
            "What changed between these two images?",
            6,                              # interval_months
        ])
    report, marked, meta = r
    print("REPORT:", report[:400])
    print("MARKED :", marked)
    print("META   :", meta)

PASS: report has [VERDICT] + "Changes detected ... :" + "confidence: N/100";
marked exists and is the PRESENT image with red boxes; meta.changes_count
and meta.change_types parse. Sanity: swap the two images' order and the
report should still be coherent but may differ — if you get nonsense or
an ERROR, check both images pass the R0 gate (≥256 px, not blank).


--------------------------------------------------------------------------------
§4 [AGENT] THE FRONTEND CONNECTION TEST PROMPT
--------------------------------------------------------------------------------

Paste into the frontend dev's coding agent (or run by hand in the browser
console on the HOSTED page — must be http(s), not file://):

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
Run this in the browser console (or as a temporary test button) against our
hosted page, using the engine URL <BASE>:

  import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/+esm";
  const app = await Client.connect("<BASE>");
  const h   = await app.predict("/health", []);
  console.log("HEALTH:", h.data);
  // then, with an <input type="file"> selected in the DOM:
  const f = document.querySelector("#interactive-file-input").files[0];
  const r = await app.predict("/chat", [f, "How many buildings?", 0.8]);
  console.log("ANSWER:", r.data[0]);
  console.log("MARKED URL:", r.data[1] && r.data[1].url);
  console.log("META:", r.data[2]);

Report the three console outputs verbatim. If predict throws a parameter
error, we sent object-form instead of a positional array — fix the call to
the positional form above and re-run. If connect() throws, the engine is
offline — report that instead of retrying more than once.
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


--------------------------------------------------------------------------------
§5 [AGENT] THE "WIRE THE BUTTONS" RECHECK PROMPT
--------------------------------------------------------------------------------

Paste into the frontend agent at integration time (after §4 passes):

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
Re-verify every button against the endpoint map in prompts/03-PROMPT-
FRONTEND.md using the live engine URL <BASE>:
  1. GO button → /chat positional [File, question, threshold-number].
  2. Confidence dropdown → option values ARE numbers 1.0/0.8/0.5 (not
     "80%" strings) and reach the payload as arg 3.
  3. Run Comparative Analysis → /compare positional [pastFile,
     presentFile, question, 6] only after BOTH slots are filled.
  4. Health dot polls /health every 20 s; offline banner + settings gear
     work; ?api= URL param works.
  5. A [REFUSED] answer renders as the red badge state — NOT as an error.
For each item: PASS/FAIL + the exact payload sent. Do not fix styling, only
connection correctness.
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


--------------------------------------------------------------------------------
§6 [RUN] SMOKE TEST C — THE OFFLINE DRILL (as important as A)
--------------------------------------------------------------------------------

Kill the engine (stop the Kaggle session OR stop Cell W), then on the
hosted frontend:
  - within seconds → amber "AI engine offline" banner, send disabled;
  - an in-flight question → watchdog message within 150 s, retry offered;
  - relaunch (runbook Part D) → paste new URL in settings gear → banner
    flips green within one 20 s poll.
Judges trust graceful failure more than fragile success — rehearse this
once at H+4 so it looks planned in the demo (it is).


--------------------------------------------------------------------------------
§7 THE STUCK DECISION TREE (follow top to bottom — resolves 90%)
--------------------------------------------------------------------------------

  Q1. Does https://BASE open in a browser at all?
      NO  → session dead or URL typo → relaunch drill (runbook Part D).
      YES → Q2.

  Q2. Does §1 /health return "online"?
      NO, 404 on /gradio_api/call/health
          → old Gradio on the worker → re-run Cell 1 install
            (pip install -U "gradio>=5"), then re-run Cell W.
      NO, connect() timeout
          → gradio.live relay hiccup → wait 60 s, retry once; still bad
            → re-run Cell W (new URL).
      YES → Q3.

  Q3. Does §2 smoke A pass with a real image?
      NO, "[ERROR] ..." answer
          → read the Cell W traceback in the notebook output; the most
            common causes: R0 rejected the image (use ≥256 px non-blank),
            model OOM (drop to 1 image, reduce max_pixels).
      NO, "parameter error" from the client
          → object-form payload — positional array only (contract §3.1).
      YES → Q4.

  Q4. Does the HOSTED page connect (§4 console test)?
      NO from the page, YES from Python
          → frontend-side: page on file:// (host it), URL not set in
            settings gear, or ad-blocker eating the CDN import.
      YES → the engine is fine; any remaining issue is app logic —
            use the §5 recheck prompt.


--------------------------------------------------------------------------------
§8 ERROR → MEANING → FIX TABLE (print this next to the operator)
--------------------------------------------------------------------------------

  | Symptom                            | Meaning                | Fix       |
  |------------------------------------|------------------------|-----------|
  | gradio_client "parameter error"    | object-form payload    | positional|
  |                                    |                        | array     |
  | 404 on /gradio_api/call/<name>     | Gradio < 4 or wrong    | pin ≥ 5;  |
  |                                    | api_name               | check name|
  | connect() refused / timeout        | session dead / relay   | relaunch  |
  |                                    |                        | drill     |
  | answer "[ERROR] ..."               | worker exception       | notebook  |
  |                                    |                        | traceback |
  | answer "[REFUSED] ..."             | engine WORKING         | render as |
  |                                    |                        | designed  |
  | "R0" in reasons                    | image blank/tiny/      | better    |
  |                                    | extreme aspect         | image     |
  | "R4" in reasons                    | unanswerable class     | correct   |
  |                                    | (population, prices…)  | question  |
  | 150 s watchdog                     | offline / queue stuck  | banner +  |
  |                                    |                        | retry     |
  | marked image 404 in UI             | URL from a DEAD session| re-ask;   |
  |                                    | (gradio files are      | persist   |
  |                                    | ephemeral)             | via mock  |
  | CORS error in console              | page opened via file://| host the  |
  |                                    |                        | page      |
  | "ERROR: supabase path disabled"    | /predict called on a   | correct — |
  |                                    | direct-mode worker     | expected  |

--------------------------------------------------------------------------------
§9 THE ONE-SCREEN SUMMARY (for the group chat)
--------------------------------------------------------------------------------

  ENGINE URL : https://xxxx.gradio.live     (changes on every restart)
  HEALTH     : python -c "from gradio_client import Client as C; \
               print(C.connect('https://xxxx.gradio.live').predict('/health', []))"
  CHAT       : predict("/chat",   [image, question, 0.8])        # positional
  COMPARE    : predict("/compare",[past, present, question, 6])  # positional
  ANSWER     : "[VERDICT] text ... confidence: N/100"            # parse §4
  STUCK      : browser check → /health → smoke A → console test   # §7 tree
================================================================================
