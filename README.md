# Hackathon Project

A collaborative hackathon project built with Antigravity.

---

## 📁 Repository Structure

```text
├── frontend/       # Web / Mobile client application
├── backend/        # Server API, database services, and ML models
├── docs/           # Documentation, architecture diagrams, and pitch deck
├── .env.example    # Template for required environment variables
└── README.md       # Project overview & contribution guide
```

---

## 🚀 Quick Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/basavasrikarthikeya-source/hackathon-project.git
cd hackathon-project
```

### 2. Configure Environment
Never commit real secrets or `.env` files to git.
```bash
cp .env.example .env
# Edit .env with your local developer keys
```

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
