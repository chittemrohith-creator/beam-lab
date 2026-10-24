import { BeamConfig, DiagramPoint, ReactionResults } from './solver/types';

export function exportToCSV(
  config: BeamConfig,
  reactions: ReactionResults,
  diagrams: DiagramPoint[]
): void {
  const lines: string[] = [];

  lines.push('# BEAM LAB ANALYSIS REPORT EXPORT');
  lines.push(`# Support Type: ${config.supportType}`);
  lines.push(`# Beam Length (m): ${config.length}`);
  lines.push(`# Elastic Modulus E (GPa): ${config.elasticModulus}`);
  lines.push(`# Moment of Inertia Iz (mm^4): ${config.momentOfInertia}`);
  lines.push('');
  lines.push('# REACTIONS');
  lines.push('Support,Type,Value (SI),Value (kN / kNm)');
  lines.push(`A (x=0m),Vertical Force (RA),${reactions.RA.toFixed(4)},${(reactions.RA / 1000).toFixed(4)}`);
  lines.push(`A (x=0m),Moment (MA),${reactions.MA.toFixed(4)},${(reactions.MA / 1000).toFixed(4)}`);
  lines.push(`B (x=${config.length}m),Vertical Force (RB),${reactions.RB.toFixed(4)},${(reactions.RB / 1000).toFixed(4)}`);
  lines.push('');
  lines.push('# DIAGRAM DATA');
  lines.push('x (m),Shear Force V (kN),Bending Moment M (kNm),Slope theta (rad),Deflection v (mm)');

  for (const pt of diagrams) {
    const x = pt.x.toFixed(4);
    const v_kN = (pt.v / 1000).toFixed(4);
    const m_kNm = (pt.m / 1000).toFixed(4);
    const slope_rad = pt.slope.toExponential(4);
    const def_mm = (pt.deflection * 1000).toFixed(4);
    lines.push(`${x},${v_kN},${m_kNm},${slope_rad},${def_mm}`);
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `beam_lab_results_${config.supportType}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(config: BeamConfig): void {
  const data = {
    schemaVersion: 1,
    app: 'Beam Lab',
    timestamp: new Date().toISOString(),
    model: config,
  };
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const link = document.createElement('a');
  link.setAttribute('href', jsonString);
  link.setAttribute('download', `beam_lab_model.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
