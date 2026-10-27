# SATQUERY AI — 26-HOUR WAR PLAN (OPERATIONS-26H)
**Chakravyuh 2026 · ST-09 · compressed timeline: prototype gate at hour 6, full submission at hour 26**

> Read this once before H+0, once at H+6, once at H+20. Every other kit file is a tool;
> this is the battle schedule. Companion documents: MASTER-PLAN.md (the full map),
> ARCHITECTURE-LOCK.txt (the contract — nothing here changes it), AI-AGENT-BUILD-SPEC.txt
> (frontend build spec), REFUSAL-LAYER.md (the trust layer).

| | |
|---|---|
| Timeline | **26 hours total. Working prototype due H+6. Full submission H+26.** |
| GPU fleet | Multiple Kaggle accounts, each **T4 ×2 (16 GB VRAM per GPU)** — the free GPU pair |
| Real constraint | **TIME.** Accounts are plentiful; every decision below optimizes for wall-clock. |
| Training runs | **0** (decision D1 — zero-shot model + engineering around it) |
| Kit status | Tier 0 + Tier 0.5 + refusal engine v2 + locked architecture + frontend spec: **BUILT** |
| Prime directive | **Run the kit. Do not invent.** Every hour spent "improving" the plan is an hour not shipping. |

---

## 0. The 60-second version

We have 26 hours and more GPU capacity than we can use. The plan therefore does NOT
rotate accounts to stretch one long session — it **assigns each account a ROLE and runs
them in parallel**, so no lane ever waits for another:

| Rig | Kaggle account | GPU setting | Job | Total GPU burn |
|---|---|---|---|---|
| **A — ENGINE** | account #1 | **1 × T4** | Hosts the live website worker (Qwen 4-bit ≈ 3 GB VRAM) for the whole 26 h | ~26 GPU-h ✅ fits 30 h/week quota |
| **B — EVAL** | account #2 | 1 × T4 | RSVQA benchmark (Cell 8) + hallucination probes (Cell 9) + final reruns | ~4 GPU-h |
| **C — TIER-0.5** | account #3 | **2 × T4** | SAM outlines + tiled counting + forest pair + development pair (SAM + Qwen co-loaded) | ~6 GPU-h |
| **D — SPARE** | account #4 | as needed | Warm failover for A; second worker if we ever need one | 0 until called |

Key math: selecting **both T4s burns the weekly quota at double rate** (~15 wall-hours
per account). Rig A needs only ONE T4 — the 3B model at 4-bit takes ~3 GB of the 16 GB —
so a single T4 carries the engine for the full 26 hours inside one account's quota.
Rig C genuinely needs both GPUs (SAM + Qwen), but only for hours at a time, not 26.

Kaggle sessions die after roughly 9–12 hours regardless of quota. That is EXPECTED and
handled: the worker is stateless and every job lives in Supabase, so a session death
costs one 10-minute relaunch drill (run 4 cells, paste the new tunnel URL into the
NEXT_PUBLIC_GRADIO_URL env var, redeploy). Zero lost jobs. This is exactly why the
architecture was locked the way it was.

---

## 1. What is already built (do not rebuild any of this)

| Asset | What it is | Status |
|---|---|---|
| `TIER0_CORE.ipynb` | 23-cell Kaggle notebook: model load, ask(), refusal engine v2 (R0–R7 + 0–100 confidence + 24 GPU-free self-tests), drawing, RSVQA download + eval, hallucination probes, band tools, export | code-complete, waiting for its first real Kaggle run |
| `TIER05_CORE.ipynb` | SAM pixel outlines, tiled big-scene counting, shadow height, building classification, forest + development change reports | code-complete |
| `app.py` | HF Space 2-tab Gradio app (Ask + false-colour) — the backup public URL | code-complete |
| `ARCHITECTURE-LOCK.txt` | LOCKED contract: Gradio tunnel = commands, Supabase = data, jobs DDL, 8-step lifecycle, L1–L6 / V1–V6 change control | frozen v1.0 |
| `AI-AGENT-BUILD-SPEC.txt` | The frontend/backend build spec (752 lines) — SQL, lib code, send handler, realtime + watchdog, mock mode, error table | hand to the frontend agent as-is |
| `REFUSAL-LAYER.md` | Refusal engine v2 documentation: 8 rules, confidence, measurement plan | synced across all 3 surfaces |
| `MASTER-PLAN.md` | The full 48 h plan — this file compresses it to 26 h; where they conflict on time, THIS file wins; on architecture, the LOCK wins | reference |

**What actually remains:** (1) first real Kaggle execution of the notebooks, (2) the
Vercel/Supabase frontend, (3) real eval numbers, (4) demo assets, (5) slides + submission
package. That is 100% execution work. There is no engineering risk left in the design.

---

## 2. Hour-by-hour schedule (H+0 → H+26)

### Phase 0 — Setup storm (H+0 → H+1) — everyone works in parallel
| Lane | Task | Done when |
|---|---|---|
| A (engine) | Kaggle: import `TIER0_CORE.ipynb`, Settings → Accelerator **GPU T4 ×2** (switch to 1×T4 after bring-up), **Internet ON**, run Cells 1–3 | model loaded, ask() answers on the campus test tile |
| Frontend | Supabase: paste Section 6.1 SQL + storage policies from AI-AGENT-BUILD-SPEC; create `images` bucket; create Vercel project with `NEXT_PUBLIC_GRADIO_URL=mock` | mock pipeline deployable |
| Data | Collect demo assets: big neighbourhood image, forest pair (Copernicus, <10% cloud), 2019/2026 same-viewport pair (Google Earth Pro), Bhoonidhi LISS-3 | 4 assets + backup folder |
| All | **Upload demo assets as a private Kaggle Dataset** → mounts at `/kaggle/input` every session — never re-upload after a session death | dataset visible from Rig A |

### Phase 1 — Engine green + frontend in mock (H+1 → H+3)
- Rig A: run the refusal-engine cell → must print **`self-tests: 24 passed, 0 failed`**
  → run demo cells (count+boxes, presence, 2-image compare, refusals) → launch the
  **worker cell** → copy the `https://xxxx.gradio.live` URL.
- Frontend lane: build the full UI in mock mode (chat tab, compare tab, verdict badge,
  confidence bar, marked-image render, watchdog) — the spec's Section 10 means this
  needs **ZERO Kaggle access**. This parallelism is why hour 6 is achievable.

### Phase 2 — Live wire (H+3 → H+4)
- Set `NEXT_PUBLIC_GRADIO_URL` to the tunnel URL, redeploy, then the three smoke tests
  from the lock's bring-up checklist: (A) single-image query end-to-end, (B) two-image
  comparison with boxes on the AFTER image, (C) kill a session → offline banner +
  90-second timeout flips the job to error. **C is as important as A** — judges will
  trust graceful failure more than fragile success.

### Phase 3 — PROTOTYPE FREEZE (H+4 → H+6) → **GATE 1: submit at H+6**
Prototype = public URL where a stranger can: upload an image, ask a question, get an
answer + verdict badge + confidence + marked image; upload two images and ask "what
changed?". Package: live URL + 2-minute screen recording + README + screenshots.
NOT required at the prototype gate: eval numbers, Tier 0.5 pages, polish. If the tunnel
misbehaves at H+5, submit with mock mode + honest banner — a working UI with a stated
"engine restarting" state still beats nothing, and Rig A keeps debugging after submission.

### Phase 4 — Parallel proof (H+6 → H+12)
| Rig | Work |
|---|---|
| B (eval) | Cells 8–9: RSVQA N=200 stratified eval (~1 h hands-off), hallucination probes, export → **download `rsvqa_results.csv`, `hallucination_results.csv`, `summary.json` immediately** |
| C (Tier 0.5) | SAM outlines on the neighbourhood image; tiled counting; forest pair report; development pair report; screenshot everything at high res |
| Frontend | Capabilities page + Limitations page (copy from sections 7–8 below), chat history, earlier-image referencing, polish |
| A (engine) | Keep alive; run the first **relaunch drill** at the first session death; verify the drill takes ≤ 10 min |

### Phase 5 — Integration + real numbers (H+12 → H+20)
- Fill the metrics table with REAL numbers from Rig B (presence accuracy, counting
  exact/±1, raw vs with-layer hallucination rate). Whatever they are — report them.
- Flood-basin headline demo: NDWI water + development report (the spec's own example
  question: "Where are new structures near the flood basin?").
- SAR stretch: 1-hour timebox only (Sentinel-1 PNG, presence questions). Flops → cut,
  say "NIR/SWIR shipped, SAR is roadmap."
- Slides v1→v2; Tier 1 QLoRA is **OUT OF SCOPE** in 26 h (do not let anyone start it).

### Phase 6 — Freeze and drill (H+20 → H+26)
- H+20–22: full demo rehearsal exactly as MASTER-PLAN §10, twice, timed; record the
  backup video; screenshot everything.
- H+22–24: judge Q&A drills (MASTER-PLAN §14, 15 questions, rotating who answers);
  verify the public URL on a phone over mobile data.
- H+24–26: final submission package, sleep rotation — at least two members rested for
  judging. Judges can smell sleep-deprived teams.

### Kill rules (compressed for 26 h)
1. **2-hour rule:** any single item eating > 2 h is CUT, not fixed. Park it, move on.
2. Priority if time collapses: forest demo > development demo > tiled counting >
   classification > shadow height > SAR.
3. **The floor is high:** Tier 0 + hosted URL + verdicts + confidence + refusal demo +
   measured RSVQA numbers is already a complete flagship submission.
4. SAM fails → keep red boxes. Registration fails → same-viewport exports. Tunnel
   flaky → polling variant (lock §12) or mock mode with honest banner.
5. Nobody touches the jobs schema, the lifecycle, or the refusal rules during the last
   6 hours. Feature freeze at H+20 means FREEZE.

---

## 3. AI-coding-agent alignment guide (read before giving any agent code)

You will be driving coding agents on Kaggle and in the frontend repo. Agents are fast
and fearless — which is exactly the danger at 26 hours. Give every agent the same
guardrails. **Global rules for ALL agents (paste this block verbatim):**

```text
CONTEXT: SatQuery AI, hackathon ST-09. A locked system architecture exists
(ARCHITECTURE-LOCK.txt v1.0). The kit is code-complete; your job is execution,
not redesign.

RULES:
1. The architecture is LOCKED (L1-L6): two-channel split (Gradio tunnel = commands,
   Supabase = data), jobs table DDL and column semantics, the 8-step lifecycle,
   browser never talks to notebook directly, marked images live in Supabase Storage
   (marked/{job_id}.png), frontend is the only renderer. Do NOT change any of these.
   If a task seems to require changing them, STOP and report instead.
2. ZERO model training. No fine-tuning, no QLoRA, no new model downloads. The model
   is Qwen2.5-VL-3B-Instruct at 4-bit NF4, already specified in the kit.
3. Minimal diffs. Keep cell numbers, function names, and exported names intact
   (ask, ask_verified, SELFTEST_RESULT, process(job_id, prompt, image_paths)).
   Never reformat code you were not asked to touch.
4. If you touch a refusal rule (R0-R7), you must apply the same change to all three
   surfaces: TIER0_CORE.ipynb engine cell, app.py, AI-AGENT-BUILD-SPEC.txt Appendix A
   quick_audit — and bump REFUSAL-LAYER.md version. When in doubt: do not touch rules.
5. Errors go to the jobs row: status='error' with the message in `answer`. A worker
   never crashes, never raises out of the processing loop, never leaves a spinner.
6. The Supabase service_role key exists ONLY inside the Kaggle notebook. Never in
   frontend code, never in git, never in a commit, never printed in logs.
7. 30-minute landing rule: if your change cannot land tested within 30 minutes,
   it is out of scope for the remaining timeline. Say so and stop.
8. No dependency upgrades or additions unless a kit file names them and pins them
   (gradio pinned to a modern version via pip install -U gradio, transformers >= 4.49,
   qwen-vl-utils, supabase, @gradio/client).
9. Always run the acceptance check that comes with your brief before reporting done.
   "It compiles" is not done.
```

**How to run the loop (per task):** give the agent ONE file + ONE acceptance check →
let it produce a patch → you apply and run the acceptance check → paste any error
VERBATIM back to the agent → repeat. Never let an agent invent schema, filenames, or
"improve" prompts inside the kit. Agents do not get creative freedom; they get briefs.

### 3.1 Rig A brief — ENGINE agent (website worker host)

```text
YOU ARE RUNNING: the SatQuery live engine worker on a Kaggle T4 session.

LOAD FIRST (in order): TIER0_CORE.ipynb (cells 1-4), ARCHITECTURE-LOCK.txt
Section 7 (worker cell), AI-AGENT-BUILD-SPEC.txt Appendix A (hardened worker
reference - use THIS variant, it fixes the after-image indexing and adds the
error path and quick_audit tag).

ENVIRONMENT: Settings -> Accelerator: GPU T4 x2 (drop to 1 x T4 once stable),
Internet ON. Supabase URL + service_role key go in the worker cell variables.
Never print the key.

ACCEPTANCE (all four must pass):
1. Refusal engine cell prints: self-tests: 24 passed, 0 failed.
2. Worker cell launches with share=True and prints a gradio.live URL.
3. Smoke test A: insert a job via the Supabase jobs table with one image path,
   trigger predict(job_id, prompt, image_paths) as a POSITIONAL array - within
   90 s the row flips to status='done' with answer text starting [ANSWERED] or
   [UNCERTAIN] or [REFUSED] and a valid marked_image_path rendering in the browser.
4. Smoke test C: kill the session - the frontend shows the offline banner and the
   stuck row flips to error after 90 s.

SESSION CARE: expect Kaggle to kill the session at 9-12 h. The relaunch drill is:
run cells 1-4, copy the NEW tunnel URL, update NEXT_PUBLIC_GRADIO_URL in Vercel,
redeploy. Target: under 10 minutes. Jobs queued during downtime are NOT lost -
they wait in the jobs table; optionally re-trigger them after relaunch.
```

### 3.2 Rig B brief — EVAL agent (benchmark + probes)

```text
YOU ARE RUNNING: the RSVQA benchmark and hallucination measurement on a Kaggle T4.

LOAD FIRST: TIER0_CORE.ipynb cells 8-9 (eval + probes) and cell 11 (export).
Do not modify thresholds; N=200 stratified sampling is already coded.

ACCEPTANCE:
1. rsvqa_results.csv exists with per-question-type accuracy (exact and +/-1 for
   counting).
2. hallucination_results.csv exists with raw rate AND with-refusal-layer rate.
3. summary.json contains both. DOWNLOAD ALL THREE FILES IMMEDIATELY after the
   run - a dead Kaggle session that never saved its output is a lost metric.

REPORT BACK: presence accuracy per type, counting exact/+/-1, hallucination raw
vs with layer (the DELTA is the headline number), refusal rate and over-refusal
check (accuracy did not collapse = layer is not over-refusing).
Expected ranges (sanity, not targets): presence 70-90%, counting exact 40-60%,
latency 8-25 s per question on T4. Whatever the real numbers are: report them.
```

### 3.3 Rig C brief — TIER-0.5 agent (SAM, tiling, change demos)

```text
YOU ARE RUNNING: the Tier 0.5 visual demo pipeline on Kaggle T4 x2 (SAM ViT-B
~1.5 GB + Qwen 4-bit ~3 GB co-loaded; ~5 GB of 32 GB total).

LOAD FIRST: TIER05_CORE.ipynb, TIER05-GUIDE.md (data recipes). Demo assets come
from the private Kaggle Dataset mounted at /kaggle/input.

ACCEPTANCE (one marked output image per item, saved at full resolution):
1. Pixel-precise rooftop outlines (SAM masks) on the neighbourhood image.
2. Tiled count of a big scene with per-tile stats and cross-tile dedup.
3. Forest pair report: hectares lost + clearing boxes + VLM confirmation.
4. Development pair report: typed, counted changes on the 2019/2026 pair.
Screenshot every output for the slides. If SAM outputs are not visibly better
than boxes within 40 minutes on step 1, SKIP SAM and keep red boxes - the spec
accepts either.

VRAM DISCIPLINE: if any step OOMs, reduce max_pixels in the Qwen config first,
never drop the SAM refine silently.
```

### 3.4 FRONTEND agent brief (Vercel + Supabase + Next.js)

```text
YOU ARE BUILDING: the SatQuery public website against a LOCKED contract.

LOAD FIRST: AI-AGENT-BUILD-SPEC.txt IN FULL (it contains the runnable SQL, the
lib/supabase.ts + lib/engine.ts code, the send handler, the realtime listener,
the watchdog, the mock mode, and the error->fix table), then ARCHITECTURE-LOCK.txt
sections 8-9, then the confidence display spec in OPERATIONS-26H.md section 5.

BUILD ORDER: SQL + bucket -> lib files -> mock pipeline e2e on Vercel -> live wire
when the tunnel URL arrives -> compare tab -> capabilities + limitations pages ->
polish.

HARD RULES: single AI touchpoint in lib/engine.ts; subscribe BEFORE trigger; the
/predict payload uses a POSITIONAL array; every answer renders the leading
[ANSWERED]/[UNCERTAIN]/[REFUSED] tag as a badge (strip it from the bubble text);
the marked image renders next to the answer; 90-second watchdog flips the job row
to error; engineOnline health check on page load with the offline banner.
NEXT_PUBLIC_GRADIO_URL=mock while building - you never need Kaggle access.

ACCEPTANCE: the spec's integration-day checklist, items 1-8, all green on the
deployed Vercel URL, tested from a phone over mobile data.
```

**3.4-bis PROTOTYPE LANE (H+6 gate — added with the prompt pack):** before
the Next.js/Supabase app above, the frontend ships the **static direct-mode
page** per `prompts/03-PROMPT-FRONTEND.md` (the approved chat mockup built
real: Interactive + Comparison tabs, every button wired to the worker's
`/health` `/chat` `/compare` endpoints — contract:
`prompts/01-ENDPOINT-CONTRACT.md`). It needs zero Supabase and zero Kaggle
access until the live-wire moment; the engine side adds one notebook cell
(`prompts/02-PROMPT-BACKEND-KAGGLE.md`, Cell W). Gate 1 submission =
that page + the live URL. Gate 2 = this section's full spec, unchanged.
Where the two disagree, the endpoint contract wins on endpoints and this
spec wins on the Supabase app.

---

## 4. The confidence score (what it is, how it displays)

Every answer carries a **0–100 confidence score** produced by the refusal engine v2,
plus a three-state verdict. This is already coded on all three surfaces — the website
just has to RENDER it.

**How the number is produced (deterministic, auditable):**
- Starts at 100 for a clean, first-pass, evidence-consistent answer.
- Deductions: any retry −12 · UNCERTAIN verdict −25 · dropped or merged boxes −8 to −10 ·
  failed crop self-check (R7) −20 · hedging/overconfident language (R5) penalty.
- The `reasons` list (the audit trail) explains every deduction — it ships in the
  notebook's result JSON; the web worker's lite version attaches boundary notes.

**Web rendering contract (contract-safe, V-tier — no DDL change needed):**
1. The worker prefixes every answer with `[ANSWERED] ` / `[UNCERTAIN] ` / `[REFUSED] `
   (already specified in AI-AGENT-BUILD-SPEC Appendix A). The frontend parses the
   prefix, strips it from the bubble text, and renders it as the verdict badge.
2. Confidence number: the worker ends answers with a human-readable line
   `confidence: 82/100`. Frontend parses it with a simple regex
   (`/confidence:\s*(\d+)\s*\/\s*100/i`) and renders the bar. If the line is absent
   (older worker), fall back to verdict-only styling — never show a fake number.

**Display bands (fixed — use these exact colors):**

| Band | Range | Color | Meaning |
|---|---|---|---|
| High | 80–100 | green `#16a34a` | evidence complete, self-checks passed |
| Medium | 55–79 | amber `#d97706` | minor deductions — usable, check the marked image |
| Low | 30–54 | orange `#ea580c` | noticeable uncertainty — treat as a lead, not a fact |
| Refused | — | red `#dc2626` | no number; show the refusal reason |

Tooltip on the badge/bar shows the reasons list (or the R5 boundary note) — the audit
trail is the product. Honest disclaimer for the website: *confidence is a rule-based
calibration score, not a statistical probability; its bands are validated against the
RSVQA benchmark and self-consistency probes rather than claimed.*

---

## 5. Frontend developer guidelines (chat interface, upload, compare tab)

The complete build spec is `AI-AGENT-BUILD-SPEC.txt` — 752 lines with runnable code.
This section is the orientation; the spec is the source of truth. Where they disagree,
the spec wins.

**Stack:** Next.js on Vercel · Supabase (Auth, Storage bucket `images`, Postgres `jobs`
table, Realtime) · `@gradio/client` for the one tunnel call. The frontend never talks
to Kaggle directly — invariant L4.

**Page map (build in this order):**

1. **Chat tab (the core screen).** One image upload (drag-drop + paste), a chat thread,
   a text box. Every AI message renders: the answer text (tag stripped), the verdict
   badge, the confidence bar, and the marked image (`marked/{job_id}.png` from Storage)
   beside or below the text. The marked image is not decoration — it is the evidence
   the whole product is judged on. Give it generous size, click-to-zoom if cheap.
2. **Compare tab (separate, as promised on the website).** Exactly two upload slots —
   BEFORE and AFTER — one prompt box. The job is an ordinary two-image job
   (`image_paths` length 2); boxes render on the LAST path (the after image). Show both
   originals side by side with the marked after-image, so the story reads left-to-right:
   before → after → what changed.
3. **Capabilities page** — paste section 6 below (website-ready copy).
4. **Limitations page** — paste section 7 below. An honesty page is a FEATURE here;
   it is also the judge-facing trust story.

**State machine per job (implement exactly this):** `processing` → `done` (render
answer + marked image) | `error` (render the error text from `answer`). The 90-second
watchdog flips a stuck `processing` row to `error` itself — never an infinite spinner.
On page reload, rebuild history from the jobs table (source of truth), not from
component state.

**Ordering bug to avoid (the #1 integration failure):** SUBSCRIBE to the Realtime
channel for the job BEFORE triggering the tunnel predict call. If you trigger first,
the update can land before your listener exists and the UI hangs at "processing" until
reload.

**Degradation is a designed state, not an error:** on load, `engineOnline()` health
check → if down or `NEXT_PUBLIC_GRADIO_URL` is missing: disable send, show the banner
"AI engine offline — restarting the Kaggle session, back in ~10 minutes." Session
rotation during the 26 h WILL trigger this; a calm banner makes it look planned —
because it is.

**Mock mode until the live wire:** `NEXT_PUBLIC_GRADIO_URL=mock` + one uploaded
`mock/marked_sample.png`. The whole team can build and demo the UI with zero Kaggle
access — this is what makes the H+6 prototype gate realistic.

---

## 6. What SatQuery AI can answer — the website capability list

Paste-ready categories, each with example questions. Every answer includes: the answer,
the evidence marked on the image, a verdict badge, and a confidence score.

| # | Category | Example questions you can ask | What you get back |
|---|---|---|---|
| 1 | **Object counting** | "How many buildings are in this image?" · "Count the cars in this parking lot." | A number + a box or pixel-precise outline on EVERY object counted |
| 2 | **Presence detection** | "Is there a bridge?" · "Is there a runway in this image?" | Yes/no + location boxes on the image |
| 3 | **Location & spatial relations** | "Where is the water?" · "Which buildings are adjacent to the road?" | Boxes/markers on the exact regions, in plain English + coordinates on image |
| 4 | **Two-image change comparison** | "What changed between these two images?" · "Compare this before and after shot." | A typed change report + boxes drawn on the AFTER image |
| 5 | **Forest & vegetation monitoring** | "Did tree cover change in this forest?" · "How many hectares were cleared?" | Clearing map + hectares estimate + VLM-confirmed patches |
| 6 | **Development tracking** | "What was built here in the last two years?" | Typed, counted new structures and roads |
| 7 | **Building classification** | "Which of these buildings look commercial vs residential?" | A label per building, marked on the image |
| 8 | **Height estimation** | "How tall is this building?" | Approximate height from shadow geometry (needs visible shadows) |
| 9 | **Multispectral analysis** | "Show me vegetation health." · "Where is the water in this infrared image?" | False-colour NIR/SWIR composites + NDVI/NDWI maps (Bhoonidhi LISS-3, Sentinel-class data) |
| 10 | **Trust layer on every answer** | — | ANSWERED / UNCERTAIN / REFUSED verdict + 0–100 confidence + audit trail |
| 11 | **Measured honesty** | — | Accuracy + hallucination rate published from the official RSVQA benchmark (77,232 questions) |

Website line to use: *"Ask plain-English questions about any satellite image. Every
answer ships its evidence: a marked image, a verdict, and a confidence score — and when
pixels cannot answer, SatQuery says no instead of guessing."*

---

## 7. Limitations of the AI workflow (website copy — the honesty page)

**Questions SatQuery refuses by design (rule R4):** population, demographics, income,
literacy or poverty rates · ownership, names, addresses, phone numbers · property prices
· license plates and personal data · "why" questions (intent is not observable) ·
absolute dates from a single image ("when was this built?") · predictions ("will this
flood next monsoon?"). *Refusal message shown to users: "Satellite pixels cannot answer
this — population, demographics, names, prices, ownership, reasons, predictions and
personal data are not visible from above. Refusing by design."*

**Stated limitations:** (1) We flag, we never judge — legality questions get
observational evidence plus the note that the concerned authority must adjudicate.
(2) Counting needs roughly 0.3–1 m imagery; on 10 m Sentinel-2 tiles counts become
uncertain and we say so via the UNCERTAIN verdict. (3) English only in this version.
(4) A single image carries no timestamp — relative change requires two images.
(5) Boxes and heights are analyst-grade evidence, not surveyor-grade measurement.
(6) Static imagery only — no live video or drone feeds. (7) SAR is ingested as
grayscale today; SAR physics processing is roadmap. (8) The engine runs on shared
research GPUs: answers take 30–90 seconds and brief offline windows occur during
session rotation — the UI always says which state it is in. (9) The confidence score
is a rule-based calibration, not a probability guarantee.

**Do not** claim zero hallucination anywhere on the site — the entire differentiator is
that we MEASURE it. "Measured X% with the trust layer vs Y% raw" is the strongest
sentence on the website once Rig B's numbers land.

---

## 8. Communication + logging protocol (26 h, low-entropy)

- One shared worklog (this repo / a group doc). Every rig appends: hour, what ran,
  metric or screenshot produced, next action. Five minutes per hour, no exceptions —
  it is also the Rule-04 integrity record of who did what.
- Metric numbers flow: Rig B CSVs → results table (MASTER-PLAN §11) → slides → website
  honesty page. Numbers are entered ONCE, by the eval lane, and never retyped by hand
  elsewhere.
- Session deaths and tunnel rotations are announced in the group chat with the new URL
  the moment it exists — the frontend lane updates the env var and redeploys within
  two minutes.
- Any disagreement about architecture during the 26 h is settled by ARCHITECTURE-LOCK
  §13 change control: L1–L6 require a team decision and a version bump — which in 26 h
  means "not happening." V-tier changes are free and need no meeting.

---

## 9. The two submission checklists

**GATE 1 — H+6 prototype submission:** [ ] public Vercel URL live · [ ] chat tab
upload+ask e2e with verdict + confidence + marked image · [ ] compare tab 2-image e2e ·
[ ] offline banner verified · [ ] 2-min screen recording · [ ] README with URL + stack +
team · [ ] screenshots at high res.

**GATE 2 — H+26 full submission:** [ ] all Gate-1 items still green · [ ] RSVQA metrics
table with real numbers · [ ] hallucination raw-vs-layer delta · [ ] Tier 0.5 demo
screenshots (outlines, tiled count, forest, development) · [ ] flood-basin headline
demo recorded · [ ] capabilities + limitations pages live · [ ] backup video · [ ]
slides (10 max) · [ ] judge Q&A drilled · [ ] worklog complete for Rule-04 disclosure.

*The kit is built. The contract is locked. The accounts are ready. The only scarce
resource is the clock — spend it on execution.*
