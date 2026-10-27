# Drishti — Frontend Intelligence Dashboard

High-resolution satellite imagery question answering, feature segmentation, and bi-temporal change detection interface built with React 18, TypeScript, Tailwind CSS, and Vite.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

By default:
* `VITE_API_BASE_URL=http://localhost:8000` (points to local backend/FastAPI service)
* `VITE_USE_MOCK_ENGINE=false` (set to `true` to force client-side simulation when backend is offline)

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Build & Typecheck

```bash
# Typecheck and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📡 Backend & ML Integration

For detailed API contracts, response payloads, bounding box/polygon format, and sample FastAPI starter code, see [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md).
