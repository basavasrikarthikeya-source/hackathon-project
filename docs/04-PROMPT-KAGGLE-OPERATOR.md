================================================================================
   PROMPT 04 — KAGGLE OPERATOR RUNBOOK  (for YOU — the person driving Kaggle)
     "From zero to a live engine URL, then keep it alive for 26 hours"
================================================================================

This is not a paste-into-an-agent prompt — this is YOUR checklist. Print it
or keep it open. Every step has a DONE-WHEN condition. Total time to first
live URL: ~45–60 min (dominated by pip install + model download).

Companions: 01-ENDPOINT-CONTRACT.md (what the endpoints mean),
02-PROMPT-BACKEND-KAGGLE.md (the WORKER-PRO cell you will paste),
05-GRADIO-CONNECTION-PROMPTS.md (smoke-test scripts + what to do when stuck).

--------------------------------------------------------------------------------
PART A — FIRST BRING-UP (once per account, ~60 min)
--------------------------------------------------------------------------------

□ A1. Pick the account for the ENGINE rig (Rig A).
      Kaggle → New Notebook → File → Import Notebook → TIER0_CORE.ipynb.

□ A2. Settings (right sidebar):
        Accelerator   : GPU T4 ×2      (drop to 1 × T4 after bring-up —
                                        one T4 runs the 3B/4-bit engine and
                                        burns quota at HALF the rate)
        Internet       : ON             (required: pip, model download,
                                        gradio tunnel)
        Persisting     : on /kaggle/working is fine

□ A3. Run Cell 1 (installs). DONE WHEN: no red output; gradio ≥ 5 shown
      (`!pip show gradio` if unsure — if it is 3.x or 4.4x, re-run the
      install line once; old Gradio speaks the wrong API protocol and is
      the #1 cause of frontend 404s).

□ A4. Run Cell 2 (model load). DONE WHEN: "model loaded" message; first
      load downloads ~2 GB of weights (5–15 min depending on bandwidth).
      NEVER re-run this cell in the same session.

□ A5. Run Cell 3 (ask()). DONE WHEN: smoke line prints an answer on the
      campus test tile (or skips silently if no upload — also fine).

□ A6. Run Cell 4 (refusal engine v2). DONE WHEN:
        self-tests: 24 passed, 0 failed
      This is your proof artifact — screenshot it for the slides.

□ A7. Run Cell 5 (draw_answer). DONE WHEN: "draw_answer() ready".

□ A8. Upload a real test image (notebook upload widget) and try:
        r = ask_verified("your_image.jpg", "How many buildings are in this image?")
        print(r["verdict"], r["confidence"], r["clean"]["count"])
      DONE WHEN: sane verdict + count on YOUR image.

□ A9. Add ONE new cell below Cell 5, titled "Cell W — WORKER-PRO", and paste
      the full code block from prompts/02-PROMPT-BACKEND-KAGGLE.md (between
      the BEGIN/END CELL W markers). Run it.
      DONE WHEN: output prints a URL like:
        https://a1b2c3d4e5f6.gradio.live
      Screenshot + paste this URL into the team chat IMMEDIATELY — the
      frontend lane finishes the live wire without you.

□ A10. Health check (from ANY laptop, or a scratch cell):
        from gradio_client import Client
        print(Client.connect("https://xxxx.gradio.live").predict("/health", []))
      DONE WHEN: {"status": "online", "version": "st09-direct-v1.1",
      "engine": "refusal-v2 (24/24 self-tests)", ...}

□ A11. Run smokes A + B (single image / two images) from
        prompts/05-GRADIO-CONNECTION-PROMPTS.md §2.
      DONE WHEN: both answers carry [VERDICT] + confidence and a marked
      image file. THE ENGINE IS LIVE — go tell the team.

□ A12. Give the frontend the URL: they paste it into the settings gear
        (or open the page with ?api=https://xxxx.gradio.live). No redeploy
        needed. DONE WHEN: a question asked on the hosted page returns a
        real marked image.

--------------------------------------------------------------------------------
PART B — THE OTHER RIGS (parallel, per the 26 h plan)
--------------------------------------------------------------------------------

| Rig | Account | GPU | Runs | When |
|-----|---------|-----|------|------|
| A — ENGINE   | #1 | 1 × T4 | Cells 1–5 + Cell W, all day | NOW |
| B — EVAL     | #2 | 1 × T4 | Cells 6–9 (RSVQA + hallucination) + Cell 11 export | H+6 onward |
| C — TIER 0.5 | #3 | 2 × T4 | TIER05_CORE.ipynb (SAM, forest, development) | H+6 onward |
| D — SPARE    | #4 | 1 × T4 | NOTHING until called | warm failover |

RIG D WARM-UP (do this once, ~20 min, then leave it idle):
  import TIER0_CORE.ipynb → run Cells 1–5 → STOP (do not run Cell W yet).
  When Rig A dies, you run ONE cell (Cell W) on Rig D and hand the new URL
  to the frontend: total failover under 3 minutes. This is your insurance
  against "we are stuck with connectivity" — you always have a second
  engine one cell away from live.

Upload demo assets (big neighbourhood image, forest pair, 2019/2026 pair,
LISS-3 tile) as a PRIVATE Kaggle Dataset on account #1 → they mount at
/kaggle/input every session — never re-upload after a session death.

--------------------------------------------------------------------------------
PART C — KEEPING IT ALIVE (the session realities)
--------------------------------------------------------------------------------

- Kaggle kills interactive sessions at roughly 9–12 h. EXPECT 2–3 deaths
  during the 26 h. Every death costs one relaunch drill (Part D). Jobs are
  never lost — the frontend watchdog handles the gap gracefully by design.
- The gradio.live URL is regenerated at every Cell W run. Old URLs die with
  the session. This is why the frontend has the settings gear: 30-second
  swap, zero redeploy.
- Keep the notebook browser tab open; Kaggle reaps idle tabs faster.
- Quota math: 1 × T4 ≈ 30 GPU-h/week per account — Rig A at 26 h fits
  comfortably. Selecting BOTH T4s burns the quota at double rate; only
  Rig C needs both (SAM + Qwen co-loaded, ~5 GB of 32 GB).
- Share links live while the session lives (gradio.live relay, 72 h cap) —
  irrelevant here since sessions die first.

--------------------------------------------------------------------------------
PART D — THE RELAUNCH DRILL (practice it ONCE at H+4, target < 10 min)
--------------------------------------------------------------------------------

When the frontend banner goes amber (or the health poll fails):

  1. Open the Kaggle notebook (same account, Rig A — or Rig D if A is
     dead-dead) → Restart Session? No — just run:
        Cells 1 → 2 → 3 → 4 → 5 → W            (about 6–8 min incl. model load)
  2. Cell W prints the NEW gradio.live URL → paste into team chat.
  3. Frontend: gear → paste → Save → banner flips green. (Or reload the
     page with ?api=<new-url> — even faster.)
  4. Verify: /health returns "online", then one /chat smoke.

If the notebook itself is bricked: import TIER0_CORE.ipynb fresh on Rig D,
run Cells 1–5 + W. You are never more than ~10 min from live. If you saved
nothing else, this is why the kit is a single notebook.

--------------------------------------------------------------------------------
PART E — WHAT "STUCK" LOOKS LIKE AND THE 2-MINUTE TRIAGE
--------------------------------------------------------------------------------

  | Symptom                             | First move                          |
  |-------------------------------------|-------------------------------------|
  | gradio.live URL loads nothing       | session died → Part D drill         |
  | /health 404                         | old Gradio → re-run Cell 1 install  |
  | frontend "parameter error"          | object-form payload — frontend bug  |
  |                                     | (contract §3 rule 1)                |
  | predict hangs > 150 s               | queue stuck/offline → banner+retry, |
  |                                     | check the notebook cell output      |
  | "[ERROR]" answers                   | read the Cell W traceback in the    |
  |                                     | notebook → fix → re-run Cell W      |
  | Cell W won't launch ("port in use") | Run → Restart & Run All is overkill;|
  |                                     | instead: Runtime → Restart kernel → |
  |                                     | Cells 1–5 + W                       |

Full decision tree + runnable test scripts: 05-GRADIO-CONNECTION-PROMPTS.md.

--------------------------------------------------------------------------------
PART F — YOUR PERSONAL RULES FOR THE NEXT 26 HOURS
--------------------------------------------------------------------------------

  1. The URL is a broadcast, not a secret: every new gradio.live URL goes
     to the team chat the SECOND it prints.
  2. Two-hour rule: any single problem eating > 2 h → escalate to the team
     or switch to Rig D. You are the operator, not a debugger.
  3. Screenshot every green moment (self-tests, live answers, marked
     images) — they are your submission evidence.
  4. Do not touch Cells 1–5 logic during the last 6 hours. Feature freeze
     at H+20 means freeze.
  5. When in doubt: /health first, then smokes A/B, then Part D. In that
     order. It resolves 90% of incidents.
================================================================================
