# SatQuery Backend Engine (Direct Mode v1.1)

This folder contains the live engine worker configuration for **SatQuery (ST-09 Chakravyuh 2026)**.

## 🚀 Running on Kaggle (T4 GPU)
1. In the Kaggle notebook (`TIER0_CORE.ipynb`), ensure Cells 1–5 have run green (24/24 self-tests passed).
2. Paste the contents of `cell_w_worker.py` into **Cell W** at the bottom of the notebook.
3. Run Cell W. It starts the Gradio Blocks app with `launch(share=True)`.
4. Copy the public tunnel URL (`https://<id>.gradio.live`) and paste it into the frontend settings gear (or pass `?api=https://<id>.gradio.live` in the URL).

## 📡 The 4 Public API Endpoints (docs/01-ENDPOINT-CONTRACT.md)
1. `/health` — Liveness & status (returns model name, engine self-tests, uptime, version).
2. `/chat` — Interactive single-image grounded Q&A with evidence bounding boxes & confidence score.
3. `/compare` — Multi-temporal change analysis across PAST and PRESENT captures.
4. `/predict` — Two-channel doorbell endpoint for the locked Supabase/Vercel lane (disabled by default in direct-mode prototype).
