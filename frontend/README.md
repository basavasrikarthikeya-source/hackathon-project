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

---

## 🎬 Video Scrubbing Re-encoding Guide (All-Intra)

For 100% smooth, stutter-free video scrubbing with mouse wheel and trackpad, re-encode your source video so every frame is an intra-frame (keyframe):

### Desktop Variant (1920px width)
```bash
ffmpeg -i input.mp4 -vf "fps=30,scale=1920:-2" -c:v libx264 -g 1 \
  -keyint_min 1 -crf 20 -preset slow -pix_fmt yuv420p \
  -movflags +faststart -an public/earth-scrub.mp4
```

### Mobile Variant (1280px width)
```bash
ffmpeg -i input.mp4 -vf "fps=30,scale=1280:-2" -c:v libx264 -g 1 \
  -keyint_min 1 -crf 20 -preset slow -pix_fmt yuv420p \
  -movflags +faststart -an public/earth-scrub-mobile.mp4
```

> [!TIP]
> If the resulting video file exceeds ~30 MB, use `fps=24` and `crf 23` to reduce file size while preserving high visual quality.

### Canvas Frames Fallback (for `SCRUB.MODE = "frames"`)
```bash
mkdir -p public/frames
ffmpeg -i input.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp \
  -quality 80 public/frames/f_%04d.webp
```
For mobile, generate a 1000px-wide set:
```bash
ffmpeg -i input.mp4 -vf "fps=24,scale=1000:-2" -c:v libwebp \
  -quality 80 public/frames/f_%04d.webp
```
