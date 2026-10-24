import { BeamConfig } from './types';

export function validateBeamConfig(config: BeamConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof config.length !== 'number' || !isFinite(config.length) || config.length <= 0) {
    errors.push('Beam length must be a finite positive number (L > 0).');
  }

  if (typeof config.elasticModulus !== 'number' || !isFinite(config.elasticModulus) || config.elasticModulus <= 0) {
    errors.push('Elastic modulus (E) must be a finite positive number (E > 0).');
  }

  if (typeof config.momentOfInertia !== 'number' || !isFinite(config.momentOfInertia) || config.momentOfInertia <= 0) {
    errors.push('Moment of inertia (Iz) must be a finite positive number (I > 0).');
  }

  if (!['simply_supported', 'cantilever'].includes(config.supportType)) {
    errors.push('Invalid support type. Must be "simply_supported" or "cantilever".');
  }

  if (!Array.isArray(config.loads)) {
    errors.push('Loads must be provided as an array.');
    return { isValid: false, errors };
  }

  const L = config.length;

  config.loads.forEach((load, idx) => {
    const loadNum = idx + 1;
    if (!load.id) {
      errors.push(`Load #${loadNum}: Missing unique identifier.`);
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
