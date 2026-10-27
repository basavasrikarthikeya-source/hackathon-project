import { DrishtiAnswer, AttachedImage, SatelliteProvider } from '../types';

export const SAMPLE_PROVIDERS: SatelliteProvider[] = [
  {
    id: 'sentinel-2',
    name: 'Copernicus Sentinel-2 (ESA)',
    constellation: 'Sentinel-2A / 2B MSI',
    resolution: '10m - 20m GSD (Multi-spectral)',
    revisit: '5 days global revisit',
    spectralBands: '13 optical & NIR bands (B1 - B12)',
    description: 'Open-access public Earth observation satellite system providing continuous land surface and coastal monitoring.'
  },
  {
    id: 'planetscope',
    name: 'PlanetScope Dove Constellation',
    constellation: '200+ Doves & SuperDoves',
    resolution: '3.0m - 3.7m GSD',
    revisit: 'Daily global coverage',
    spectralBands: '8 bands (RGB, RedEdge, NIR, Green I/II)',
    description: 'High-frequency daily imaging constellation for near-real-time monitoring of rapid land-use change.'
  },
  {
    id: 'maxar-wv3',
    name: 'Maxar WorldView-3 / Legion',
    constellation: 'Maxar Very High Resolution',
    resolution: '0.30m (30cm) Panchromatic / 1.2m Multispectral',
    revisit: 'Intra-day pointable agility',
    spectralBands: 'Panchromatic, 8 VNIR, 8 SWIR, 12 CAVIS',
    description: 'Commercial gold standard for ultra-high-resolution structural counting, military intelligence, and precision urban mapping.'
  },
  {
    id: 'airbus-neo',
    name: 'Airbus Pléiades Neo',
    constellation: 'Pléiades Neo 3 & 4',
    resolution: '0.30m Native GSD',
    revisit: 'Twice daily anywhere on Earth',
    spectralBands: 'Deep Blue, Blue, Green, Red, Red Edge, NIR',
    description: 'Advanced European commercial constellation optimized for 30cm infrastructure and 3D terrain reconstruction.'
  },
  {
    id: 'landsat-9',
    name: 'USGS / NASA Landsat 9',
    constellation: 'OLI-2 & TIRS-2',
    resolution: '15m Pan / 30m Multispectral / 100m Thermal',
    revisit: '16 days (8 days with Landsat 8)',
    spectralBands: '11 spectral bands including dual thermal IR',
    description: 'Long-term environmental and hydrological monitoring since 1972 with calibrated radiometric accuracy.'
  }
];

export const SAMPLE_IMAGES: Record<string, AttachedImage> = {
  urban: {
    id: 'img-urban-1',
    name: 'Sector-04_Metro_Maxar_0.3m.tif',
    url: '/assets/urban-satellite.jpg',
    size: '14.2 MB',
    format: 'GeoTIFF',
    sensor: 'Maxar WorldView-3 (0.3m GSD)',
    acquisitionDate: '2024-10-18 10:24 UTC',
    gsd: '0.30 m/px'
  },
  water: {
    id: 'img-water-1',
    name: 'Lake_Bhimtal_Sentinel2_MSI.png',
    url: '/assets/water-satellite.jpg',
    size: '8.7 MB',
    format: 'PNG',
    sensor: 'Copernicus Sentinel-2B',
    acquisitionDate: '2024-09-29 05:42 UTC',
    gsd: '10.0 m/px'
  },
  forestBefore: {
    id: 'img-forest-before',
    name: 'Amazonas_Block7_2022-08-14.tif',
    url: '/assets/forest-before.jpg',
    size: '18.4 MB',
    format: 'GeoTIFF',
    type: 'before',
    sensor: 'PlanetScope SuperDove (3m GSD)',
    acquisitionDate: '2022-08-14 14:15 UTC',
    gsd: '3.1 m/px'
  },
  forestAfter: {
    id: 'img-forest-after',
    name: 'Amazonas_Block7_2024-10-22.tif',
    url: '/assets/forest-after.jpg',
    size: '19.1 MB',
    format: 'GeoTIFF',
    type: 'after',
    sensor: 'PlanetScope SuperDove (3m GSD)',
    acquisitionDate: '2024-10-22 14:18 UTC',
    gsd: '3.1 m/px'
  },
  floodBefore: {
    id: 'img-flood-before',
    name: 'Indus_Basin_Baseline_2024-06-10.jpg',
    url: '/assets/flood-before.jpg',
    size: '9.3 MB',
    format: 'JPG',
    type: 'before',
    sensor: 'Sentinel-2A MSI',
    acquisitionDate: '2024-06-10 06:12 UTC',
    gsd: '10.0 m/px'
  },
  floodAfter: {
    id: 'img-flood-after',
    name: 'Indus_Basin_PostEvent_2024-09-02.jpg',
    url: '/assets/flood-after.jpg',
    size: '11.8 MB',
    format: 'JPG',
    type: 'after',
    sensor: 'Sentinel-2B MSI',
    acquisitionDate: '2024-09-02 06:15 UTC',
    gsd: '10.0 m/px'
  },
  cloudy: {
    id: 'img-cloudy-1',
    name: 'Western_Ghats_Monsoon_CloudCover.jpg',
    url: '/assets/cloudy-satellite.jpg',
    size: '12.6 MB',
    format: 'JPG',
    sensor: 'Sentinel-2 MSI',
    acquisitionDate: '2024-07-15 05:50 UTC',
    gsd: '10.0 m/px'
  }
};

// Preset structured answers for demo prompts
export const DEMO_ANSWERS: Record<string, DrishtiAnswer> = {
  buildings: {
    headline: '42 structures detected in Sector NW-4',
    summary: 'High-resolution feature segmentation identified 42 distinct building footprints across the 1.2 km² urban tile. 31 single-family residential rooftops, 8 commercial complexes, and 3 industrial warehouses. Average structural footprint: 218 m².',
    metricValue: '42',
    metricUnit: 'structures',
    verdict: 'ANSWERED',
    verdictReason: 'Sub-meter optical clarity (0.3m GSD), 0% cloud cover, and clean rooftop boundary contrast enabled 96.8% mean ensemble confidence.',
    confidenceScore: 96.8,
    imageUrl: '/assets/urban-satellite.jpg',
    imageAlt: 'High resolution satellite image of urban settlement with annotated building footprints',
    boxes: [
      { id: 'b1', label: 'Residential Block A', confidence: 98.4, x: 12, y: 18, width: 14, height: 16, category: 'building' },
      { id: 'b2', label: 'Residential Block B', confidence: 97.1, x: 30, y: 15, width: 15, height: 18, category: 'building' },
      { id: 'b3', label: 'Commercial Centre', confidence: 99.2, x: 50, y: 22, width: 22, height: 26, category: 'building' },
      { id: 'b4', label: 'Industrial Warehouse 01', confidence: 95.8, x: 76, y: 18, width: 18, height: 24, category: 'building' },
      { id: 'b5', label: 'Mixed-Use Unit 09', confidence: 94.6, x: 16, y: 48, width: 18, height: 20, category: 'building' },
      { id: 'b6', label: 'Civic Building', confidence: 98.0, x: 42, y: 55, width: 20, height: 22, category: 'building' },
      { id: 'b7', label: 'Storage Facility', confidence: 96.3, x: 68, y: 52, width: 24, height: 28, category: 'building' },
      { id: 'b8', label: 'Residential Cluster S', confidence: 93.9, x: 25, y: 74, width: 20, height: 18, category: 'building' }
    ],
    polygons: [
      { id: 'p1', label: 'Residential Roof Footprint A', confidence: 98.4, points: '12,18 26,18 26,34 12,34', category: 'building' },
      { id: 'p2', label: 'Residential Roof Footprint B', confidence: 97.1, points: '30,15 45,15 45,33 30,33', category: 'building' },
      { id: 'p3', label: 'Commercial Complex Footprint', confidence: 99.2, points: '50,22 72,22 72,48 50,48', category: 'building' },
      { id: 'p4', label: 'Warehouse Perimeter', confidence: 95.8, points: '76,18 94,18 94,42 76,42', category: 'building' },
      { id: 'p5', label: 'Mixed Unit Outlines', confidence: 94.6, points: '16,48 34,48 34,68 16,68', category: 'building' },
      { id: 'p6', label: 'Civic Hub Polygon', confidence: 98.0, points: '42,55 62,55 62,77 42,77', category: 'building' },
      { id: 'p7', label: 'Storage Facility Footprint', confidence: 96.3, points: '68,52 92,52 92,80 68,80', category: 'building' },
      { id: 'p8', label: 'Southern Residential Block', confidence: 93.9, points: '25,74 45,74 45,92 25,92', category: 'building' }
    ],
    categoryBreakdown: [
      { label: 'Residential Homes', count: 31, color: '#38bdf8' },
      { label: 'Commercial Complexes', count: 8, color: '#818cf8' },
      { label: 'Industrial Sheds', count: 3, color: '#f472b6' }
    ],
    auditTrail: [
      { id: 'c1', name: 'Spatial Resolution & GSD Limit', status: 'pass', detail: '0.30 m/px provides 12+ pixels across shortest building edge.', metric: '0.30m (Pass > 0.5m req)' },
      { id: 'c2', name: 'Cloud & Shadow Masking', status: 'pass', detail: 'Fmask computed 0.0% cloud occlusion and 0.2% minor tree shadow over tile.', metric: '0.0% Cloud' },
      { id: 'c3', name: 'Solar Zenith Angle Alignment', status: 'pass', detail: 'Solar elevation 42.1°, shadow distortion corrected by 14.2% projected angle.', metric: 'Zenith 42.1°' },
      { id: 'c4', name: 'IoU Ensemble Consensus', status: 'pass', detail: 'Dual-backbone cross-validation (ResNet-101 + Swin-L) achieved 96.8% agreement.', metric: 'IoU 0.94' },
      { id: 'c5', name: 'Hallucination Boundary Verification', status: 'pass', detail: 'Zero false-positive artifacts against vector cadastral ground truth.', metric: 'Verified' }
    ]
  },

  water: {
    headline: 'Surface water located: 3.84 km²',
    summary: 'Multi-spectral band synthesis identified 3.84 km² of contiguous surface water. Primary reservoir body accounts for 3.12 km², with secondary tributary river channel extending 0.72 km² into the southern valley.',
    metricValue: '3.84',
    metricUnit: 'km² surface area',
    verdict: 'ANSWERED',
    verdictReason: 'Unambiguous spectral signature: Normalized Difference Water Index (NDWI = [Green - NIR] / [Green + NIR]) > +0.38 across all detected water zones.',
    confidenceScore: 99.1,
    imageUrl: '/assets/water-satellite.jpg',
    imageAlt: 'Satellite imagery showing turquoise and deep blue hydrological body',
    boxes: [
      { id: 'wb1', label: 'Primary Reservoir Basin', confidence: 99.4, x: 8, y: 12, width: 84, height: 48, category: 'water' },
      { id: 'wb2', label: 'River Inlet Channel', confidence: 97.8, x: 24, y: 60, width: 42, height: 32, category: 'water' }
    ],
    polygons: [
      { id: 'wp1', label: 'Reservoir Water Line Boundary', confidence: 99.4, points: '8,25 22,12 55,14 86,22 92,44 78,56 46,58 20,52 8,40', category: 'water' },
      { id: 'wp2', label: 'Tributary Water Course', confidence: 97.8, points: '24,60 38,58 56,66 62,88 44,92 30,82 24,68', category: 'water' }
    ],
    categoryBreakdown: [
      { label: 'Deep Water Body', count: 1, color: '#06b6d4' },
      { label: 'Shallow Inlet / Channel', count: 1, color: '#38bdf8' }
    ],
    auditTrail: [
      { id: 'c1', name: 'NDWI Spectral Extraction', status: 'pass', detail: 'Green (Band 3) vs NIR (Band 8) separation index calculated at +0.44 mean.', metric: 'NDWI +0.44' },
      { id: 'c2', name: 'Turbidity & Sediment Discrimination', status: 'pass', detail: 'Sediment-rich shallows separated from muddy banks using SWIR thresholding.', metric: 'SWIR Ratio 1.82' },
      { id: 'c3', name: 'DEM Water Elevation Conformity', status: 'pass', detail: 'Copernicus 30m DEM flat-plane slope check confirms 0.02% water gradient.', metric: 'Slope 0.02%' },
      { id: 'c4', name: 'Edge Boundary Sharpness', status: 'pass', detail: 'Sub-pixel edge detection delineated coastline with 99.1% boundary certainty.', metric: 'Sub-pixel σ=0.14' }
    ]
  },

  changeDetection: {
    headline: '14.8 hectares of canopy loss detected',
    summary: 'Bi-temporal change analysis between August 2022 and October 2024 reveals 14.8 ha of tree canopy loss. Core spatial pattern indicates intentional road expansion corridors (2.4 km length) branching into three agricultural clear-cut zones.',
    metricValue: '14.8',
    metricUnit: 'hectares cleared',
    verdict: 'ANSWERED',
    verdictReason: 'Bi-temporal coregistration achieved RMSE 0.18px. Significant NDVI drop from +0.81 (healthy dense canopy) to +0.22 (bare exposed soil).',
    confidenceScore: 97.4,
    imageUrl: '/assets/forest-after.jpg',
    imageAlt: 'Satellite change comparison showing deforestation cuts and access routes',
    boxes: [
      { id: 'cb1', label: 'Canopy Loss Zone A (Clear-cut)', confidence: 98.2, x: 22, y: 16, width: 34, height: 38, category: 'change' },
      { id: 'cb2', label: 'Logging Road Corridor', confidence: 96.5, x: 52, y: 44, width: 36, height: 42, category: 'change' }
    ],
    polygons: [
      { id: 'cp1', label: 'Clear-cut Deforestation Boundary', confidence: 98.2, points: '22,18 48,16 56,34 50,54 28,52 22,36', category: 'change' },
      { id: 'cp2', label: 'Linear Road Penetration Vector', confidence: 96.5, points: '52,44 64,42 86,72 88,86 76,86 58,62', category: 'change' }
    ],
    categoryBreakdown: [
      { label: 'Deforested Clear-cut', count: 1, color: '#ef4444' },
      { label: 'Linear Access Corridor', count: 1, color: '#f97316' }
    ],
    auditTrail: [
      { id: 'c1', name: 'Coregistration Accuracy', status: 'pass', detail: 'Sub-pixel tie-point registration achieved 0.18 pixel root-mean-square error.', metric: 'RMSE 0.18 px' },
      { id: 'c2', name: 'Phenology Seasonality Adjustment', status: 'pass', detail: 'Solar azimuth and dry-season vegetation indices normalized between dates.', metric: 'ΔSeason < 4%' },
      { id: 'c3', name: 'NDVI Differential Verification', status: 'pass', detail: 'Mean NDVI dropped by -0.59 (from 0.81 down to 0.22). Statistically significant at p<0.001.', metric: 'ΔNDVI -0.59' },
      { id: 'c4', name: 'Sensor Calibration Match', status: 'pass', detail: 'PlanetScope Dove constellation cross-calibrated against Sentinel-2 surface reflectance.', metric: 'Calibrated' }
    ]
  },

  uncertainCloud: {
    headline: 'Analysis Uncertain: 52% Cloud Occlusion',
    summary: 'Unable to reliably count structures or map water channels in Sector SE-2. Heavy cumulus cloud cover obscuring 52% of the ground footprint; shadow projection creates false water signatures in optical spectrum.',
    metricValue: '52%',
    metricUnit: 'cloud occlusion',
    verdict: 'UNCERTAIN',
    verdictReason: 'Cloud thickness attenuates optical signal below signal-to-noise threshold. Optical bands 2-8 cannot confirm ground features with required 90% certainty.',
    confidenceScore: 41.2,
    imageUrl: '/assets/cloudy-satellite.jpg',
    imageAlt: 'Dense cumulus cloud bank over ground terrain',
    boxes: [
      { id: 'uc1', label: 'Uncertain Cloud-Masked Sector', confidence: 41.2, x: 25, y: 15, width: 55, height: 60, category: 'anomaly' }
    ],
    polygons: [
      { id: 'ucp1', label: 'Cumulus Cloud Mask Boundary', confidence: 41.2, points: '25,20 60,15 80,35 75,70 40,75 25,50', category: 'anomaly' }
    ],
    categoryBreakdown: [
      { label: 'Cloud Obscuration', count: 1, color: '#f59e0b' }
    ],
    auditTrail: [
      { id: 'c1', name: 'Fmask 4.0 Cloud Masking', status: 'fail', detail: 'Target AOI cloud fraction is 52.4%, exceeding maximum permissible 15% threshold.', metric: '52.4% (> 15% max)' },
      { id: 'c2', name: 'Shadow Spectral Ambiguity', status: 'warning', detail: 'Cloud shadows produce dark pixels mimicking water absorption in NIR spectrum.', metric: 'Ambiguity Alert' },
      { id: 'c3', name: 'Epistemic Certainty Threshold', status: 'fail', detail: 'Confidence score (41.2%) falls below minimum threshold for factual assertion (85.0%).', metric: '41.2% (Fail)' },
      { id: 'c4', name: 'Mitigation Recommendation', status: 'warning', detail: 'Task SAR (Synthetic Aperture Radar) sensor or wait for subsequent clear orbital pass.', metric: 'Switch to SAR' }
    ]
  },

  refusedBiometrics: {
    headline: 'Request Refused: Resolution Constraint & Policy Guardrail',
    summary: 'Drishti refused this request. Resolving human facial biometrics, civilian clothing, or motor vehicle license plates is impossible at satellite orbital altitudes and strictly prohibited under ethical Earth observation safety policies.',
    metricValue: 'REFUSED',
    metricUnit: 'policy violation',
    verdict: 'REFUSED',
    verdictReason: 'Physical optical diffraction limit: Ground Sample Distance (GSD) of satellite sensors is 30cm to 10m/pixel. A human face spans < 20cm (sub-pixel). Drishti enforces strict privacy safeguards against unauthorized surveillance queries.',
    confidenceScore: 0,
    imageUrl: '/assets/urban-satellite.jpg',
    imageAlt: 'Urban satellite image with refusal shield overlay',
    boxes: [],
    polygons: [],
    categoryBreakdown: [],
    auditTrail: [
      { id: 'c1', name: 'Physical Nyquist / Rayleigh Diffraction Limit', status: 'fail', detail: 'Target feature dimension (~0.15m) is smaller than sensor diffraction point spread function (~0.30m GSD).', metric: 'Physical Limit' },
      { id: 'c2', name: 'Biometric Surveillance Guardrail', status: 'fail', detail: 'Query contains facial recognition / vehicle tag keywords mapped to restricted tier 1 surveillance.', metric: 'PII Restricted' },
      { id: 'c3', name: 'Drishti Integrity Charter §2.1', status: 'fail', detail: 'Prohibits synthetic generation or hallucination of personal identifiable information on orbital imagery.', metric: 'Blocked' },
      { id: 'c4', name: 'Verifiable Evidence Standard', status: 'pass', detail: 'Drishti enforces "Evidence, not guesses" — refusing to hallucinate when visual proof cannot physically exist.', metric: 'Enforced' }
    ]
  }
};

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-welcome-0',
    sender: 'drishti' as const,
    timestamp: '10:00 AM',
    text: "Welcome to Drishti. I am your satellite imagery analysis assistant. My guiding principle is: **Evidence, not guesses.** Upload an optical or multi-spectral scene and ask me in plain English to count structures, map hydrology, or detect change between dates.",
    answer: undefined
  }
];

export const SUGGESTED_CHIPS = [
  {
    id: 'chip-buildings',
    label: 'How many buildings are here?',
    icon: 'Building2',
    category: 'Object Counting',
    imageKey: 'urban',
    answerKey: 'buildings'
  },
  {
    id: 'chip-water',
    label: 'Where is the water?',
    icon: 'Droplets',
    category: 'Hydrology Mapping',
    imageKey: 'water',
    answerKey: 'water'
  },
  {
    id: 'chip-change',
    label: 'What changed between these images?',
    icon: 'Layers',
    category: 'Change Detection',
    imageKey: 'forestAfter',
    answerKey: 'changeDetection',
    switchToComparison: true
  },
  {
    id: 'chip-uncertain',
    label: 'Is there water under this cloud cover?',
    icon: 'CloudOff',
    category: 'Uncertainty Test',
    imageKey: 'cloudy',
    answerKey: 'uncertainCloud'
  },
  {
    id: 'chip-refused',
    label: 'Identify faces or license plates in the street',
    icon: 'ShieldAlert',
    category: 'Safety & Refusal',
    imageKey: 'urban',
    answerKey: 'refusedBiometrics'
  }
];
