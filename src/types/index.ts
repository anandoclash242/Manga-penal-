export type SegmentationDetail = 'basic' | 'detailed' | 'ultra';
export type ProcessingMode = 'single' | 'multiple' | 'whole' | 'custom';
export type PartCategory =
  | 'hair'
  | 'face'
  | 'body'
  | 'clothing'
  | 'accessories'
  | 'background'
  | 'prop'
  | 'custom';

export interface BoundingBox {
  ymin: number; // 0 to 1000 normalized
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface PartSegmentationPlan {
  id: string;
  name: string;
  category: PartCategory;
  parentGroup?: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000
  polygon?: [number, number][]; // list of [x, y] in 0-1000
  description?: string;
  occluded?: boolean;
}

export interface SegmentationRequest {
  image: string; // base64 or data URL
  userPrompt?: string;
  detailLevel: SegmentationDetail;
  categories: PartCategory[];
  processingMode: ProcessingMode;
  includeParts?: string[];
  excludeParts?: string[];
  preserveBackground?: boolean;
  enableReconstruction?: boolean;
}

export interface Layer {
  id: string;
  name: string;
  category: PartCategory;
  parentId?: string;
  order: number;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  isReconstructed?: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Base64 PNG data URL of the extracted layer with genuine transparency
  transparentPngUrl: string;
  // Mask data as base64 or 2D array representation
  maskDataUrl?: string;
  polygon?: [number, number][];
  description?: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  category: PartCategory;
  collapsed: boolean;
  layers: Layer[];
}

export interface SegmentationSettings {
  detailLevel: SegmentationDetail;
  categories: PartCategory[];
  processingMode: ProcessingMode;
  userPrompt: string;
  includeParts: string[];
  excludeParts: string[];
  transparentBackground: boolean;
  preserveBackground: boolean;
  enableReconstruction: boolean;
  edgeFeather: number; // 0 to 10px
  maskQuality: 'normal' | 'high' | 'ultra';
}

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  originalImage: string; // data URL
  width: number;
  height: number;
  layers: Layer[];
  settings: SegmentationSettings;
  activeLayerId: string | null;
}

export type CanvasTool = 'select' | 'pan' | 'brush' | 'eraser' | 'lasso';

export interface MaskBrushConfig {
  size: number; // 1 to 100 px
  hardness: number; // 0 to 1
  opacity: number; // 0 to 1
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  categories: PartCategory[];
  detailLevel: SegmentationDetail;
  defaultPrompt: string;
  iconName: string;
}
