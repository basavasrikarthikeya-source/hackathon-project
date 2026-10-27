export type VerdictType = 'ANSWERED' | 'UNCERTAIN' | 'REFUSED';

export type AppMode = 'interactive' | 'comparison';

export type ColorTheme = 'orbit' | 'emerald' | 'deepspace' | 'tactical';

export interface BoundingBox {
  id: string;
  label: string;
  confidence: number;
  // Normalized coordinates (0 - 100%)
  x: number;
  y: number;
  width: number;
  height: number;
  category: 'building' | 'water' | 'vegetation' | 'infrastructure' | 'change' | 'anomaly';
}

export interface PolygonOutline {
  id: string;
  label: string;
  confidence: number;
  // Normalized points string "x1,y1 x2,y2 ..." or array
  points: string;
  category: 'building' | 'water' | 'vegetation' | 'infrastructure' | 'change' | 'anomaly';
}

export interface AuditCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  metric?: string;
}

export interface AttachedImage {
  id: string;
  url: string;
  name: string;
  size?: string;
  format?: 'PNG' | 'JPG' | 'GeoTIFF' | 'Web URL' | 'Satellite API';
  type?: 'before' | 'after' | 'single';
  file?: File;
  sensor?: string;
  gsd?: string;
  acquisitionDate?: string;
}

export interface DrishtiAnswer {
  headline: string;
  summary: string;
  metricValue?: string | number;
  metricUnit?: string;
  verdict: VerdictType;
  verdictReason: string;
  confidenceScore: number;
  auditTrail: AuditCheck[];
  imageUrl: string;
  imageAlt?: string;
  boxes: BoundingBox[];
  polygons: PolygonOutline[];
  categoryBreakdown?: { label: string; count: number; color?: string }[];
}

export interface Message {
  id: string;
  sender: 'user' | 'drishti';
  timestamp: string;
  text: string;
  images?: AttachedImage[];
  answer?: DrishtiAnswer;
  isLoading?: boolean;
  loadingStep?: string;
  mode?: AppMode;
  comparisonPair?: {
    before: AttachedImage;
    after: AttachedImage;
  };
}

export interface SatelliteProvider {
  id: string;
  name: string;
  constellation: string;
  resolution: string;
  revisit: string;
  spectralBands: string;
  description: string;
}
