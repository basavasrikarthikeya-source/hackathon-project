================================================================================
     SATQUERY — SYSTEM ARCHITECTURE OVERVIEW (v1.1, DIRECT MODE added)
        One engine on Kaggle, two frontend connection modes, one contract
================================================================================

Version : 1.1 (supersedes nothing — EXTENDS ARCHITECTURE-LOCK v1.0)
Date    : 27 October 2026
Project : ST-09 SatQuery — Chakravyuh 2026
Read    : once, at kickoff. The lock remains the deep reference for the
          Supabase path; this file is the map of the WHOLE system now.

--------------------------------------------------------------------------------
1. THE SYSTEM ON ONE SCREEN
--------------------------------------------------------------------------------

                    ┌─────────────────────────────────────────────┐
                    │           KAGGLE NOTEBOOK (T4)              │
                    │                                             │
                    │  Cells 1–5: Qwen2.5-VL 4-bit + refusal      │
                    │  engine v2 (R0–R7 + confidence 0–100)       │
                    │                                             │
                    │  Cell W: WORKER-PRO  (gr.Blocks, 4 routes)  │
                    │    /health   /chat      /compare    /predict│
                    │         │          │          │        │    │
                    └─────────┼──────────┼──────────┼────────┼────┘
                              │   outbound only (Kaggle has no inbound)
                    launch(share=True) dials out to the Gradio relay
                              │
                    https://<random>.gradio.live   ← THE engine address
                              │
            ┌─────────────────┴──────────────────────┐
            │                                        │
   DIRECT MODE (v1.1, NEW)                SUPABASE MODE (locked v1.0)
   the H+6 prototype lane                  the H+26 full-submission lane
            │                                        │
   Static chat page                        Next.js app on Vercel
   (the approved mockup, built             (auth, persistent history)
    real — prompts/03)                              │
            │                               Supabase = data channel:
            │ calls /health /chat             jobs table + Storage
            │ /compare directly               + Realtime push
            │ via api.js                              │
            │                               /predict = doorbell only
            │                                        │
   Marked images returned                  Marked images DURABLE in
   as gradio server files                  Storage (marked/{job}.png)
   (ephemeral — fine for chat)             answers arrive via Realtime

Both modes call the SAME engine, the SAME refusal rules, the SAME
confidence score, and the SAME answer protocol. The frontend lanes are
interchangeable against the worker — that is the point of the contract.

--------------------------------------------------------------------------------
2. THE TWO-GATE STRATEGY (why two modes exist)
--------------------------------------------------------------------------------

  GATE 1 — H+6 PROTOTYPE (DIRECT MODE):
    static page + worker = public URL where a stranger uploads an image,
    asks a question, and gets answer + verdict + confidence + marked
    image; and uploads two images and gets a change report. Fewest moving
    parts: no Supabase, no auth, no build pipeline. If anything breaks,
    there is exactly one hop to debug (the tunnel). This is how hour 6 is
    survivable.

  GATE 2 — H+26 FULL SUBMISSION (SUPABASE MODE):
    the locked architecture v1.0 in full: Vercel + Supabase (auth, jobs
    table, storage, realtime, watchdog, history, offline banner) per
    AI-AGENT-BUILD-SPEC.txt. Durable marked images, reload recovery,
    earlier-image referencing, capabilities/limitations pages.

  The upgrade is "swap-one-line" by design: the static page's api.js
  chat()/compare() map 1:1 onto lib/engine.ts's triggerWorker() — the
  same positional-array discipline and answer protocol. Prototype work is
  NOT throwaway; it becomes the visual layer and the connection layer of
  the full app.

--------------------------------------------------------------------------------
3. REQUEST LIFECYCLE — DIRECT MODE (v1.1)
--------------------------------------------------------------------------------

  [STATIC PAGE]                      [GRADIO RELAY]        [KAGGLE WORKER]
       |                                    |                     |
  (1) user picks image(s), question,        |                     |
      threshold; presses GO / Run           |                     |
       |                                    |                     |
  (2) api.js → Client.connect(BASE) ------->|---- tunnel -------->|
       |                                    |                     |
  (3) predict("/chat", [File, q, thr])      |    (a) R0 image gate|
      (File auto-uploads; POSITIONAL array) |    (b) R4 class gate|
       |                                    |    (c) VLM inference|
       |                                    |        + R1–R7 audit|
       |                                    |    (d) boxes drawn →|
       |                                    |        marked PNG   |
       |                                    |                     |
  (4) result resolves (8–40 s; REFUSED <1 s)                     |
       |   [answer, marked_url, meta_json]  |                     |
       |                                    |                     |
  (5) render: verdict badge + body + confidence bar + marked image
       |   + audit-trail tooltip + latency chip
       |
  (6) health poll every 20 s keeps the status dot honest; watchdog at
      150 s converts silence into an offline banner + retry — never an
      infinite spinner.

FAILURE SEMANTICS: the tunnel is still the least reliable hop, so in
direct mode the worst case is ONE lost answer (the user presses retry
after the relaunch). No state is lost because the page holds no server
state — each question is independent. Durability is exactly what Gate 2
adds.

--------------------------------------------------------------------------------
4. REQUEST LIFECYCLE — SUPABASE MODE (locked v1.0, unchanged)
--------------------------------------------------------------------------------

  upload originals → insert jobs row (status=processing) → predict(job_id,
  prompt, image_paths) as doorbell → worker downloads from Storage →
  inference → marked PNG uploaded to Storage → jobs row updated →
  Realtime pushes to the browser → render. Full text: ARCHITECTURE-LOCK
  §5 (the eight steps). Nothing in this file changes it.

--------------------------------------------------------------------------------
5. WHAT v1.1 CHANGES RELATIVE TO THE LOCK (honest accounting)
--------------------------------------------------------------------------------

  V-TIER (free, no version bump needed — implementation detail):
    - The worker is now gr.Blocks with explicit api_name routes and a
      manual test console (the lock's §7.2 sketch was gr.Interface).
    - /chat and /compare return marked images as gradio file URLs.
    - Health endpoint + runtime URL override pattern (settings gear).

  L-TIER EXCEPTION (documented, team-lead approved, this file = the record):
    - Lock L4 says "browser and notebook never talk directly" and L6 says
      "frontend is the only renderer of state; Supabase is the only source
      of truth." DIRECT MODE relaxes both FOR THE PROTOTYPE LANE ONLY:
      the static page renders tunnel-returned payloads and holds its own
      chat state in the browser. Rationale: the team's approved mockup is
      a self-contained page; at H+6 the fastest path to a public demo is
      one hop, and the lock's own §12 anticipated frontend swap freedom.
      The Supabase lane keeps L1–L6 intact and unchanged; the /predict
      contract is byte-identical. When Gate 2 goes live, L4/L6 are
      restored for production traffic.

  STILL TRUE EVERYWHERE:
    - Kaggle accepts no inbound; the tunnel dials OUT (share=True).
    - The worker is stateless: one request in, one audited answer out.
    - Marked images, verdict tags, confidence lines, and positional
      arrays are the SAME protocol in both modes (contract §4).

--------------------------------------------------------------------------------
6. COMPONENT MAP (who runs what, where)
--------------------------------------------------------------------------------

  COMPONENT            RUNS ON              ROLE
  ------------------   ------------------   --------------------------------
  TIER0_CORE Cells 1–5 Kaggle T4           model + refusal engine v2
  Cell W (WORKER-PRO)  Kaggle T4           the 4 public endpoints
  gradio.live relay    Gradio cloud        public URL bridge (outbound)
  Static chat page     any static host     Gate-1 frontend (mockup real)
  Next.js + Supabase   Vercel + Supabase   Gate-2 frontend (locked spec)
  Rig B / Rig C        other Kaggle accts  eval + Tier-0.5 demos
  Rig D                spare account       warm failover (one cell to live)

--------------------------------------------------------------------------------
7. THE THREE PROMISES THIS ARCHITECTURE MAKES (and how)
--------------------------------------------------------------------------------

  1. "We are never stuck on connectivity."
     Health endpoint + 20 s poll + watchdog + settings-gear URL swap +
     Rig D warm failover + manual test console on the worker itself.
     Every failure has a designed state and a < 10-minute recovery drill.

  2. "Every answer ships its evidence."
     Worker draws the boxes (refusal engine's own clean output), the
     protocol carries verdict + confidence + reasons, the UI renders all
     three plus the marked image — in BOTH modes, from the same code.

  3. "When pixels cannot answer, we say no."
     R0–R7 fire inside ask_verified()/api_compare() regardless of which
     frontend asked. A refusal is a first-class answer: [REFUSED] +
     reason + confidence 100/100, rendered as designed, never as an error.
================================================================================
