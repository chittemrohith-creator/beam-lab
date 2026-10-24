import { describe, it, expect } from 'vitest';
import { validateBeamConfig, parseAndValidateEnvelope } from './validation';
import { PRESETS } from '../presets';

describe('Validation and Envelope Parsing', () => {
  it('parseAndValidateEnvelope rejects unsupported outer schemaVersion (e.g. 999)', () => {
    const validModel = PRESETS[0].config;
    const invalidEnvelope = {
      schemaVersion: 999,
      model: validModel,
    };

    const res = parseAndValidateEnvelope(invalidEnvelope);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('Unsupported schema version: 999');
  });

  it('parseAndValidateEnvelope rejects missing or null inner model when schemaVersion is present', () => {
    const nullModelEnvelope = {
      schemaVersion: 1,
      model: null,
    };

    const res = parseAndValidateEnvelope(nullModelEnvelope);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('Invalid schema envelope');
  });

  it('parseAndValidateEnvelope accepts bare legacy model without envelope', () => {
    const validModel = PRESETS[0].config;
    const res = parseAndValidateEnvelope(validModel);
    expect(res.isValid).toBe(true);
    expect(res.config).toEqual(validModel);
  });

  it('parseAndValidateEnvelope accepts valid schemaVersion: 1 envelope', () => {
    const validModel = PRESETS[0].config;
    const validEnvelope = {
      schemaVersion: 1,
      app: 'Beam Lab',
      model: validModel,
    };

    const res = parseAndValidateEnvelope(validEnvelope);
    expect(res.isValid).toBe(true);
    expect(res.config).toEqual(validModel);
  });
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
