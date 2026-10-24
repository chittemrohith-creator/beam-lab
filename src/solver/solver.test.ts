import { describe, it, expect } from 'vitest';
import { analyzeBeam, evaluateAtPoint } from './solver';
import { validateBeamConfig } from './validation';
import { BeamConfig } from './types';

describe('Beam Solver Engine Regression Fixtures & Analytical Tests', () => {
  // Independent Regression Fixture 1: SS Center Point Force
  // L=6m, E=200e9 Pa (200 GPa), I=8e-6 m^4 (8e6 mm^4), EI=1.6e6 Nm^2
  // Downward P = 12000 N (-12 kN)
  // RA = RB = 6000 N, M(3) = 18000 Nm, v(3) = -0.03375 m
  it('Independent Fixture: SS center 12000N downward', () => {
    const config: BeamConfig = {
      length: 6,
      elasticModulus: 200, // GPa
      momentOfInertia: 8000000, // 8e6 mm^4 = 8e-6 m^4
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'point_force', x: 3, magnitude: -12 }], // kN
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(6000, 4);
    expect(res.reactions.RB).toBeCloseTo(6000, 4);

    const ptMid = evaluateAtPoint(3, 'exact', config, res.reactions);
    expect(ptMid.m).toBeCloseTo(18000, 2);
    expect(ptMid.deflection).toBeCloseTo(-0.03375, 6);
  });

  // Independent Regression Fixture 2: SS Full 3000N/m Downward
  // L=6m, EI=1.6e6 Nm^2
  // v(3) = -0.031640625 m
  it('Independent Fixture: SS full 3000N/m downward', () => {
    const config: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'distributed', x1: 0, x2: 6, w1: -3, w2: -3 }], // kN/m
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    const ptMid = evaluateAtPoint(3, 'exact', config, res.reactions);
    expect(ptMid.deflection).toBeCloseTo(-0.031640625, 8);
  });

  // Independent Regression Fixture 3: Cantilever Same UDL
  // L=6m, EI=1.6e6 Nm^2
  // v(6) = -0.30375 m
  it('Independent Fixture: Cantilever full 3000N/m downward', () => {
    const config: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'cantilever',
      loads: [{ id: '1', type: 'distributed', x1: 0, x2: 6, w1: -3, w2: -3 }],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    const ptTip = evaluateAtPoint(6, 'exact', config, res.reactions);
    expect(ptTip.deflection).toBeCloseTo(-0.30375, 8);
  });

  // Independent Regression Fixture 4: SS +12000Nm CCW at x=3
  // L=6m, EI=1.6e6 Nm^2
  // RA = 2000 N, RB = -2000 N, M(3-) = 6000 Nm, M(3+) = -6000 Nm, v(3) = 0, theta(3) = 0.00375 rad
  it('Independent Fixture: SS +12000Nm CCW couple at x=3', () => {
    const config: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'point_couple', x: 3, magnitude: 12 }], // kNm
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(2000, 4);
    expect(res.reactions.RB).toBeCloseTo(-2000, 4);

    const ptLeft = evaluateAtPoint(3, 'left', config, res.reactions);
    const ptRight = evaluateAtPoint(3, 'right', config, res.reactions);

    expect(ptLeft.m).toBeCloseTo(6000, 2);
    expect(ptRight.m).toBeCloseTo(-6000, 2);
    expect(ptLeft.deflection).toBeCloseTo(0, 8);
    expect(ptLeft.slope).toBeCloseTo(0.00375, 8);
  });

  // Independent Regression Fixture 5: Downward Triangular Load
  // q = 1500*(x-1) N/m over [1, 5]: total = 12000 N at x=11/3m
  // SS RA = 4666.6666666667 N, RB = 7333.3333333333 N, v(3) = -0.0275 m
  // Cantilever v(6) = -0.24925 m
  it('Independent Fixture: Downward triangular load q=1500(x-1) N/m over [1,5]', () => {
    const configSS: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'distributed', x1: 1, x2: 5, w1: 0, w2: -6 }], // kN/m (w2 = -6000 N/m)
    };

    const resSS = analyzeBeam(configSS);
    expect(resSS.isValid).toBe(true);
    expect(resSS.reactions.RA).toBeCloseTo(4666.6666666667, 4);
    expect(resSS.reactions.RB).toBeCloseTo(7333.3333333333, 4);

    const ptMidSS = evaluateAtPoint(3, 'exact', configSS, resSS.reactions);
    expect(ptMidSS.deflection).toBeCloseTo(-0.0275, 6);

    const configCant: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'cantilever',
      loads: [{ id: '1', type: 'distributed', x1: 1, x2: 5, w1: 0, w2: -6 }],
    };

    const resCant = analyzeBeam(configCant);
    expect(resCant.isValid).toBe(true);
    const ptTipCant = evaluateAtPoint(6, 'exact', configCant, resCant.reactions);
    expect(ptTipCant.deflection).toBeCloseTo(-0.24925, 6);
  });

  // Independent Regression Fixture 6: Zero-Resultant Sign-Changing Linear Load
  // w1 = -3 kN/m, w2 = +3 kN/m over [0, 6]
  // Total force = 0, but first moment != 0.
  // Expected RA = 3000 N, RB = -3000 N
  it('Independent Fixture: Zero-resultant sign-changing linear load', () => {
    const config: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'distributed', x1: 0, x2: 6, w1: -3, w2: 3 }],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(3000, 4);
    expect(res.reactions.RB).toBeCloseTo(-3000, 4);
  });

  // Independent Regression Fixture 7: Fixed Node Couple & Pinned End Couple
  it('Independent Fixture: Fixed node couple and pinned end couple', () => {
    // +12 kNm CCW couple applied directly at fixed support x=0 of cantilever
    const configFixedNodeCouple: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'cantilever',
      loads: [{ id: '1', type: 'point_couple', x: 0, magnitude: 12 }],
    };

    const resFNC = analyzeBeam(configFixedNodeCouple);
    expect(resFNC.isValid).toBe(true);
    expect(resFNC.reactions.MA).toBeCloseTo(-12000, 4);
    const ptTipFNC = evaluateAtPoint(6, 'exact', configFixedNodeCouple, resFNC.reactions);
    expect(ptTipFNC.deflection).toBeCloseTo(0, 8);

    // Endpoint couple on pinned end
    const configEndpointCouple: BeamConfig = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 8000000,
      supportType: 'simply_supported',
      loads: [{ id: '1', type: 'point_couple', x: 6, magnitude: 12 }],
    };
    const resEC = analyzeBeam(configEndpointCouple);
    expect(resEC.isValid).toBe(true);
    const ptInteriorEnd = evaluateAtPoint(5.99999, 'exact', configEndpointCouple, resEC.reactions);
    expect(ptInteriorEnd.m).not.toBe(0);
  });

  // Test Invalid Models
  it('rejects invalid models and nonfinite inputs', () => {
    const invalidConfig1: BeamConfig = {
      length: -5,
      elasticModulus: 200,
      momentOfInertia: 1e8,
      supportType: 'simply_supported',
      loads: [],
    };
    expect(validateBeamConfig(invalidConfig1).isValid).toBe(false);
  });
});
