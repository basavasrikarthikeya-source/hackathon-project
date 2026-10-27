================================================================================
     PROMPT 02 — BACKEND / KAGGLE ENGINE AGENT  (paste-ready, self-contained)
        "Add the public API worker cell to the SatQuery Kaggle notebook"
================================================================================

HOW TO USE: paste EVERYTHING between the >>>>>>>>> markers into your coding
agent (Claude Code / Cursor / Kaggle notebook assistant) as ONE message, with
the content of prompts/01-ENDPOINT-CONTRACT.md attached above it. WHEN: right
after Cells 1–5 of TIER0_CORE.ipynb have run green on the Kaggle T4 session
(engine self-tests 24/24). The agent's job is to add ONE new cell — not to
touch anything that already works.

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

CONTEXT: SatQuery AI, hackathon ST-09. A locked architecture exists
(ARCHITECTURE-LOCK.txt v1.0) and the direct-mode endpoint contract v1.1
(prompts/01-ENDPOINT-CONTRACT.md) has been approved by the team lead. The
kit is code-complete; your job is execution, not redesign.

YOU ARE RUNNING: the SatQuery live engine worker on a Kaggle T4 session.
The notebook TIER0_CORE.ipynb has already executed Cells 1–5, so these names
exist in kernel memory and MUST be reused, never redefined:
  model, processor, process_vision_info, torch, os
  ask(image_path, question, max_new_tokens=400) -> {"answer", "seconds"}
  ask_verified(image_path, question) -> {verdict, reasons, confidence, clean,
      raw, seconds, retries, message?, answer_text?, caveat?}
      (clean = {"count": int, "boxes": [{"bbox_2d": [x1,y1,x2,y2], "label"}]})
  image_admissible(path) -> (ok, why)          # R0 gate
  parse_json_answer(raw) -> dict | None        # R1 tolerant parse
  _confidence(verdict, reasons, retries, self_ok) -> 0-100
  UNANSWERABLE_RE                              # R4 class filter
  SELFTEST_RESULT = (n_passed, n_failed)       # expect (24, 0)

YOUR TASK: append ONE new code cell to the notebook (title it
"Cell W — WORKER-PRO · public API v1.1") containing EXACTLY the code below.
Fix nothing else. If something below fails on the first run, report the
verbatim traceback and the minimal fix — do not restructure.

ENVIRONMENT: Settings → Accelerator GPU T4 ×2 (drop to 1 × T4 once stable),
Internet ON. Gradio must be modern: Cell 1 already runs
`pip install -U "gradio>=5" gradio_client`; if the worker cell errors on
import, re-run that install once.

ACCEPTANCE (all five must pass, in order — "it compiles" is not done):
  1. Cell W runs and prints a gradio.live URL (share=True).
  2. `app.predict("/health", [])` on that URL returns status "online",
     version "st09-direct-v1.1", engine "refusal-v2 (24/24 self-tests)".
  3. Smoke A (/chat): predict with a real image + "How many buildings are
     in this image?" + 0.8 → answer starts [ANSWERED]/[UNCERTAIN]/[REFUSED],
     carries "confidence: N/100", and the marked image path exists on disk.
  4. Smoke B (/compare): two different images + "What changed between these
     two images?" → report + boxes drawn on the PRESENT image + meta JSON
     with changes_count and change_types.
  5. Smoke C (/predict): returns "ERROR: supabase path disabled (direct-mode
     prototype worker)" — this is CORRECT (the Supabase lane is disabled by
     default; see ENABLE_SUPABASE below).

RULES:
  1. The architecture is LOCKED (L1–L6). The four endpoint names
     (/health /chat /compare /predict), their positional orders, and the
     answer protocol are contract v1.1 — do not change any of them.
  2. ZERO model training, no new model downloads.
  3. Do NOT modify Cells 1–5, the refusal rules (R0–R7), app.py, or any
     other kit file. This cell is purely ADDITIVE.
  4. The code is Python 3.11 (Kaggle): NO nested f-strings with the same
     quote type — keep the .format() style used below.
  5. A worker never crashes: every endpoint wraps its body in try/except
     and returns an "[ERROR] ..." answer with meta.verdict == "ERROR".
  6. Never print secrets. The Supabase service_role key (if the Supabase
     lane is ever enabled) exists ONLY in this notebook.
  7. 30-minute landing rule: if your change cannot land tested within
     30 minutes, stop and report.

═════════════════ BEGIN CELL W — paste into the notebook ════════════════

# ═══════════════════════════════════════════════════════════════════════════
#  🌐 Cell W — SATQUERY WORKER-PRO · the public API (DIRECT MODE v1.1)
#  Serves /health /chat /compare /predict until the session dies.
#  Contract: prompts/01-ENDPOINT-CONTRACT.md — do not change signatures.
#  Run AFTER Cells 1–5. Re-run only this cell after a session restart.
# ═══════════════════════════════════════════════════════════════════════════
import json, time, uuid, traceback
import gradio as gr
from PIL import Image, ImageDraw

WORKER_VERSION = "st09-direct-v1.1"
T0 = time.time()

# -- Supabase lane (LOCKED /predict path) — OFF in direct-mode prototype ---
ENABLE_SUPABASE = False        # flip True + fill keys for the Vercel lane
SB_URL, SB_KEY = "", ""        # service_role key — notebook ONLY, never print


# ---- helpers (reuse engine globals; redefine nothing) ---------------------
def _save_marked(image_path, boxes, tag):
    """Draw red evidence boxes and save a PNG. Returns the new path."""
    img = Image.open(image_path).convert("RGB")
    d = ImageDraw.Draw(img)
    w = max(3, img.width // 400)
    for b in boxes:
        x1, y1, x2, y2 = b["bbox_2d"]
        d.rectangle([x1, y1, x2, y2], outline="red", width=w)
        label = str(b.get("label", b.get("type", "")))[:40]
        if label:
            d.text((x1 + 4, max(0, y1 - 14)), label, fill="red")
    out = "/kaggle/working/marked_{}.png".format(tag)
    img.save(out, "PNG")
    return out


def _display_text(r):
    """Extract the human answer from an ask_verified() result dict."""
    if r.get("answer_text"):
        return r["answer_text"]
    if r.get("message"):                    # REFUSED / UNCERTAIN / post-retry
        return r["message"]
    c = r.get("clean", {})
    boxes = c.get("boxes", [])
    if boxes:
        labels = sorted({str(b.get("label", "object")) for b in boxes})
        return "I count {} object(s) — {}. Each one is boxed on the evidence image.".format(
            c.get("count", len(boxes)), ", ".join(labels))
    if r.get("verdict") == "ANSWERED" and str(r.get("raw", "")).strip():
        return str(r["raw"]).strip()
    return "No grounded answer could be produced from this image."


def _threshold_note(confidence, threshold):
    """The 100/80/50 dropdown is the USER's bar — honest below-bar note."""
    try:
        bar = int(round(float(threshold) * 100))
    except Exception:
        bar = 80
    if bar and confidence < bar:
        return ("\n\nNote: confidence {} / 100 is below your selected bar "
                "({} / 100). Treat this as a lead for manual review, "
                "not a fact.").format(confidence, bar)
    return ""


def _err(text, mode, e):
    meta = {"verdict": "ERROR", "confidence": 0, "reasons": [str(e)],
            "mode": mode, "version": WORKER_VERSION}
    return ("[ERROR] {}\n\nconfidence: 0/100".format(text),
            None, json.dumps(meta))


# ---- ENDPOINT 2: /chat — one image + question + threshold -----------------
def api_chat(image_path, question, confidence_threshold):
    try:
        q = str(question or "").strip() or \
            "Describe what is visible in this image, with locations."
        r = ask_verified(image_path, q)          # full R0–R7 engine
        v, conf = r["verdict"], int(r.get("confidence", 0))
        text = _display_text(r)
        boxes = r.get("clean", {}).get("boxes", [])
        marked = _save_marked(image_path, boxes, uuid.uuid4().hex[:8]) \
                 if boxes else image_path        # REFUSED -> original back
        meta = {"verdict": v, "confidence": conf,
                "reasons": r.get("reasons", []),
                "latency_s": r.get("seconds", 0), "retries": r.get("retries", 0),
                "mode": "chat", "version": WORKER_VERSION}
        answer = "[{}] {}\n\nconfidence: {}/100{}".format(
            v, text, conf, _threshold_note(conf, confidence_threshold))
        return answer, marked, json.dumps(meta)
    except Exception as e:
        traceback.print_exc()
        a, m, j = _err("The engine hit an internal error ({}). "
                       "The job was not lost — retry in a moment.".format(e),
                       "chat", e)
        return a, image_path, j


# ---- ENDPOINT 3: /compare — past + present + question ---------------------
COMPARE_SYSTEM = """You are SatQuery, a careful satellite-imagery change analyst.
You are given TWO images of the same area: image 1 is the PAST capture, image 2 is the PRESENT capture.
Rules:
1. Report ONLY differences actually visible between the two images.
2. Reply ONLY with valid JSON, no extra text:
{"changes": [{"type": "new structure" | "removed structure" | "new road" | "vegetation loss" | "vegetation growth" | "water change" | "other",
              "bbox_2d": [x1, y1, x2, y2],
              "note": "<few words>"}],
 "summary": "<one sentence overall>"}
3. bbox_2d coordinates are pixel positions on the PRESENT (second) image.
4. If nothing meaningful changed: {"changes": [], "summary": "no significant changes visible"}."""


def _ask_compare(past_path, present_path, question):
    """Two images, one question — same call pattern as ask()."""
    messages = [
        {"role": "system", "content": [{"type": "text", "text": COMPARE_SYSTEM}]},
        {"role": "user", "content": [
            {"type": "image", "image": "file://" + os.path.abspath(past_path)},
            {"type": "image", "image": "file://" + os.path.abspath(present_path)},
            {"type": "text", "text": question},
        ]},
    ]
    text = processor.apply_chat_template(messages, tokenize=False,
                                         add_generation_prompt=True)
    image_inputs, _ = process_vision_info(messages)
    inputs = processor(text=[text], images=image_inputs, padding=True,
                       return_tensors="pt").to(model.device)
    t0 = time.time()
    with torch.no_grad():
        out = model.generate(**inputs, max_new_tokens=500, do_sample=False)
    raw = processor.batch_decode(out[:, inputs.input_ids.shape[1]:],
                                 skip_special_tokens=True)[0].strip()
    return {"answer": raw, "seconds": round(time.time() - t0, 1)}


def _audit_changes(changes, W, H):
    """R6-style junk filter for change boxes. Returns (kept, notes)."""
    kept, notes = [], []
    for ch in changes or []:
        b = ch.get("bbox_2d")
        if not isinstance(b, (list, tuple)) or len(b) != 4:
            notes.append("dropped: malformed box"); continue
        x1, y1, x2, y2 = [max(0, int(v)) for v in b]
        if x2 <= x1 + 8 or y2 <= y1 + 8:
            notes.append("dropped: too-small box"); continue
        if x1 >= W or y1 >= H:
            notes.append("dropped: out-of-bounds box"); continue
        dup = False
        for k in kept:
            kb = k["bbox_2d"]
            ix = max(0, min(x2, kb[2]) - max(x1, kb[0]))
            iy = max(0, min(y2, kb[3]) - max(y1, kb[1]))
            inter = ix * iy
            a1 = (x2 - x1) * (y2 - y1); a2 = (kb[2] - kb[0]) * (kb[3] - kb[1])
            if a1 and a2 and inter / min(a1, a2) > 0.85:
                dup = True; break
        if dup:
            notes.append("merged: duplicate change box"); continue
        ch["bbox_2d"] = [x1, y1, x2, y2]
        ch.setdefault("type", "other"); ch.setdefault("note", "")
        kept.append(ch)
    return kept, notes


def api_compare(past_path, present_path, question, interval_months):
    try:
        q = str(question or "").strip() or "What changed between these two images?"
        # R0 both images, R4 question class — refusals BEFORE any GPU call
        for p, tag in ((past_path, "past"), (present_path, "present")):
            ok, why = image_admissible(p)
            if not ok:
                meta = {"verdict": "REFUSED", "confidence": 100,
                        "reasons": [why], "latency_s": 0, "retries": 0,
                        "mode": "compare", "changes_count": 0,
                        "change_types": {}, "interval_months": interval_months,
                        "version": WORKER_VERSION}
                return ("[REFUSED] The {} image cannot support grounded analysis "
                        "({}). Provide a larger, clearer capture."
                        "\n\nconfidence: 100/100").format(tag, why), \
                       past_path, json.dumps(meta)
        if UNANSWERABLE_RE.search(q):
            meta = {"verdict": "REFUSED", "confidence": 100,
                    "reasons": ["R4: question class unanswerable from imagery"],
                    "latency_s": 0, "retries": 0, "mode": "compare",
                    "changes_count": 0, "change_types": {},
                    "interval_months": interval_months,
                    "version": WORKER_VERSION}
            return ("[REFUSED] Satellite pixels cannot answer this — population, "
                    "demographics, names, prices, ownership, reasons, predictions "
                    "and personal data are not visible from above. Refusing by "
                    "design.\n\nconfidence: 100/100"), past_path, json.dumps(meta)

        retries = 0
        r = _ask_compare(past_path, present_path, q)
        p = parse_json_answer(r["answer"])
        if p is None:                              # R1: one stricter retry
            retries = 1
            r = _ask_compare(past_path, present_path,
                             q + " Reply with the JSON object only.")
            p = parse_json_answer(r["answer"])

        changes = (p or {}).get("changes", [])
        summary = str((p or {}).get("summary", "")).strip()
        W, H = Image.open(present_path).size
        kept, notes = _audit_changes(changes, W, H)

        flat = summary.lower()
        if p is None:
            verdict = "UNCERTAIN"
            summary = summary or str(r["answer"])[:300]
            reasons = ["R1: comparison output was not valid JSON after retry"] + notes
        elif kept == [] and changes and ("no change" not in flat and
                                         "no significant" not in flat):
            verdict = "UNCERTAIN"                  # R2: claims, no surviving proof
            reasons = ["R2: summary claims changes but no boxes survived audit"] + notes
        else:
            verdict = "ANSWERED"
            reasons = notes

        conf = _confidence(verdict, reasons, retries, None)
        marked = _save_marked(present_path, kept, uuid.uuid4().hex[:8]) \
                 if kept else present_path
        types = {}
        for ch in kept:
            types[ch["type"]] = types.get(ch["type"], 0) + 1
        meta = {"verdict": verdict, "confidence": conf, "reasons": reasons,
                "latency_s": r["seconds"], "retries": retries,
                "mode": "compare", "changes_count": len(kept),
                "change_types": types,
                "interval_months": interval_months,
                "version": WORKER_VERSION}
        type_line = ", ".join("{} x {}".format(v, k)
                              for k, v in sorted(types.items())) or "none"
        report = ("[{}] {}\n\nChanges detected (boxed on the present image): {}"
                  "\n\nconfidence: {}/100").format(
                      verdict, summary or "Comparison complete.",
                      type_line, conf)
        return report, marked, json.dumps(meta)
    except Exception as e:
        traceback.print_exc()
        a, m, j = _err("The comparison engine hit an internal error ({}). "
                       "Retry in a moment.".format(e), "compare", e)
        return a, past_path, j


# ---- ENDPOINT 1: /health — no GPU, parallel-safe ---------------------------
def api_health():
    try:
        n_ok, n_bad = SELFTEST_RESULT
        return {"status": "online",
                "model": "Qwen2.5-VL-3B-Instruct (4-bit)",
                "engine": "refusal-v2 ({} / {} self-tests)".format(
                    n_ok, n_ok + n_bad),
                "queue": 0,
                "uptime_min": round((time.time() - T0) / 60, 1),
                "version": WORKER_VERSION}
    except Exception:
        return {"status": "online", "model": "unknown",
                "engine": "self-tests not run", "queue": 0,
                "uptime_min": round((time.time() - T0) / 60, 1),
                "version": WORKER_VERSION}


# ---- ENDPOINT 4: /predict — LOCKED Supabase path (ARCHITECTURE-LOCK §7.2) -
def api_predict(job_id, prompt, image_paths):
    if not ENABLE_SUPABASE:
        return "ERROR: supabase path disabled (direct-mode prototype worker)"
    try:
        import requests as _rq
        from supabase import create_client
        sb = create_client(SB_URL, SB_KEY)
        PUB = SB_URL + "/storage/v1/object/public/images/"
        local = []
        for path in image_paths:
            ext = os.path.splitext(str(path))[1] or ".png"
            t = "/kaggle/working/dl_{}{}".format(uuid.uuid4().hex[:8], ext)
            with open(t, "wb") as f:
                f.write(_rq.get(PUB + str(path), timeout=60).content)
            local.append(t)
        if len(local) >= 2:      # LOCKED semantics: last path = AFTER image
            answer, marked, _ = api_compare(local[0], local[-1], prompt, 6)
        else:
            answer, marked, _ = api_chat(local[0], prompt, 0.8)
        with open(marked, "rb") as f:
            sb.storage.from_("images").upload(
                "marked/{}.png".format(job_id), f.read())
        sb.table("jobs").update(
            {"status": "done", "answer": answer,
             "marked_image_path": "marked/{}.png".format(job_id)}
        ).eq("id", job_id).execute()
        return answer
    except Exception as e:
        traceback.print_exc()
        try:    # global rule 5: errors go to the row, never a crash
            from supabase import create_client
            sb = create_client(SB_URL, SB_KEY)
            sb.table("jobs").update(
                {"status": "error", "answer": "ERROR: {}".format(e)}
            ).eq("id", job_id).execute()
        except Exception:
            pass
        return "ERROR: {}".format(e)


# ---- the app: explicit api_name = stable public routes ---------------------
with gr.Blocks(title="SatQuery Worker") as worker:
    gr.Markdown("### SatQuery worker {} — direct API + manual test console"
                .format(WORKER_VERSION))
    with gr.Tab("chat"):
        c_img = gr.Image(type="filepath", label="image")
        c_q   = gr.Textbox(label="question")
        c_thr = gr.Number(value=0.8, label="confidence_threshold (1.0 / 0.8 / 0.5)")
        c_btn = gr.Button("Ask")
        c_a   = gr.Textbox(label="answer")
        c_m   = gr.Image(type="filepath", label="marked image")
        c_j   = gr.JSON(label="meta")
        c_btn.click(api_chat, [c_img, c_q, c_thr], [c_a, c_m, c_j],
                    api_name="chat")
    with gr.Tab("compare"):
        p_img = gr.Image(type="filepath", label="past image (5-6 months ago)")
        n_img = gr.Image(type="filepath", label="present image (current)")
        p_q   = gr.Textbox(label="question")
        p_mo  = gr.Number(value=6, label="interval_months")
        p_btn = gr.Button("Compare")
        p_a   = gr.Textbox(label="report")
        p_m   = gr.Image(type="filepath", label="marked present image")
        p_j   = gr.JSON(label="meta")
        p_btn.click(api_compare, [p_img, n_img, p_q, p_mo], [p_a, p_m, p_j],
                    api_name="compare")
    with gr.Tab("health"):
        h_btn = gr.Button("Check")
        h_j   = gr.JSON(label="status")
        h_btn.click(api_health, None, [h_j], api_name="health",
                    concurrency_limit=8)          # exempt from the serial queue
    with gr.Tab("predict (supabase lane)"):
        j_id  = gr.Textbox(label="job_id")
        j_pr  = gr.Textbox(label="prompt")
        j_ps  = gr.JSON(label="image_paths")
        j_btn = gr.Button("process job")
        j_st  = gr.Textbox(label="status")
        j_btn.click(api_predict, [j_id, j_pr, j_ps], [j_st],
                    api_name="predict")

worker.queue(max_size=16)
worker.launch(share=True, show_error=True)        # prints the gradio.live URL
print("WORKER ONLINE — paste this URL into the frontend settings gear.")

═════════════════ END CELL W ════════════════

SESSION CARE (for the human driving Kaggle): expect the session to die at
9–12 h. The relaunch drill is: restart session → run Cells 1–5 → run Cell W
→ copy the NEW gradio.live URL → paste it into the frontend settings gear
(or ?api= URL param). Target: under 10 minutes. Full runbook:
prompts/04-PROMPT-KAGGLE-OPERATOR.md.

WHAT NOT TO DO:
  - Do not "upgrade" the refusal rules, prompts, or thresholds in Cells 1–5.
  - Do not add auth, databases, or new endpoints — v1.1 is frozen.
  - Do not launch without share=True (localhost inside Kaggle is unreachable).
  - Do not print SB_KEY, and never commit it anywhere.

<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

AFTER THE AGENT FINISHES: run the five acceptance checks yourself
(prompts/05-GRADIO-CONNECTION-PROMPTS.md has the ready-made scripts), then
paste the gradio.live URL into the team chat. The frontend lane takes it
from there — no coordination meeting needed.
================================================================================
