# Drishti Engine — Backend & ML Integration Guide

This document outlines the API specifications and integration steps for connecting your team's backend and ML satellite inference engine to the Drishti frontend UI.

---

## 1. Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your backend URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCK_ENGINE=false
   ```
3. Restart or start the frontend (`npm run dev`). All queries will automatically route to your backend with fallback handling.

---

## 2. API Endpoints

### `POST /api/v1/analyze`
Executes single-image question answering (counting buildings, locating water, etc.).

* **Content-Type**: `multipart/form-data` or `application/json`
* **Request Fields**:
  * `prompt` (*string*): Analyst query (e.g. `"How many buildings are here?"`)
  * `mode` (*string*): `"interactive"`
  * `file_0` (*binary*): Raster image file (PNG, JPG, or GeoTIFF) OR `image_url_0` (*string*)
  * `options` (*optional JSON*): Confidence thresholds, GSD calibration limits.

* **Expected Response (`200 OK`)**:
```json
{
  "headline": "42 structures detected in Sector NW-4",
  "summary": "High-resolution feature segmentation identified 42 distinct building footprints...",
  "metricValue": "42",
  "metricUnit": "structures",
  "verdict": "ANSWERED",
  "verdictReason": "Sub-meter optical clarity (0.3m GSD) and 0% cloud cover enabled 96.8% mean ensemble confidence.",
  "confidenceScore": 96.8,
  "imageUrl": "/assets/urban-satellite.jpg",
  "boxes": [
    {
      "id": "b1",
      "label": "Residential Block A",
      "confidence": 98.4,
      "x": 12.0,
      "y": 18.0,
      "width": 14.0,
      "height": 16.0,
      "category": "building"
    }
  ],
  "polygons": [
    {
      "id": "p1",
      "label": "Residential Roof Footprint A",
      "confidence": 98.4,
      "points": "12,18 26,18 26,34 12,34",
      "category": "building"
    }
  ],
  "categoryBreakdown": [
    { "label": "Residential Homes", "count": 31, "color": "#38bdf8" },
    { "label": "Commercial Complexes", "count": 8, "color": "#818cf8" }
  ],
  "auditTrail": [
    {
      "id": "c1",
      "name": "Spatial Resolution & GSD Limit",
      "status": "pass",
      "detail": "0.30 m/px provides 12+ pixels across shortest building edge.",
      "metric": "0.30m (Pass > 0.5m req)"
    },
    {
      "id": "c2",
      "name": "Cloud & Shadow Masking",
      "status": "pass",
      "detail": "Fmask computed 0.0% cloud occlusion over target AOI.",
      "metric": "0.0% Cloud"
    }
  ]
}
```

---

### `POST /api/v1/compare`
Executes bi-temporal change detection queries between "Before" and "After" scenes.

* **Content-Type**: `multipart/form-data`
* **Request Fields**:
  * `prompt` (*string*): e.g. `"What changed between these images?"`
  * `mode` (*string*): `"comparison"`
  * `before_name` (*string*), `file_before` (*binary*)
  * `after_name` (*string*), `file_after` (*binary*)

* **Expected Response (`200 OK`)**: Same `DrishtiAnswer` structure, featuring:
  * `verdict`: `"ANSWERED"`, `"UNCERTAIN"`, or `"REFUSED"`
  * `metricValue`: e.g. `"14.8"`
  * `metricUnit`: e.g. `"hectares cleared"`
  * Polygons and Bounding Boxes highlighting change areas
  * Coregistration RMSE audit checks

---

### `GET /api/v1/health`
* **Response (`200 OK`)**: `{"status": "ok", "version": "1.0.0"}`

---

## 3. Sample FastAPI Starter Backend (Python)

```python
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Drishti AI Inference Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "2.4.0"}

@app.post("/api/v1/analyze")
async def analyze_scene(
    prompt: str = Form(...),
    mode: str = Form("interactive")
):
    # 1. Run your Computer Vision / Remote Sensing model (YOLO, Mask R-CNN, SAM, etc.)
    # 2. Compute spectral indices (NDVI, NDWI) and cloud mask (Fmask)
    # 3. Apply epistemic guardrail logic:
    #    - If cloud > 15% -> verdict = 'UNCERTAIN'
    #    - If face/PII query -> verdict = 'REFUSED'
    #    - Else -> verdict = 'ANSWERED'

    return {
        "headline": "42 structures detected",
        "summary": f"Analyzed query: '{prompt}'. Ingested optical orthomosaic.",
        "metricValue": 42,
        "metricUnit": "structures",
        "verdict": "ANSWERED",
        "verdictReason": "0.3m GSD and 0% cloud cover verified.",
        "confidenceScore": 96.8,
        "imageUrl": "/assets/urban-satellite.jpg",
        "boxes": [
            {"id": "b1", "label": "Structure 1", "confidence": 98.4, "x": 12, "y": 18, "width": 14, "height": 16, "category": "building"}
        ],
        "polygons": [
            {"id": "p1", "label": "Structure Footprint", "confidence": 98.4, "points": "12,18 26,18 26,34 12,34", "category": "building"}
        ],
        "auditTrail": [
            {"id": "c1", "name": "GSD Check", "status": "pass", "detail": "Spatial limit verified.", "metric": "0.30m"}
        ]
    }
```

---

## 4. Key Integration Advantages
* **Decoupled Architecture**: UI rendering and API logic are strictly separated in `src/services/api.ts`.
* **Zero UI Changes Required**: Your team can write the backend in any language (Python/FastAPI, PyTorch, Go, Node.js).
* **Fault Tolerant**: If the backend is temporarily offline, the frontend gracefully falls back to local simulation without throwing uncaught errors.
* **Coordinate Invariance**: Bounding boxes and polygons use percentage-normalized coordinates ($0.0 - 100.0$), making them independent of image screen resolution.
