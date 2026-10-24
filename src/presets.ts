import { BeamConfig } from './solver/types';

export const SCHEMA_VERSION = 1;
export const LOCAL_STORAGE_KEY = 'beam_lab_model_v1';

export const PRESETS: { name: string; description: string; config: BeamConfig }[] = [
  {
    name: 'Simply Supported - Central Point Load',
    description: 'Simply supported beam (L=10m) with a 20 kN downward point load at midspan x=5m.',
    config: {
      length: 10,
      elasticModulus: 200,
      momentOfInertia: 100000000, // 1e8 mm^4
      supportType: 'simply_supported',
      loads: [
        {
          id: 'preset-1',
          type: 'point_force',
          x: 5,
          magnitude: -20,
        },
      ],
    },
  },
  {
    name: 'Simply Supported - Full Span UDL',
    description: 'Simply supported beam (L=8m) with a uniform downward load of 10 kN/m over the entire span.',
    config: {
      length: 8,
      elasticModulus: 200,
      momentOfInertia: 80000000,
      supportType: 'simply_supported',
      loads: [
        {
          id: 'preset-2',
          type: 'distributed',
          x1: 0,
          x2: 8,
          w1: -10,
          w2: -10,
        },
      ],
    },
  },
  {
    name: 'Cantilever - Tip Point Load',
    description: 'Cantilever beam (L=5m) fixed at x=0 with a 15 kN downward tip load at x=5m.',
    config: {
      length: 5,
      elasticModulus: 200,
      momentOfInertia: 50000000,
      supportType: 'cantilever',
      loads: [
        {
          id: 'preset-3',
          type: 'point_force',
          x: 5,
          magnitude: -15,
        },
      ],
    },
  },
  {
    name: 'Cantilever - Full Span UDL',
    description: 'Cantilever beam (L=6m) fixed at x=0 with a uniform downward load of 8 kN/m.',
    config: {
      length: 6,
      elasticModulus: 200,
      momentOfInertia: 60000000,
      supportType: 'cantilever',
      loads: [
        {
          id: 'preset-4',
          type: 'distributed',
          x1: 0,
          x2: 6,
          w1: -8,
          w2: -8,
        },
      ],
    },
  },
];
