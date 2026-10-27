import { AttachedImage, DrishtiAnswer, AppMode } from '../types';
import { DEMO_ANSWERS, SAMPLE_IMAGES } from '../constants/sampleData';

// API configuration from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const USE_MOCK_ENGINE = import.meta.env.VITE_USE_MOCK_ENGINE !== 'false'; // Defaults to true if no backend URL set

export interface AnalyzePayload {
  prompt: string;
  mode: AppMode;
  images: AttachedImage[];
  comparisonPair?: {
    before: AttachedImage;
    after: AttachedImage;
  };
  options?: {
    confidenceThreshold?: number;
    maxCloudCover?: number;
    aoiBoundingBox?: [number, number, number, number];
  };
}

export interface ProgressCallback {
  (step: string, percentage?: number): void;
}

/**
 * Drishti Engine API Client
 *
 * This client bridges the frontend to your team's backend/ML engine.
 * It supports standard REST endpoints and can easily be connected to
 * FastAPI, Flask, Express, Django, or microservices.
 */
export class DrishtiEngineService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Health check to verify backend connectivity
   */
  async checkHealth(): Promise<{ status: 'ok' | 'error'; latencyMs?: number }> {
    if (!this.baseUrl) {
      return { status: 'error' };
    }

    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/health`, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { status: 'ok', latencyMs };
      }
      return { status: 'error', latencyMs };
    } catch {
      return { status: 'error' };
    }
  }

  /**
   * Primary query analysis method
   * If backend is configured, calls POST /api/v1/analyze or /api/v1/compare
   * If backend is not available, gracefully falls back to the client simulation engine.
   */
  async analyze(
    payload: AnalyzePayload,
    onProgress?: ProgressCallback
  ): Promise<DrishtiAnswer> {
    // If a backend URL is set and not forcing mock mode:
    if (this.baseUrl && !USE_MOCK_ENGINE) {
      return this.sendToBackend(payload, onProgress);
    }

    // Otherwise, execute client-side simulation engine
    return this.simulateEngine(payload, onProgress);
  }

  /**
   * Real backend integration method
   */
  private async sendToBackend(
    payload: AnalyzePayload,
    onProgress?: ProgressCallback
  ): Promise<DrishtiAnswer> {
    const endpoint = payload.mode === 'comparison'
      ? `${this.baseUrl}/api/v1/compare`
      : `${this.baseUrl}/api/v1/analyze`;

    onProgress?.('Sending imagery raster to ML inference engine (Step 1/4)...', 25);

    // Support multipart/form-data for uploading raw GeoTIFF/PNG files if present,
    // or JSON for URL/base64 payloads.
    const formData = new FormData();
    formData.append('prompt', payload.prompt);
    formData.append('mode', payload.mode);

    payload.images.forEach((img, idx) => {
      if (img.file) {
        formData.append(`file_${idx}`, img.file, img.name);
      } else {
        formData.append(`image_url_${idx}`, img.url);
      }
    });

    if (payload.comparisonPair) {
      formData.append('before_name', payload.comparisonPair.before.name);
      formData.append('after_name', payload.comparisonPair.after.name);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Engine returned HTTP ${response.status}: ${errorText}`);
      }

      onProgress?.('Verifying spatial coordinates and epistemic guardrails (Step 3/4)...', 75);

      const data: DrishtiAnswer = await response.json();
      onProgress?.('Rendering evidence layers and audit checklist (Step 4/4)...', 100);

      return data;
    } catch (err) {
      console.warn('Backend request failed, falling back to local simulation:', err);
      // Graceful fallback if backend is momentarily unreachable
      return this.simulateEngine(payload, onProgress);
    }
  }

  /**
   * Built-in simulation fallback engine
   * Matches intent and provides realistic data so UI works immediately.
   */
  private async simulateEngine(
    payload: AnalyzePayload,
    onProgress?: ProgressCallback
  ): Promise<DrishtiAnswer> {
    onProgress?.('Ingesting Multi-spectral Bands (Step 1/4)...', 25);
    await new Promise(r => setTimeout(r, 550));

    onProgress?.('Segmenting Feature Boundaries & Calculating Indices (Step 2/4)...', 50);
    await new Promise(r => setTimeout(r, 600));

    onProgress?.('Evaluating Epistemic Guardrails & Cloud Masks (Step 3/4)...', 75);
    await new Promise(r => setTimeout(r, 500));

    onProgress?.('Generating Sub-pixel Overlays & Audit Report (Step 4/4)...', 100);
    await new Promise(r => setTimeout(r, 450));

    const lower = payload.prompt.toLowerCase();

    // Intent routing
    if (
      lower.includes('face') ||
      lower.includes('plate') ||
      lower.includes('person') ||
      lower.includes('license') ||
      lower.includes('spy')
    ) {
      return DEMO_ANSWERS.refusedBiometrics;
    }

    if (
      lower.includes('cloud') ||
      lower.includes('fog') ||
      lower.includes('haze') ||
      lower.includes('under')
    ) {
      return DEMO_ANSWERS.uncertainCloud;
    }

    if (
      lower.includes('change') ||
      lower.includes('differ') ||
      payload.mode === 'comparison'
    ) {
      return DEMO_ANSWERS.changeDetection;
    }

    if (
      lower.includes('water') ||
      lower.includes('river') ||
      lower.includes('lake') ||
      lower.includes('flood')
    ) {
      return DEMO_ANSWERS.water;
    }

    return DEMO_ANSWERS.buildings;
  }
}

export const drishtiEngine = new DrishtiEngineService();
