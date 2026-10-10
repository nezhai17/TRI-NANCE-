import { AnalysisRecord, RiskFinding } from '../types';

/**
 * Sanitizes a cell string to prevent CSV formula injection (CVE-2014-3524 / CWE-1236).
 * Prepends a single quote if the field begins with '=', '+', '-', '@', '\t', or '\r'.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // If starts with trigger characters, prepend single quote
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates an executive findings CSV export from an AnalysisRecord.
 */
export function exportFindingsToCsv(analysis: AnalysisRecord): string {
  const headers = [
    'Finding ID',
    'Category',
    'Severity',
    'Title',
    'Evidence Excerpt',
    'Source Line',
    'Classification',
    'Confidence',
    'Explanation',
    'Severity Rationale',
    'Potential Impact',
    'Recommended Next Steps',
  ];

  const rows: string[] = [headers.map(sanitizeCsvCell).join(',')];

  (analysis.findings || []).forEach((finding: RiskFinding) => {
    const row = [
      finding.id,
      finding.categoryLabel,
      finding.severity.toUpperCase(),
      finding.title,
      finding.excerpt,
      finding.sourceLocation?.line ? `Line ${finding.sourceLocation.line}` : 'N/A',
      finding.classification,
      `${Math.round(finding.confidence * 100)}%`,
      finding.explanation,
      finding.severityRationale,
      finding.potentialImpact,
      finding.suggestedNextSteps.join('; '),
    ];
    rows.push(row.map(sanitizeCsvCell).join(','));
  });

  return rows.join('\r\n');
}
