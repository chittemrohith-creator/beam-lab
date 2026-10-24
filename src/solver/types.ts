export type SupportType = 'simply_supported' | 'cantilever';

export type LoadType = 'point_force' | 'point_couple' | 'distributed';

export interface BaseLoad {
  id: string;
  type: LoadType;
}

export interface PointForceLoad extends BaseLoad {
  type: 'point_force';
  x: number; // m
  magnitude: number; // kN (positive upwards)
}

export interface PointCoupleLoad extends BaseLoad {
  type: 'point_couple';
  x: number; // m
  magnitude: number; // kNm (positive counter-clockwise)
}

export interface DistributedLoad extends BaseLoad {
  type: 'distributed';
  x1: number; // m
  x2: number; // m
  w1: number; // kN/m (positive upwards)
  w2: number; // kN/m (positive upwards)
}

export type Load = PointForceLoad | PointCoupleLoad | DistributedLoad;

export interface BeamConfig {
  length: number; // m
  elasticModulus: number; // GPa
  momentOfInertia: number; // mm^4
  supportType: SupportType;
  loads: Load[];
}

export interface NormalizedLoad {
  id: string;
  type: LoadType;
  x: number; // m (for point loads)
  x1: number; // m (for distributed)
  x2: number; // m (for distributed)
  magnitude: number; // N or Nm
  w1: number; // N/m
  w2: number; // N/m
}

export interface ReactionResults {
  RA: number; // N (positive upwards)
  RB: number; // N (positive upwards, 0 for cantilever)
  MA: number; // Nm (positive CCW, 0 for simply supported)
}

export interface DiagramPoint {
  x: number; // m
  v: number; // N (shear force)
  m: number; // Nm (bending moment)
  slope: number; // rad
  deflection: number; // m (positive upwards)
  side?: 'left' | 'right' | 'exact';
}

export interface ExtremaDetail {
  x: number;
  value: number;
}

export interface Extrema {
  minShear: ExtremaDetail;
  maxShear: ExtremaDetail;
  minMoment: ExtremaDetail;
  maxMoment: ExtremaDetail;
  maxAbsDeflection: ExtremaDetail;
}

export interface IntervalPolynomial {
  xStart: number;
  xEnd: number;
  qStart: number; // N/m
  qEnd: number;   // N/m
  vStart: number; // N
  mStart: number; // Nm
  gStart: number; // Nm^2 (integral of M)
  hStart: number; // Nm^3 (double integral of M)
}

export interface StepExplanation {
  title: string;
  latex?: string;
  description: string;
}

export interface HandCalcExplanation {
  summary: string;
  steps: StepExplanation[];
}

export interface AnalysisResult {
  config: BeamConfig;
  reactions: ReactionResults;
  diagrams: DiagramPoint[];
  extrema: Extrema;
  samplePoints: number[];
  handCalc: HandCalcExplanation;
  isValid: boolean;
  errors: string[];
}
