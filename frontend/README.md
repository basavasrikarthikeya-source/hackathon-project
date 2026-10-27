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

## 🎬 High-Fidelity 1080p Video Scrubbing Guide (Tier A All-Intra)

Drishti uses an **All-Intra progressive dual-stream** video scrubbing architecture. To guarantee 60fps stutter-free seek performance while restoring pristine 1080p master clarity (SSIM ≥ 0.99), media assets are encoded as follows:

### Chosen Production Tier: Tier A (All-Intra Master Quality)
Every single frame is an intra-frame (keyframe), ensuring 0ms backward/forward seek decoding latency:

```bash
# 1. Full 1080p HD Stream (Desktop & Tablet) - SSIM 0.9971, ~37.9 MB
ffmpeg -i input.mp4 -vf "fps=24,scale=1920:-2:flags=lanczos" \
  -c:v libx264 -g 1 -keyint_min 1 -bf 0 -crf 15 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an public/earth-scrub-1080.mp4

# 2. Fast-Start Preview & Mobile Stream (1280x720) - ~1.7 MB
ffmpeg -i input.mp4 -vf "fps=24,scale=1280:-2:flags=lanczos" \
  -c:v libx264 -g 1 -keyint_min 1 -bf 0 -crf 20 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an public/earth-scrub-preview.mp4

# 3. Full-Resolution 1080p Poster (Frame 0, Quality 95)
ffmpeg -ss 00:00:00 -i input.mp4 -vframes 1 -q:v 2 public/assets/earth-horizon.png
```

### Alternative Tiers

#### Tier B (Short GOP fallback if storage < 20 MB is mandatory)
```bash
ffmpeg -i input.mp4 -vf "fps=24,scale=1920:-2:flags=lanczos" \
  -c:v libx264 -g 3 -keyint_min 1 -bf 0 -crf 16 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an public/earth-scrub-1080.mp4
```

#### Tier C (Canvas WebP Frame Sequence for `SCRUB.MODE = "frames"`)
```bash
mkdir -p public/frames
ffmpeg -i input.mp4 -vf "fps=24,scale=1920:-2:flags=lanczos" \
  -c:v libwebp -quality 90 -compression_level 5 public/frames/f_%04d.webp
```

### Quality Verification (Objective SSIM Benchmark)
To verify visual fidelity against your original source master:
```bash
ffmpeg -i public/earth-scrub-1080.mp4 -i ORIGINAL.mp4 -lavfi "[0:v][1:v]ssim" -f null -
```
*Current Drishti Benchmark:* **SSIM All: 0.997127** (exceeds 0.97 target).
