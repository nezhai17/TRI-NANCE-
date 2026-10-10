import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, exportFindingsToCsv } from '../lib/export/csv-exporter';
import { AnalysisRecord } from '../lib/types';

describe('CSV Formula Injection Prevention & Export', () => {
  it('prepends quote to cells starting with formula trigger characters (=, +, -, @, tab, return)', () => {
    expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(sanitizeCsvCell('+cmd|')).toBe(`"'+cmd|"`);
    expect(sanitizeCsvCell('-SUM(A1:A5)')).toBe(`"'-SUM(A1:A5)"`);
    expect(sanitizeCsvCell('@calc')).toBe(`"'@calc"`);
    expect(sanitizeCsvCell('\tmalicious')).toBe(`"'\tmalicious"`);
  });

  it('safely escapes double quotes', () => {
    expect(sanitizeCsvCell('Report states "severe losses"')).toBe(`"Report states ""severe losses"""`);
  });

  it('exports structured findings without formula vulnerabilities', () => {
    const mockAnalysis: AnalysisRecord = {
      id: 'test-123',
      userId: 'user-1',
      title: 'Risk Audit',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      status: 'completed',
      inputText: 'Sample text',
      wordCount: 100,
      findings: [
        {
          id: 'risk-1',
          category: 'debt_leverage',
          categoryLabel: 'Debt & Leverage Structure',
          title: '=2+5 Vulnerability Test',
          excerpt: 'Evidence quote',
          explanation: 'Expl',
          severity: 'critical',
          severityRationale: 'Rationale',
          confidence: 0.95,
          potentialImpact: 'High',
          suggestedNextSteps: ['Action 1'],
          classification: 'explicitly_stated',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const csv = exportFindingsToCsv(mockAnalysis);
    expect(csv).toContain(`"'=2+5 Vulnerability Test"`);
    expect(csv).toContain('CRITICAL');
  });
});
