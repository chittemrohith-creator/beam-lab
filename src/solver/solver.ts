import {
  BeamConfig,
  AnalysisResult,
  ReactionResults,
  DiagramPoint,
  Extrema,
  ExtremaDetail,
  HandCalcExplanation,
  StepExplanation,
} from './types';
import { normalizeBeamConfig } from './units';
import { validateBeamConfig } from './validation';

/**
 * Macaulay-style step function: <x - a>^n where <x - a>^n = 0 if x < a, else (x - a)^n
 */
function macaulay(x: number, a: number, n: number): number {
  if (x < a) return 0;
  if (n === 0) return 1;
  return Math.pow(x - a, n);
}

/**
 * Calculates static reactions (RA, RB, MA) using global statics equilibrium.
 * Sign convention:
 * - RA, RB: positive upwards (N)
 * - MA: positive counter-clockwise (Nm)
 * - Applied point force P: positive upwards (N)
 * - Applied couple M_c: positive counter-clockwise (Nm)
 * - Distributed load w(x): positive upwards (N/m)
 */
export function calculateReactions(config: BeamConfig): ReactionResults {
  const { lengthSI, normalizedLoads } = normalizeBeamConfig(config);
  const L = lengthSI;

  let sumFy_applied = 0;
  let sumMA_applied = 0;

  for (const load of normalizedLoads) {
    if (load.type === 'point_force') {
      sumFy_applied += load.magnitude;
      sumMA_applied += load.magnitude * load.x;
    } else if (load.type === 'point_couple') {
      sumMA_applied += load.magnitude;
    } else if (load.type === 'distributed') {
      const dx = load.x2 - load.x1;
      if (dx > 0) {
        const force = 0.5 * (load.w1 + load.w2) * dx;
        // Direct first moment integration: \int_{x1}^{x2} w(t)*t dt without centroid division
        const momentAboutX1 = (Math.pow(dx, 2) / 6) * (load.w1 + 2 * load.w2);
        sumFy_applied += force;
        sumMA_applied += force * load.x1 + momentAboutX1;
      }
    }
  }

  if (config.supportType === 'simply_supported') {
    const MA = 0;
    const RB = -sumMA_applied / L;
    const RA = -sumFy_applied - RB;
    return { RA, RB, MA };
  } else {
    // Cantilever: Fixed at A (x=0), Free at B (x=L)
    const RB = 0;
    const RA = -sumFy_applied;
    const MA = -sumMA_applied;
    return { RA, RB, MA };
  }
}

/**
 * Calculates exact internal shear V(x), bending moment M(x), EI*slope \theta(x), and EI*deflection v(x)
 * at point x and side ('left' | 'right' | 'exact').
 */
export function evaluateAtPoint(
  x: number,
  side: 'left' | 'right' | 'exact',
  config: BeamConfig,
  reactions: ReactionResults
): { x: number; v: number; m: number; slope: number; deflection: number } {
  const { lengthSI, eiSI, normalizedLoads } = normalizeBeamConfig(config);
  const eps = 1e-12;

  let x_eff = x;
  if (side === 'left') {
    x_eff = Math.max(0, x - eps);
  } else if (side === 'right') {
    x_eff = Math.min(lengthSI, x + eps);
  }

  const RA = reactions.RA;
  const MA = reactions.MA;

  let V = RA;
  let M = -MA + RA * x_eff;

  let C1 = 0; // EI * theta(0)
  const C2 = 0; // EI * v(0) = 0

  if (config.supportType === 'simply_supported') {
    const L = lengthSI;
    let EI_v_L_without_C1 = -0.5 * MA * Math.pow(L, 2) + (1 / 6) * RA * Math.pow(L, 3);

    for (const load of normalizedLoads) {
      if (load.type === 'point_force') {
        EI_v_L_without_C1 += (1 / 6) * load.magnitude * macaulay(L, load.x, 3);
      } else if (load.type === 'point_couple') {
        EI_v_L_without_C1 -= 0.5 * load.magnitude * macaulay(L, load.x, 2);
      } else if (load.type === 'distributed') {
        const x1 = load.x1;
        const x2 = load.x2;
        const w1 = load.w1;
        const w2 = load.w2;

        if (L > x1) {
          const term_w1 = (1 / 24) * w1 * macaulay(L, x1, 4);
          let term_w1_end = 0;
          if (L > x2) {
            term_w1_end = (1 / 24) * w1 * macaulay(L, x2, 4);
          }
          EI_v_L_without_C1 += term_w1 - term_w1_end;

          const slope_w = (w2 - w1) / (x2 - x1);
          const term_slope = (1 / 120) * slope_w * macaulay(L, x1, 5);
          let term_slope_end = 0;
          if (L > x2) {
            term_slope_end = (1 / 120) * slope_w * macaulay(L, x2, 5) + (1 / 24) * (w2 - w1) * macaulay(L, x2, 4);
          }
          EI_v_L_without_C1 += term_slope - term_slope_end;
        }
      }
    }

    C1 = -EI_v_L_without_C1 / L;
  }

  let EI_theta = C1 - MA * x_eff + 0.5 * RA * Math.pow(x_eff, 2);
  let EI_v = C2 + C1 * x_eff - 0.5 * MA * Math.pow(x_eff, 2) + (1 / 6) * RA * Math.pow(x_eff, 3);

  for (const load of normalizedLoads) {
    if (load.type === 'point_force') {
      if (x_eff >= load.x) {
        V += load.magnitude;
        M += load.magnitude * (x_eff - load.x);
        EI_theta += 0.5 * load.magnitude * Math.pow(x_eff - load.x, 2);
        EI_v += (1 / 6) * load.magnitude * Math.pow(x_eff - load.x, 3);
      }
    } else if (load.type === 'point_couple') {
      if (x_eff >= load.x) {
        M -= load.magnitude;
        EI_theta -= load.magnitude * (x_eff - load.x);
        EI_v -= 0.5 * load.magnitude * Math.pow(x_eff - load.x, 2);
      }
    } else if (load.type === 'distributed') {
      const x1 = load.x1;
      const x2 = load.x2;
      const w1 = load.w1;
      const w2 = load.w2;

      if (x_eff > x1) {
        const dx_active = Math.min(x_eff, x2) - x1;
        const slope_w = (w2 - w1) / (x2 - x1);

        if (x_eff <= x2) {
          const wx = w1 + slope_w * (x_eff - x1);
          const force = 0.5 * (w1 + wx) * dx_active;
          V += force;

          M += (1 / 2) * w1 * Math.pow(x_eff - x1, 2) + (1 / 6) * slope_w * Math.pow(x_eff - x1, 3);
          EI_theta += (1 / 6) * w1 * Math.pow(x_eff - x1, 3) + (1 / 24) * slope_w * Math.pow(x_eff - x1, 4);
          EI_v += (1 / 24) * w1 * Math.pow(x_eff - x1, 4) + (1 / 120) * slope_w * Math.pow(x_eff - x1, 5);
        } else {
          const force = 0.5 * (w1 + w2) * (x2 - x1);
          V += force;

          M +=
            (1 / 2) * w1 * Math.pow(x_eff - x1, 2) -
            (1 / 2) * w1 * Math.pow(x_eff - x2, 2) +
            (1 / 6) * slope_w * Math.pow(x_eff - x1, 3) -
            (1 / 6) * slope_w * Math.pow(x_eff - x2, 3) -
            (1 / 2) * (w2 - w1) * Math.pow(x_eff - x2, 2);

          EI_theta +=
            (1 / 6) * w1 * Math.pow(x_eff - x1, 3) -
            (1 / 6) * w1 * Math.pow(x_eff - x2, 3) +
            (1 / 24) * slope_w * Math.pow(x_eff - x1, 4) -
            (1 / 24) * slope_w * Math.pow(x_eff - x2, 4) -
            (1 / 6) * (w2 - w1) * Math.pow(x_eff - x2, 3);

          EI_v +=
            (1 / 24) * w1 * Math.pow(x_eff - x1, 4) -
            (1 / 24) * w1 * Math.pow(x_eff - x2, 4) +
            (1 / 120) * slope_w * Math.pow(x_eff - x1, 5) -
            (1 / 120) * slope_w * Math.pow(x_eff - x2, 5) -
            (1 / 24) * (w2 - w1) * Math.pow(x_eff - x2, 4);
        }
      }
    }
  }

  const slope = EI_theta / eiSI;
  const deflection = EI_v / eiSI;

  return {
    x,
    v: V,
    m: M,
    slope,
    deflection,
  };
}

export function getSamplePoints(config: BeamConfig, numSamples = 200): number[] {
  const L = config.length;
  const criticalPointsSet = new Set<number>([0, L]);

  for (const load of config.loads) {
    if (load.type === 'point_force' || load.type === 'point_couple') {
      if (load.x >= 0 && load.x <= L) {
        criticalPointsSet.add(load.x);
      }
    } else if (load.type === 'distributed') {
      if (load.x1 >= 0 && load.x1 <= L) criticalPointsSet.add(load.x1);
      if (load.x2 >= 0 && load.x2 <= L) criticalPointsSet.add(load.x2);
    }
  }

  const sortedCritical = Array.from(criticalPointsSet).sort((a, b) => a - b);
  const resultPoints: number[] = [];

  for (let i = 0; i < sortedCritical.length - 1; i++) {
    const xStart = sortedCritical[i];
    const xEnd = sortedCritical[i + 1];
    const segmentLength = xEnd - xStart;
    const stepsInSegment = Math.max(5, Math.ceil((numSamples * segmentLength) / L));

    for (let j = 0; j <= stepsInSegment; j++) {
      const pt = xStart + (j / stepsInSegment) * segmentLength;
      resultPoints.push(pt);
    }
  }

  return Array.from(new Set(resultPoints)).sort((a, b) => a - b);
}

export function findExtrema(
  diagrams: DiagramPoint[],
  config: BeamConfig,
  reactions: ReactionResults
): Extrema {
  let minShear: ExtremaDetail = { x: 0, value: Infinity };
  let maxShear: ExtremaDetail = { x: 0, value: -Infinity };
  let minMoment: ExtremaDetail = { x: 0, value: Infinity };
  let maxMoment: ExtremaDetail = { x: 0, value: -Infinity };
  let maxAbsDeflection: ExtremaDetail = { x: 0, value: 0 };

  for (const pt of diagrams) {
    if (pt.v < minShear.value) minShear = { x: pt.x, value: pt.v };
    if (pt.v > maxShear.value) maxShear = { x: pt.x, value: pt.v };

    if (pt.m < minMoment.value) minMoment = { x: pt.x, value: pt.m };
    if (pt.m > maxMoment.value) maxMoment = { x: pt.x, value: pt.m };

    if (Math.abs(pt.deflection) > Math.abs(maxAbsDeflection.value)) {
      maxAbsDeflection = { x: pt.x, value: pt.deflection };
    }
  }

  // Split entire span into subsegments at ALL load breakpoints for aggregate polynomial root solving
  const L = config.length;
  const breakSet = new Set<number>([0, L]);
  for (const load of config.loads) {
    if (load.type === 'point_force' || load.type === 'point_couple') {
      if (load.x >= 0 && load.x <= L) breakSet.add(load.x);
    } else if (load.type === 'distributed') {
      if (load.x1 >= 0 && load.x1 <= L) breakSet.add(load.x1);
      if (load.x2 >= 0 && load.x2 <= L) breakSet.add(load.x2);
    }
  }
  const breakpoints = Array.from(breakSet).sort((a, b) => a - b);

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const xa = breakpoints[i];
    const xb = breakpoints[i + 1];
    const dx = xb - xa;
    if (dx <= 1e-12) continue;

    // Check aggregate zero shear root V(x)=0 inside [xa, xb]
    const va = evaluateAtPoint(xa, 'right', config, reactions).v;
    const vb = evaluateAtPoint(xb, 'left', config, reactions).v;

    if (va * vb <= 0 && va !== vb) {
      // Find root of V(xa + t) = 0 for t in [0, dx]
      let low = 0;
      let high = dx;
      for (let iter = 0; iter < 25; iter++) {
        const mid = (low + high) / 2;
        const vMid = evaluateAtPoint(xa + mid, 'exact', config, reactions).v;
        if (Math.abs(vMid) < 1e-9) {
          low = mid;
          high = mid;
          break;
        }
        if (va * vMid <= 0) high = mid;
        else low = mid;
      }
      const x_root = xa + (low + high) / 2;
      const pt = evaluateAtPoint(x_root, 'exact', config, reactions);
      if (pt.m < minMoment.value) minMoment = { x: x_root, value: pt.m };
      if (pt.m > maxMoment.value) maxMoment = { x: x_root, value: pt.m };
      if (Math.abs(pt.deflection) > Math.abs(maxAbsDeflection.value)) {
        maxAbsDeflection = { x: x_root, value: pt.deflection };
      }
    }

    // Check aggregate slope theta(x)=0 root inside [xa, xb]
    const thetaA = evaluateAtPoint(xa, 'right', config, reactions).slope;
    const thetaB = evaluateAtPoint(xb, 'left', config, reactions).slope;

    if (thetaA * thetaB <= 0 && thetaA !== thetaB) {
      let low = 0;
      let high = dx;
      for (let iter = 0; iter < 25; iter++) {
        const mid = (low + high) / 2;
        const slopeMid = evaluateAtPoint(xa + mid, 'exact', config, reactions).slope;
        if (Math.abs(slopeMid) < 1e-12) {
          low = mid;
          high = mid;
          break;
        }
        if (thetaA * slopeMid <= 0) high = mid;
        else low = mid;
      }
      const x_root = xa + (low + high) / 2;
      const rootPt = evaluateAtPoint(x_root, 'exact', config, reactions);
      if (Math.abs(rootPt.deflection) > Math.abs(maxAbsDeflection.value)) {
        maxAbsDeflection = { x: x_root, value: rootPt.deflection };
      }
    }
  }

  return {
    minShear,
    maxShear,
    minMoment,
    maxMoment,
    maxAbsDeflection,
  };
}

export function analyzeBeam(config: BeamConfig): AnalysisResult {
  const validation = validateBeamConfig(config);
  if (!validation.isValid) {
    return {
      config,
      reactions: { RA: 0, RB: 0, MA: 0 },
      diagrams: [],
      extrema: {
        minShear: { x: 0, value: 0 },
        maxShear: { x: 0, value: 0 },
        minMoment: { x: 0, value: 0 },
        maxMoment: { x: 0, value: 0 },
        maxAbsDeflection: { x: 0, value: 0 },
      },
      samplePoints: [],
      handCalc: { summary: '', steps: [] },
      isValid: false,
      errors: validation.errors,
    };
  }

  const reactions = calculateReactions(config);
  const samplePoints = getSamplePoints(config, 200);

  const diagrams: DiagramPoint[] = [];

  for (const x of samplePoints) {
    const isDiscontinuity = config.loads.some((load) => {
      if (load.type === 'point_force' || load.type === 'point_couple') return Math.abs(load.x - x) < 1e-9;
      if (load.type === 'distributed') return Math.abs(load.x1 - x) < 1e-9 || Math.abs(load.x2 - x) < 1e-9;
      return false;
    });

    if (isDiscontinuity && x > 0 && x < config.length) {
      const ptLeft = evaluateAtPoint(x, 'left', config, reactions);
      const ptRight = evaluateAtPoint(x, 'right', config, reactions);
      diagrams.push({ ...ptLeft, side: 'left' });
      diagrams.push({ ...ptRight, side: 'right' });
    } else {
      const pt = evaluateAtPoint(x, 'exact', config, reactions);
      diagrams.push({ ...pt, side: 'exact' });
    }
  }

  const extrema = findExtrema(diagrams, config, reactions);
  const handCalc = generateHandCalcExplanation(config, reactions, extrema);

  return {
    config,
    reactions,
    diagrams,
    extrema,
    samplePoints,
    handCalc,
    isValid: true,
    errors: [],
  };
}

export function generateHandCalcExplanation(
  config: BeamConfig,
  reactions: ReactionResults,
  extrema: Extrema
): HandCalcExplanation {
  const steps: StepExplanation[] = [];
  const supportName =
    config.supportType === 'simply_supported'
      ? 'Simply Supported (Pin at x=0, Roller at x=L)'
      : 'Cantilever (Fixed at x=0, Free at x=L)';

  steps.push({
    title: '1. Model Parameters & Units',
    description: `Beam Length L = ${config.length} m, Elastic Modulus E = ${config.elasticModulus} GPa, Moment of Inertia Iz = ${config.momentOfInertia} mm⁴. Support condition: ${supportName}. Total number of loads applied: ${config.loads.length}.`,
  });

  const ra_kN = (reactions.RA / 1000).toFixed(3);
  const rb_kN = (reactions.RB / 1000).toFixed(3);
  const ma_kNm = (reactions.MA / 1000).toFixed(3);

  if (config.supportType === 'simply_supported') {
    steps.push({
      title: '2. Global Static Equilibrium & Reactions',
      description: `Applying static equilibrium equations:\n• ∑ M_A = 0 ⟹ RB = ${rb_kN} kN\n• ∑ F_y = 0 ⟹ RA = ${ra_kN} kN\n• Fixity Moment MA = 0 kNm (Pin support).`,
    });
  } else {
    steps.push({
      title: '2. Global Static Equilibrium & Reactions',
      description: `Applying static equilibrium equations for cantilever fixed at x=0:\n• ∑ F_y = 0 ⟹ RA = ${ra_kN} kN\n• ∑ M_A = 0 ⟹ MA = ${ma_kNm} kNm\n• Reaction RB = 0 kN (Free end at x=L).`,
    });
  }

  steps.push({
    title: '3. Piecewise Governing Differential Equations',
    description: `Internal forces and deformations obey Euler-Bernoulli beam theory:\n• dV/dx = -w(x)\n• dM/dx = V(x)\n• EI · d²v/dx² = M(x)\nIntegrating step-by-step across all load interval boundaries maintains continuity of slope θ(x) and deflection v(x).`,
  });

  const maxV = (Math.max(Math.abs(extrema.minShear.value), Math.abs(extrema.maxShear.value)) / 1000).toFixed(3);
  const maxM = (Math.max(Math.abs(extrema.minMoment.value), Math.abs(extrema.maxMoment.value)) / 1000).toFixed(3);
  const maxDef = (Math.abs(extrema.maxAbsDeflection.value) * 1000).toFixed(3);

  steps.push({
    title: '4. Peak Internal Actions & Deflections',
    description: `Critical values and locations:\n• Peak Shear |V_max| = ${maxV} kN\n• Peak Moment |M_max| = ${maxM} kNm at x = ${extrema.maxMoment.x.toFixed(3)} m\n• Peak Deflection |δ_max| = ${maxDef} mm at x = ${extrema.maxAbsDeflection.x.toFixed(3)} m.`,
  });

  return {
    summary: `Analytical analysis completed successfully for a ${config.length}m beam.`,
    steps,
  };
}
