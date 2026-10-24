import { describe, it, expect } from 'vitest';
import { analyzeBeam, evaluateAtPoint } from './solver';
import { validateBeamConfig } from './validation';
import { BeamConfig } from './types';

describe('Beam Solver Engine Comprehensive Analytical & Independent Regression Tests', () => {
  // Test 1: Simply Supported Central Point Force (Original analytical formula test)
  // R_A = P/2, R_B = P/2, M_max = P*L/4, delta_mid = P*L^3 / (48*E*I)
  it('SS central point force (10m span, -10kN)', () => {
    const P = -10; // -10 kN downwards = -10000 N
    const L = 10;  // 10 m
    const E = 200; // 200 GPa
    const I = 1e8; // 1e8 mm^4 = 1e-4 m^4
    // EI = 200e9 * 1e-4 = 2e7 N*m^2

    const config: BeamConfig = {
      length: L,
      elasticModulus: E,
      momentOfInertia: I,
      supportType: 'simply_supported',
      loads: [
        { id: '1', type: 'point_force', x: 5, magnitude: P },
      ],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(5000, 4); // 5 kN upwards
    expect(res.reactions.RB).toBeCloseTo(5000, 4); // 5 kN upwards
    expect(res.reactions.MA).toBe(0);

    expect(res.extrema.maxMoment.value).toBeCloseTo(25000, 2);
    expect(res.extrema.maxMoment.x).toBeCloseTo(5, 2);

    const expectedDef = -10000 * Math.pow(10, 3) / (48 * 2e7);
    expect(res.extrema.maxAbsDeflection.value).toBeCloseTo(expectedDef, 6);
    expect(res.extrema.maxAbsDeflection.x).toBeCloseTo(5, 2);
  });

  // Test 2: Simply Supported Full UDL (Original analytical formula test)
  // R = wL/2, M_max = wL^2/8, delta_mid = 5*w*L^4 / (384*E*I)
  it('SS full UDL (8m span, -5kN/m)', () => {
    const w = -5; // -5 kN/m downwards = -5000 N/m
    const L = 8;  // 8 m
    const E = 210; // 210 GPa
    const I = 5e7; // 5e7 mm^4 = 5e-5 m^4

    const config: BeamConfig = {
      length: L,
      elasticModulus: E,
      momentOfInertia: I,
      supportType: 'simply_supported',
      loads: [
        { id: '1', type: 'distributed', x1: 0, x2: L, w1: w, w2: w },
      ],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(20000, 4);
    expect(res.reactions.RB).toBeCloseTo(20000, 4);

    expect(res.extrema.maxMoment.value).toBeCloseTo(40000, 2);
    expect(res.extrema.maxMoment.x).toBeCloseTo(4, 2);

    const expectedDef = -5 * 5000 * Math.pow(8, 4) / (384 * 1.05e7);
    expect(res.extrema.maxAbsDeflection.value).toBeCloseTo(expectedDef, 6);
  });

  // Test 3: Cantilever Tip Force (Original analytical formula test)
  it('Cantilever tip force (6m span, -12kN at tip)', () => {
    const P = -12; // -12 kN = -12000 N at x=6
    const L = 6;   // 6 m
    const E = 200; // 200 GPa
    const I = 8e7; // 8e7 mm^4 = 8e-5 m^4

    const config: BeamConfig = {
      length: L,
      elasticModulus: E,
      momentOfInertia: I,
      supportType: 'cantilever',
      loads: [
        { id: '1', type: 'point_force', x: L, magnitude: P },
      ],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(12000, 4);
    expect(res.reactions.RB).toBe(0);
    expect(res.reactions.MA).toBeCloseTo(72000, 4);

    const expectedDef = -12000 * Math.pow(L, 3) / (3 * 1.6e7);
    expect(res.extrema.maxAbsDeflection.value).toBeCloseTo(expectedDef, 6);
    expect(res.extrema.maxAbsDeflection.x).toBeCloseTo(L, 2);
  });

  // Test 4: Cantilever Full UDL (Original analytical formula test)
  it('Cantilever full UDL (5m span, -4kN/m)', () => {
    const w = -4; // -4 kN/m = -4000 N/m
    const L = 5;  // 5 m
    const E = 200;
    const I = 1e8;

    const config: BeamConfig = {
      length: L,
      elasticModulus: E,
      momentOfInertia: I,
      supportType: 'cantilever',
      loads: [
        { id: '1', type: 'distributed', x1: 0, x2: L, w1: w, w2: w },
      ],
    };

    const res = analyzeBeam(config);
    expect(res.isValid).toBe(true);
    expect(res.reactions.RA).toBeCloseTo(20000, 4);
    expect(res.reactions.MA).toBeCloseTo(50000, 4);

    const expectedDef = -4000 * Math.pow(L, 4) / (8 * 2e7);
    expect(res.extrema.maxAbsDeflection.value).toBeCloseTo(expectedDef, 6);
    expect(res.extrema.maxAbsDeflection.x).toBeCloseTo(L, 2);
  });

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

  // Validation Edge Cases: null, non-objects, duplicate IDs, non-string IDs, schema versions
  it('validateBeamConfig safely rejects invalid and malformed model inputs', () => {
    expect(validateBeamConfig(null).isValid).toBe(false);
    expect(validateBeamConfig(undefined).isValid).toBe(false);
    expect(validateBeamConfig('string').isValid).toBe(false);
    expect(validateBeamConfig({ length: 6, loads: null }).isValid).toBe(false);

    // Schema version check
    const invalidSchema = {
      schemaVersion: 99,
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 1e8,
      supportType: 'simply_supported',
      loads: [],
    };
    expect(validateBeamConfig(invalidSchema).isValid).toBe(false);

    // Non-string ID and Duplicate IDs
    const duplicateIds = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 1e8,
      supportType: 'simply_supported',
      loads: [
        { id: '1', type: 'point_force', x: 2, magnitude: -10 },
        { id: '1', type: 'point_couple', x: 4, magnitude: 10 },
      ],
    };
    expect(validateBeamConfig(duplicateIds).isValid).toBe(false);

    const nonStringId = {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 1e8,
      supportType: 'simply_supported',
      loads: [{ id: 123 as unknown as string, type: 'point_force', x: 2, magnitude: -10 }],
    };
    expect(validateBeamConfig(nonStringId).isValid).toBe(false);
  });
});
