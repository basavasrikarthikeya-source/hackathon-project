# Drishti — Satellite Intelligence Studio

**ST-09 SatQuery | Chakravyuh 2026**  
AI-powered satellite imagery analysis and change-detection for government officers. *Model Flags, Humans Decide.*

---

## 📁 Repository Structure

```text
├── src/             # Next.js 16 Studio (primary demo app — Gradio + Supabase Realtime)
├── frontend/        # Vite/React UI (rich component library — simulated backend)
├── backend/         # Kaggle AI Worker (Qwen2.5-VL + Gradio tunnel)
├── docs/            # Schema, architecture, and pitch deck
├── prototypes/      # Standalone direct-mode prototype UI and test scripts
├── public/          # Static assets for Next.js app
├── .env.example     # Environment variable template
└── README.md        # This file
```

---

## 🚀 Quick Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/basavasrikanthikeya-source/hackathon-project.git
cd hackathon-project
```

### 2. Install Dependencies

**Next.js Studio (primary app):**
```bash
npm install
```

**Vite Frontend (secondary UI):**
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment
```bash
# For the Next.js Studio:
cp .env.example .env.local
# Edit .env.local — fill in NEXT_PUBLIC_SUPABASE_ANON_KEY at minimum.
# Set NEXT_PUBLIC_GRADIO_URL=mock for local dev (no Kaggle session needed).

# For the Vite frontend:
cp frontend/.env.example frontend/.env
# Edit frontend/.env — fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
```

### 4. Run the Next.js Studio
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Run the Vite Frontend (optional, simulated mode)
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

### 6. Start the Kaggle AI Worker (for real inference)
1. Upload `backend/satquery_kaggle_worker.ipynb` to Kaggle
2. Enable GPU (T4 or P100) and Internet in Notebook Settings
3. Run all cells — the last cell prints a `https://xxxx.gradio.live` URL
4. Copy that URL and set `NEXT_PUBLIC_GRADIO_URL=https://xxxx.gradio.live` in `.env.local`
5. Restart `npm run dev`

> ⚠️ **Gradio tunnel URLs expire** when the Kaggle session ends. Get a fresh URL before the demo!

---

## 👥 Hackathon Team Collaboration Rules

To avoid code overwrites and merge chaos during the hackathon, follow this workflow:

### 1. Always Work on a Dedicated Branch
Never commit directly to `main`.
```bash
# Pull latest main before starting
git checkout main
git pull origin main

# Create and switch to your feature branch
# Example: git checkout -b feature/frontend-auth or feature/backend-api
git checkout -b <branch-name>
```

### 2. Commit Often with Clear Messages
Stage only the files you intentionally modified:
```bash
git status
git add <specific-files-or-folders>
git commit -m "feat(scope): concise description of changes"
```

### 3. Push Your Branch
```bash
git push -u origin <branch-name>
```

### 4. Create a Pull Request (PR)
- Go to GitHub and open a Pull Request from `<branch-name>` into `main`.
- Teammates must review and test changes before merging into `main`.
- Resolve any merge conflicts locally before completing the merge.

---

## 🛡️ Security Best Practices
- **No Secrets:** Never commit `.env`, private keys, API credentials, or database passwords.
- **No Dependencies:** Do not commit `node_modules/` or `venv/` (these are handled by `.gitignore`).
- **No Force Pushes:** Never run `git push --force` on shared branches.
