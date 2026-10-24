import { BeamConfig } from './types';

export function validateBeamConfig(config: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Beam model configuration must be a valid non-null object.'] };
  }

  const cfg = config as Partial<BeamConfig> & { schemaVersion?: unknown };

  if (cfg.schemaVersion !== undefined) {
    if (typeof cfg.schemaVersion !== 'number' || cfg.schemaVersion !== 1) {
      errors.push(`Unsupported model schema version: ${cfg.schemaVersion}. Expected version 1.`);
    }
  }

  if (typeof cfg.length !== 'number' || !isFinite(cfg.length) || cfg.length <= 0) {
    errors.push('Beam length must be a finite positive number (L > 0).');
  }

  if (typeof cfg.elasticModulus !== 'number' || !isFinite(cfg.elasticModulus) || cfg.elasticModulus <= 0) {
    errors.push('Elastic modulus (E) must be a finite positive number (E > 0).');
  }

  if (typeof cfg.momentOfInertia !== 'number' || !isFinite(cfg.momentOfInertia) || cfg.momentOfInertia <= 0) {
    errors.push('Moment of inertia (Iz) must be a finite positive number (I > 0).');
  }

  if (!cfg.supportType || !['simply_supported', 'cantilever'].includes(cfg.supportType)) {
    errors.push('Invalid support type. Must be "simply_supported" or "cantilever".');
  }

  if (!Array.isArray(cfg.loads)) {
    errors.push('Loads must be provided as an array.');
    return { isValid: false, errors };
  }

  const L = typeof cfg.length === 'number' && isFinite(cfg.length) && cfg.length > 0 ? cfg.length : 0;
  const seenIds = new Set<string>();

  cfg.loads.forEach((load, idx) => {
    const loadNum = idx + 1;
    if (!load || typeof load !== 'object') {
      errors.push(`Load #${loadNum}: Invalid load definition.`);
      return;
    }

    if (typeof load.id !== 'string' || load.id.trim() === '') {
      errors.push(`Load #${loadNum}: ID must be a non-empty string.`);
    } else if (seenIds.has(load.id)) {
      errors.push(`Load #${loadNum}: Duplicate load ID "${load.id}". IDs must be unique.`);
    } else {
      seenIds.add(load.id);
    }

    if (load.type === 'point_force') {
      if (typeof load.x !== 'number' || !isFinite(load.x) || load.x < 0 || load.x > L) {
        errors.push(`Load #${loadNum} (Point Force): Position x must be within [0, L] (0 <= x <= ${L}).`);
      }
      if (typeof load.magnitude !== 'number' || !isFinite(load.magnitude)) {
        errors.push(`Load #${loadNum} (Point Force): Magnitude must be a finite number.`);
      }
    } else if (load.type === 'point_couple') {
      if (typeof load.x !== 'number' || !isFinite(load.x) || load.x < 0 || load.x > L) {
        errors.push(`Load #${loadNum} (Point Couple): Position x must be within [0, L] (0 <= x <= ${L}).`);
      }
      if (typeof load.magnitude !== 'number' || !isFinite(load.magnitude)) {
        errors.push(`Load #${loadNum} (Point Couple): Magnitude must be a finite number.`);
      }
    } else if (load.type === 'distributed') {
      if (typeof load.x1 !== 'number' || !isFinite(load.x1) || load.x1 < 0 || load.x1 > L) {
        errors.push(`Load #${loadNum} (Distributed): x1 must be within [0, L] (0 <= x1 <= ${L}).`);
      }
      if (typeof load.x2 !== 'number' || !isFinite(load.x2) || load.x2 < 0 || load.x2 > L) {
        errors.push(`Load #${loadNum} (Distributed): x2 must be within [0, L] (0 <= x2 <= ${L}).`);
      }
      if (isFinite(load.x1) && isFinite(load.x2) && load.x1 >= load.x2) {
        errors.push(`Load #${loadNum} (Distributed): Start x1 must be strictly less than end x2 (x1 < x2). Degenerate zero-length intervals are not allowed.`);
      }
      if (typeof load.w1 !== 'number' || !isFinite(load.w1)) {
        errors.push(`Load #${loadNum} (Distributed): Start load intensity w1 must be a finite number.`);
      }
      if (typeof load.w2 !== 'number' || !isFinite(load.w2)) {
        errors.push(`Load #${loadNum} (Distributed): End load intensity w2 must be a finite number.`);
      }
    } else {
      errors.push(`Load #${loadNum}: Unknown load type.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
