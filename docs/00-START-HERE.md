═══════════════════════════════════════════════════════════════════════════════
  SATQUERY PROMPT PACK — START HERE
  Every prompt the team needs, who uses it, when, and how.
═══════════════════════════════════════════════════════════════════════════════

Project : ST-09 SatQuery — Chakravyuh 2026
Timeline: prototype gate H+6 · full submission H+26
New in this pack: the DIRECT-MODE endpoint layer — the approved chat
mockup (Interactive + Comparison tabs) wired to real Gradio endpoints so
no one gets stuck on connectivity.

───────────────────────────────────────────────────────────────────────────────
THE 30-SECOND ORIENTATION
───────────────────────────────────────────────────────────────────────────────

The team is building a chat interface with TWO modes:
  • INTERACTIVE — one image + question + confidence bar (100/80/50) →
    answer with evidence boxes, verdict badge, confidence score.
  • COMPARISON — two images (past / present) + a question → typed change
    report, boxes on the present image, stats, confidence grade.

The AI engine runs in the Kaggle notebook and exposes FOUR endpoints
(/health /chat /compare /predict) through a public gradio.live URL. The
frontend's every button maps to one endpoint. Both lanes build against
the SAME contract from hour zero — that is the whole anti-"stuck" trick.

───────────────────────────────────────────────────────────────────────────────
THE FILE MAP — WHO · WHAT · WHEN
───────────────────────────────────────────────────────────────────────────────

  prompts/01-ENDPOINT-CONTRACT.md ........ THE CONTRACT (source of truth)
    WHO : EVERYONE — frontend dev, backend dev, Kaggle operator, AND every
          AI coding agent (attach it above any prompt below).
    WHEN: before anything else, always. If any other file disagrees about
          an endpoint, this file wins.
    WHAT: the four endpoints, exact positional payloads, the answer
          protocol ([VERDICT] + confidence: N/100), threshold semantics,
          three calling methods (@gradio/client, raw REST, Python/curl),
          the runtime URL-override pattern, error semantics.

  prompts/02-PROMPT-BACKEND-KAGGLE.md .... BACKEND / ENGINE agent prompt
    WHO : whoever drives the Kaggle engine rig (or a coding agent helping).
    WHEN: H+0–H+2, right after TIER0_CORE Cells 1–5 run green.
    WHAT: paste-ready prompt containing the COMPLETE WORKER-PRO cell
          (Cell W): /health /chat /compare /predict, refusal-engine reuse,
          evidence-box image saving, queue + share=True launch, five
          acceptance checks. Also: what NOT to touch.

  prompts/03-PROMPT-FRONTEND.md .......... FRONTEND agent prompt
    WHO : the frontend dev's coding agent (Cursor/Claude Code/etc.).
    WHEN: H+0, immediately — in MOCK mode (needs zero Kaggle access).
    WHAT: the mockup (Interactive + Comparison tabs) built for real: the
          full api.js connection module, the button→endpoint map, AI
          message rendering (badge/bar/marked image/audit tooltip),
          comparison stat cards from REAL data, every UI state (thinking,
          offline, error, mock, reconnect), hard rules, acceptance list.

  prompts/04-PROMPT-KAGGLE-OPERATOR.md ... OPERATOR runbook (for the lead)
    WHO : YOU — the person driving Kaggle.
    WHEN: before you first open Kaggle; keep it open all 26 hours.
    WHAT: Part A bring-up (12 checkbox steps to the first live URL),
          Part B the four rigs (engine/eval/tier-0.5/spare), Part C session
          realities, Part D the <10-min relaunch drill, Part E triage
          table, Part F your personal rules.

  prompts/05-GRADIO-CONNECTION-PROMPTS.md  CONNECTION toolkit
    WHO : everyone, the moment anything says "not connecting".
    WHEN: H+3 live-wire; every relaunch; every doubt.
    WHAT: the 30-second /health check, smoke tests A/B (chat + compare),
          the frontend console test prompt, the button-wiring recheck
          prompt, the offline drill, the STUCK decision tree (Q1→Q4), the
          error→fix table, and the one-screen group-chat summary.

  prompts/06-ARCHITECTURE-OVERVIEW.md .... ARCHITECTURE (the map)
    WHO : everyone, once, at kickoff.
    WHEN: orientation (now), and whenever someone asks "why is it built
          this way?"
    WHAT: the one-screen system diagram, the two-gate strategy (H+6
          direct-mode prototype → H+26 Supabase full app), both request
          lifecycles, the honest v1.1-vs-lock change accounting, and the
          three promises the architecture makes.

───────────────────────────────────────────────────────────────────────────────
HOW TO USE A PROMPT (the protocol — same for every agent, every time)
───────────────────────────────────────────────────────────────────────────────

  1. ATTACH THE CONTRACT. Paste prompts/01-ENDPOINT-CONTRACT.md above the
     task prompt. Agents that haven't read the contract invent endpoints —
     that is how teams get stuck on connectivity.
  2. ONE PROMPT, ONE SESSION. Give the agent ONE file's job + its
     acceptance checks. Do not stack tasks.
  3. APPLY → RUN THE ACCEPTANCE CHECK → paste any error VERBATIM back →
     repeat. "It compiles" is not done. The acceptance lists inside each
     prompt are the definition of done.
  4. 30-MINUTE LANDING RULE: if a change can't land tested in 30 minutes,
     it is out of scope for the timeline. Agents get briefs, not creative
     freedom. Never let an agent invent schema, endpoint names, or
     "improved" prompts.
  5. GLOBAL RULES for ALL agents (paste verbatim, from OPERATIONS-26H §3):
     architecture LOCKED (L1–L6) — execution, not redesign; zero model
     training; minimal diffs, keep exported names intact; refusal-rule
     changes must sync all three surfaces; errors go to the row/answer,
     never a crash; service_role key notebook-only; no dependency changes
     unless a kit file pins them; always run the acceptance check.

───────────────────────────────────────────────────────────────────────────────
THE ORDER OF OPERATIONS (first four hours)
───────────────────────────────────────────────────────────────────────────────

  H+0  Everyone reads THIS file + 01-ENDPOINT-CONTRACT.md + 06 (15 min).
        Operator → starts 04-PROMPT-KAGGLE-OPERATOR.md Part A on Rig A.
        Frontend → starts 03-PROMPT-FRONTEND.md in mock mode.
        (Backend agent prompt 02 is used BY the operator inside Kaggle.)
  H+1–2 Operator: Cells 1–5 green (self-tests 24/24) → paste Cell W from
        02 → gradio.live URL goes to the team chat.
  H+3  Live wire: frontend pastes URL into settings gear → run smokes from
        05-GRADIO-CONNECTION-PROMPTS.md §1–§5 → offline drill §6.
  H+4–6 Polish + prototype freeze → GATE 1 submission (public URL, 2-min
        recording, screenshots). Eval + Tier 0.5 lanes spin up per
        OPERATIONS-26H.md §2.

───────────────────────────────────────────────────────────────────────────────
RELATED KIT FILES (the rest of the system)
───────────────────────────────────────────────────────────────────────────────

  OPERATIONS-26H.md ........ the 26-hour battle schedule (roles, phases)
  ARCHITECTURE-LOCK.txt .... the locked v1.0 Supabase contract (Gate 2)
  AI-AGENT-BUILD-SPEC.txt .. the Next.js/Supabase build spec (Gate 2)
  REFUSAL-LAYER.md ......... the trust layer's documentation
  MASTER-PLAN.md ........... the full map (48h original, still reference)
  TIER0_CORE.ipynb ......... the engine notebook (Cells 1–5 + Cell W)
  TIER05_CORE.ipynb ........ SAM / forest / development demos
  app.py ................... the HF Space backup app

Rule of precedence: endpoint questions → 01 wins. Time questions →
OPERATIONS-26H wins. Gate-2 architecture questions → ARCHITECTURE-LOCK
wins. Everything else → MASTER-PLAN.
═══════════════════════════════════════════════════════════════════════════════
