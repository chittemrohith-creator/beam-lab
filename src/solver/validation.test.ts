import { describe, it, expect } from 'vitest';
import { validateBeamConfig } from './validation';
import { PRESETS } from '../presets';

describe('Validation and Presets', () => {
  it('validates all presets successfully', () => {
    PRESETS.forEach((preset) => {
      const val = validateBeamConfig(preset.config);
      expect(val.isValid).toBe(true);
      expect(val.errors).toHaveLength(0);
    });
  });

  it('detects invalid configuration parameters', () => {
    const invalidConfig = {
      length: -5,
      elasticModulus: 0,
      momentOfInertia: -10,
      supportType: 'invalid_type' as any,
      loads: [
        { id: '1', type: 'point_force', x: 12, magnitude: 10 },
        { id: '2', type: 'distributed', x1: 5, x2: 2, w1: 0, w2: 0 },
      ],
    };

    const val = validateBeamConfig(invalidConfig);
    expect(val.isValid).toBe(false);
    expect(val.errors.length).toBeGreaterThan(0);
  });
});
