import { Project, Layer } from '../types';

/**
 * Creates high-fidelity SVG drawings converted to data URLs for sample testing.
 */
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

// Sample 1: Classic Shonen Action Manga (B&W Screentone Style)
const SAMPLE_1_WIDTH = 600;
const SAMPLE_1_HEIGHT = 750;

const shonenBgSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="mangaDots" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#4b5563" opacity="0.3" />
    </pattern>
    <radialGradient id="speedLines" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f3f4f6"/>
      <stop offset="100%" stop-color="#e5e7eb"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#speedLines)"/>
  <rect width="100%" height="100%" fill="url(#mangaDots)"/>
  <!-- Action lines radiating outward -->
  <line x1="300" y1="280" x2="20" y2="40" stroke="#111827" stroke-width="2.5" stroke-dasharray="8,6" opacity="0.6"/>
  <line x1="300" y1="280" x2="580" y2="40" stroke="#111827" stroke-width="2.5" stroke-dasharray="8,6" opacity="0.6"/>
  <line x1="300" y1="280" x2="40" y2="700" stroke="#111827" stroke-width="2" stroke-dasharray="10,8" opacity="0.4"/>
  <line x1="300" y1="280" x2="560" y2="700" stroke="#111827" stroke-width="2" stroke-dasharray="10,8" opacity="0.4"/>
</svg>
`;

const shonenBodySvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Neck and Torso Base -->
  <polygon points="265,360 335,360 345,430 255,430" fill="#fef3c7" stroke="#111827" stroke-width="3"/>
  <polygon points="280,360 320,360 310,400 290,400" fill="#fde68a" opacity="0.7"/>
  <!-- Collarbones & Neck Muscle Lines -->
  <path d="M 275,370 Q 300,410 325,370" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`;

const shonenFaceSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Face Contour & Jawline -->
  <polygon points="215,220 230,300 300,380 370,300 385,220 300,180" fill="#fef3c7" stroke="#111827" stroke-width="3.5" stroke-linejoin="round"/>
  <!-- Soft Manga Cheek Screentone -->
  <circle cx="250" cy="310" r="16" fill="#fca5a5" opacity="0.4"/>
  <circle cx="350" cy="310" r="16" fill="#fca5a5" opacity="0.4"/>
  <!-- Nose -->
  <path d="M 298,285 L 306,305 L 296,306" fill="#111827" stroke="#111827" stroke-width="2"/>
  <!-- Fierce Manga Mouth -->
  <path d="M 278,335 Q 300,342 322,332" fill="none" stroke="#111827" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 292,348 Q 300,350 308,348" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

const shonenEyesSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Left Eye & Eyebrow -->
  <path d="M 240,240 Q 265,225 285,248" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
  <path d="M 245,250 L 255,270 L 280,265" fill="#ffffff" stroke="#111827" stroke-width="3"/>
  <ellipse cx="265" cy="258" rx="8" ry="10" fill="#111827"/>
  <circle cx="262" cy="254" r="3" fill="#ffffff"/>

  <!-- Right Eye & Eyebrow -->
  <path d="M 315,248 Q 335,225 360,240" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
  <path d="M 320,265 L 345,270 L 355,250" fill="#ffffff" stroke="#111827" stroke-width="3"/>
  <ellipse cx="335" cy="258" rx="8" ry="10" fill="#111827"/>
  <circle cx="338" cy="254" r="3" fill="#ffffff"/>

  <!-- Intense Focus Lines -->
  <line x1="240" y1="230" x2="280" y2="238" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <line x1="320" y1="238" x2="360" y2="230" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
</svg>
`;

const shonenHairSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Spiky Dynamic Shonen Manga Hair (Bangs & Front) -->
  <path d="
    M 170,220
    C 140,160 170,100 220,70
    C 230,120 260,110 270,50
    C 290,100 320,80 340,40
    C 360,90 390,90 410,65
    C 415,120 440,130 460,150
    C 430,180 435,230 410,260
    C 390,210 380,220 375,250
    C 365,220 345,225 340,265
    C 330,220 310,210 300,270
    C 290,210 270,220 260,265
    C 255,225 235,220 225,250
    C 220,220 200,210 185,255
    Z"
    fill="#1e293b" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"
  />
  <!-- Screentone Highlights on Hair Locks -->
  <path d="M 230,85 Q 260,130 270,75" stroke="#f8fafc" stroke-width="4" fill="none" opacity="0.8"/>
  <path d="M 300,65 Q 330,115 340,60" stroke="#f8fafc" stroke-width="4" fill="none" opacity="0.8"/>
  <path d="M 370,80 Q 395,120 405,85" stroke="#f8fafc" stroke-width="3.5" fill="none" opacity="0.8"/>
</svg>
`;

const shonenClothingSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- High Collar Action Jacket & Gi -->
  <path d="
    M 210,430
    L 245,360
    L 280,410
    L 320,410
    L 355,360
    L 390,430
    L 480,560
    L 420,750
    L 180,750
    L 120,560
    Z"
    fill="#0f172a" stroke="#000000" stroke-width="4" stroke-linejoin="round"
  />
  <!-- Inner Red Accent Undershirt -->
  <polygon points="275,410 325,410 300,470" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
  <!-- Clothing Creases & Folds -->
  <path d="M 220,480 Q 280,520 300,560 Q 320,520 380,480" fill="none" stroke="#334155" stroke-width="3.5"/>
  <path d="M 190,560 L 250,610" stroke="#334155" stroke-width="3"/>
  <path d="M 410,560 L 350,610" stroke="#334155" stroke-width="3"/>
  <!-- Shoulder Seams -->
  <line x1="210" y1="430" x2="160" y2="520" stroke="#475569" stroke-width="2.5"/>
  <line x1="390" y1="430" x2="440" y2="520" stroke="#475569" stroke-width="2.5"/>
</svg>
`;

const shonenSwordSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Katana Hilt & Scabbard Strap across back -->
  <rect x="420" y="320" width="22" height="180" rx="4" transform="rotate(-35 431 410)" fill="#1e1e24" stroke="#e2e8f0" stroke-width="2.5"/>
  <polygon points="410,310 445,290 455,305 420,325" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
  <!-- Diamond Tsuka Ito Pattern -->
  <polygon points="426,350 435,360 426,370 417,360" fill="#ef4444"/>
  <polygon points="438,380 447,390 438,400 429,390" fill="#ef4444"/>
</svg>
`;

// Build composite original image
const shonenFullCompositeSvg = `
<svg width="${SAMPLE_1_WIDTH}" height="${SAMPLE_1_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${shonenBgSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenSwordSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenBodySvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenClothingSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenFaceSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenEyesSvg.replace(/<\/?svg[^>]*>/g, '')}
  ${shonenHairSvg.replace(/<\/?svg[^>]*>/g, '')}
</svg>
`;

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'sample-shonen-hero',
    title: 'Kento — Shonen Action Manga',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now(),
    width: SAMPLE_1_WIDTH,
    height: SAMPLE_1_HEIGHT,
    originalImage: createSvgDataUrl(shonenFullCompositeSvg),
    settings: {
      detailLevel: 'detailed',
      categories: ['background', 'clothing', 'body', 'face', 'hair', 'prop'],
      processingMode: 'single',
      userPrompt:
        'Separate character from background, isolate katana weapon, high-collar jacket, face, eyes, and spiky manga hair into transparent layers.',
      includeParts: ['Hair', 'Eyes', 'Face', 'Jacket', 'Katana', 'Background'],
      excludeParts: [],
      transparentBackground: true,
      preserveBackground: true,
      enableReconstruction: false,
      edgeFeather: 1,
      maskQuality: 'high',
    },
    activeLayerId: 'layer-hair-1',
    layers: [
      {
        id: 'layer-bg-1',
        name: 'Manga Action Background',
        category: 'background',
        order: 0,
        visible: true,
        locked: true,
        opacity: 1,
        bounds: { x: 0, y: 0, width: SAMPLE_1_WIDTH, height: SAMPLE_1_HEIGHT },
        transparentPngUrl: createSvgDataUrl(shonenBgSvg),
        description: 'Screentone speed lines and halftone dots',
      },
      {
        id: 'layer-prop-1',
        name: 'Katana Hilt & Scabbard',
        category: 'prop',
        order: 1,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 380, y: 280, width: 150, height: 250 },
        transparentPngUrl: createSvgDataUrl(shonenSwordSvg),
        description: 'Back-slung sword with gold guard and red cord wrap',
      },
      {
        id: 'layer-body-1',
        name: 'Neck & Torso Base',
        category: 'body',
        order: 2,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 250, y: 350, width: 100, height: 90 },
        transparentPngUrl: createSvgDataUrl(shonenBodySvg),
        description: 'Neck muscles and upper chest collarbones',
      },
      {
        id: 'layer-clothing-1',
        name: 'High Collar Combat Jacket',
        category: 'clothing',
        order: 3,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 120, y: 360, width: 360, height: 390 },
        transparentPngUrl: createSvgDataUrl(shonenClothingSvg),
        description: 'Dark combat uniform with red inner lining',
      },
      {
        id: 'layer-face-1',
        name: 'Face & Jawline',
        category: 'face',
        order: 4,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 215, y: 180, width: 170, height: 200 },
        transparentPngUrl: createSvgDataUrl(shonenFaceSvg),
        description: 'Manga jawline contour, nose, and mouth',
      },
      {
        id: 'layer-eyes-1',
        name: 'Intense Manga Eyes',
        category: 'face',
        order: 5,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 240, y: 220, width: 120, height: 60 },
        transparentPngUrl: createSvgDataUrl(shonenEyesSvg),
        description: 'Left & Right eyes with focused iris highlights',
      },
      {
        id: 'layer-hair-1',
        name: 'Spiky Hair Bangs & Crown',
        category: 'hair',
        order: 6,
        visible: true,
        locked: false,
        opacity: 1,
        bounds: { x: 140, y: 40, width: 320, height: 240 },
        transparentPngUrl: createSvgDataUrl(shonenHairSvg),
        description: 'Spiky dark manga hair with screentone highlights',
      },
    ],
  },
];
