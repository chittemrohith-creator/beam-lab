import { describe, it, expect } from 'vitest';
import { exportToCSV, exportToJSON } from '../export';
import { analyzeBeam } from './solver';
import { PRESETS } from '../presets';

describe('Export Functions', () => {
  it('exports CSV with high precision and discontinuity metadata', () => {
    const config = PRESETS[0].config; // Central point force load at x=5
    const result = analyzeBeam(config);

    let createdHref = '';
    let linkClicked = false;

    const mockAnchor = {
      setAttribute: (attr: string, value: string) => {
        if (attr === 'href') createdHref = value;
      },
      click: () => {
        linkClicked = true;
      },
    };

    const globalDocument = {
      createElement: () => mockAnchor,
      body: {
        appendChild: () => mockAnchor,
        removeChild: () => mockAnchor,
      },
    };

    (globalThis as any).document = globalDocument;

    exportToCSV(result.config, result.reactions, result.diagrams);

    expect(linkClicked).toBe(true);
    expect(createdHref).toContain('data:text/csv;charset=utf-8,');

    const csvText = decodeURIComponent(createdHref.replace('data:text/csv;charset=utf-8,', ''));
    expect(csvText).toContain('# BEAM LAB ANALYSIS REPORT EXPORT');
    expect(csvText).toContain('Discontinuity Side');
    expect(csvText).toContain('left');
    expect(csvText).toContain('right');

    delete (globalThis as any).document;
  });

  it('exports JSON model with schemaVersion=1', () => {
    const config = PRESETS[0].config;

    let createdHref = '';
    const mockAnchor = {
      setAttribute: (attr: string, value: string) => {
        if (attr === 'href') createdHref = value;
      },
      click: () => {},
    };

    const globalDocument = {
      createElement: () => mockAnchor,
      body: {
        appendChild: () => mockAnchor,
        removeChild: () => mockAnchor,
      },
    };

    (globalThis as any).document = globalDocument;

    exportToJSON(config);

    const jsonText = decodeURIComponent(createdHref.replace('data:text/json;charset=utf-8,', ''));
    const parsed = JSON.parse(jsonText);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.app).toBe('Beam Lab');
    expect(parsed.model.length).toBe(config.length);

    delete (globalThis as any).document;
  });
});
