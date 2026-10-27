# Backend Application & AI Engine (Drishti / SatQuery)

This folder contains the backend AI worker, database definitions, API contract, and verification scripts for the Drishti / SatQuery platform.

---

## 📁 Folder Structure

- **`kaggle_worker.py`**: Standalone Python AI inference engine. Runs Qwen2.5-VL for satellite imagery analysis, change detection, and bounding box annotation, communicating with Supabase and exposing a Gradio tunnel endpoint.
- **cell_w_worker.py**: Standalone direct-mode worker script (Cell W). Exposes /health, /chat, /compare, and /predict Gradio endpoints directly for quick testing and direct browser-to-engine communication without requiring Supabase.
- **`satquery_kaggle_worker.ipynb`**: Ready-to-run Jupyter notebook for Kaggle (GPU T4/P100 or 2xT4).
- **`API_CONTRACT_FOR_FRONTEND.md`**: Formal integration contract detailing the `/predict` doorbell signature, Supabase realtime channels, and data flow between Frontend and Backend.
- **`test_backend_pipeline.py`**: Smoke test script verifying Supabase connectivity, `images` storage bucket, and `jobs` table accessibility.
- **`supabase_setup.sql`**: Complete database schema (tables, RLS policies, indexes, storage buckets).
- **`requirements.txt`**: Required Python packages.

---

## 🚀 Quickstart Guide

### 1. Database Setup
1. In your [Supabase Dashboard](https://supabase.com), open the SQL Editor.
2. Run the script `backend/supabase_setup.sql` to initialize tables (`jobs`, `feedback`) and the public `images` storage bucket.

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Verify Connection
Set your environment variables:
```bash
export SUPABASE_URL="https://<your-project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
# Or configure in .env.local
python test_backend_pipeline.py
```

### 4. Deploying the AI Worker on Kaggle
1. Open Kaggle and create a new notebook with GPU accelerator (T4, P100, or 2xT4).
2. Import `satquery_kaggle_worker.ipynb` or paste `kaggle_worker.py`.
3. Set Kaggle secrets for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run all cells: the worker will initialize the VLM model and print a public Gradio tunnel URL (e.g., `https://xxxx.gradio.live`).
5. Share this URL with the frontend team (configure as `NEXT_PUBLIC_GRADIO_URL`).
