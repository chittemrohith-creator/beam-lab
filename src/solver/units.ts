import { BeamConfig, NormalizedLoad } from './types';

// Convert user input units to SI units (N, m, Pa, m^4)
export const GPa_TO_Pa = 1e9;
export const mm4_TO_m4 = 1e-12;
export const kN_TO_N = 1e3;
export const kNm_TO_Nm = 1e3;
export const kNm_per_m_TO_N_per_m = 1e3;

export function normalizeBeamConfig(config: BeamConfig): {
  lengthSI: number; // m
  eSI: number;      // Pa
  iSI: number;      // m^4
  eiSI: number;     // Pa * m^4 = N*m^2
  normalizedLoads: NormalizedLoad[];
} {
  const lengthSI = config.length;
  const eSI = config.elasticModulus * GPa_TO_Pa;
  const iSI = config.momentOfInertia * mm4_TO_m4;
  const eiSI = eSI * iSI;

  const normalizedLoads: NormalizedLoad[] = config.loads.map((load) => {
    if (load.type === 'point_force') {
      return {
        id: load.id,
        type: 'point_force',
        x: load.x,
        x1: load.x,
        x2: load.x,
        magnitude: load.magnitude * kN_TO_N,
        w1: 0,
        w2: 0,
      };
    } else if (load.type === 'point_couple') {
      return {
        id: load.id,
        type: 'point_couple',
        x: load.x,
        x1: load.x,
        x2: load.x,
        magnitude: load.magnitude * kNm_TO_Nm,
        w1: 0,
        w2: 0,
      };
    } else {
      return {
        id: load.id,
        type: 'distributed',
        x: load.x1,
        x1: load.x1,
        x2: load.x2,
        magnitude: 0,
        w1: load.w1 * kNm_per_m_TO_N_per_m,
        w2: load.w2 * kNm_per_m_TO_N_per_m,
      };
    }
  });

  return {
    lengthSI,
    eSI,
    iSI,
    eiSI,
    normalizedLoads,
  };
}
