# SatQuery / Drishti - Frontend Integration Contract
**Version**: 1.0 (Locked Architecture v1.0)  
**Project**: ST-09 SatQuery | Chakravyuh 2026  
**From**: Backend & Model Host Engineer (Kaggle)  
**To**: Frontend Team (Next.js / Vercel)

---

## 1. What You Receive from Backend
On integration day / demo rehearsal, the Kaggle worker will provide:
1. **The Gradio Tunnel URL**:  
   Active Tunnel URL: `https://021f5c525cab3de000.gradio.live`  
   Set this in your Vercel / `.env.local` as:
   ```env
   NEXT_PUBLIC_GRADIO_URL=https://021f5c525cab3de000.gradio.live
   ```
   *(During development without GPU, use `NEXT_PUBLIC_GRADIO_URL=mock`)*.

---

## 2. The Command Channel (Doorbell)
The Gradio tunnel only acts as a doorbell to signal that a job exists. **Never send binary image data through the tunnel.**

### Exact `/predict` Call Signature:
```typescript
import { Client } from "@gradio/client";

const app = await Client.connect(process.env.NEXT_PUBLIC_GRADIO_URL!);

// STRICT CONTRACT: Positional array with exactly 3 items!
// [0] jobId: string (UUID)
// [1] prompt: string (User question)
// [2] imagePaths: string[] (Array of Supabase storage paths in 'images' bucket)
await app.predict("/predict", [jobId, prompt, imagePaths]);
```

> ⚠️ **CRITICAL PITFALL**:  
> Do **NOT** pass an object `{ job_id, prompt, image_paths }`.  
> Gradio expects a **positional array** of exactly 3 arguments.

---

## 3. The Data Channel (Supabase)
Supabase is the single source of truth. **Never render what `predict()` returns.** Instead, listen to Supabase Realtime.

### 8-Step Lifecycle
1. **Upload original(s)** to bucket `images` under `orig/<uuid>`
2. **Insert row** in `jobs` table:
   ```typescript
   {
     user_id: user.id,
     prompt: "What changed in this forest?",
     image_paths: ["orig/uuid-1", "orig/uuid-2"],
     status: "processing"
   }
   ```
3. **Subscribe to Realtime FIRST, then trigger `/predict`**
4. Kaggle worker downloads images from Supabase
5. Worker runs VLM, localizes bounding boxes, and draws red annotations
6. Worker uploads marked PNG to `marked/<job_id>.png` in bucket `images`
7. Worker updates `jobs` row to `status: "done"`, `answer: "...", `marked_image_path: "marked/<job_id>.png"`
8. Your Supabase Realtime listener receives the update and renders the answer + marked image!

### Realtime Subscription Code:
```typescript
supabase
  .channel(`job-${jobId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "jobs",
      filter: `id=eq.${jobId}`,
    },
    ({ new: j }) => {
      if (j.status === "done") {
        const markedUrl = supabase.storage
          .from("images")
          .getPublicUrl(j.marked_image_path).data.publicUrl;
        // Render answer text and marked image side-by-side
        renderResult(j.answer, markedUrl);
      }
      if (j.status === "error") {
        renderError(j.answer);
      }
    }
  )
  .subscribe();
```

---

## 4. Multi-Image & Comparison Rules
- **1 Image Attached** = Query mode. Boxes drawn on that image.
- **2 Images Attached** = Comparison mode.  
  - Pass `imagePaths = [beforePath, afterPath]`.
  - Boxes are **always drawn on the AFTER (second) image** (`imgs[-1]`).
  - Add UI caption: *"Marks shown on the AFTER image."*

---

## 5. Timing & Watchdog
- GPU inference takes **30–90 seconds**. Display a calm state:  
  *"Analyzing satellite imagery... This can take up to ~2 minutes."*
- Arm a **90-second watchdog timer** in the browser. If a job remains in `processing` after 90s, flip it to `error` so the officer never sees an infinite spinner.
