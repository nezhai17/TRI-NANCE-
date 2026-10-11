import { describe, it, expect } from 'vitest';
import { compareMultipleAnalyses } from '../lib/intelligence/cross-document-engine';
import { AnalysisRecord } from '../lib/types';

describe('Cross-Document Comparative Investigation Engine', () => {
  const mockDocA: AnalysisRecord = {
    id: 'doc-1',
    userId: 'user-1',
    title: 'FY2024 Q3 Shareholder Letter',
    sourceType: 'document_upload',
    sourceCategory: 'financial_report',
    analysisMode: 'combined',
    status: 'completed',
    inputText: 'Q3 performance exceeded expectations with robust order growth and strong operating cashflow.',
    wordCount: 150,
    sentimentResult: {
      overall: 'positive',
      score: 0.54,
      confidence: 0.92,
      positiveSignals: [],
      negativeSignals: [],
      neutralSignals: [],
      contradictions: [],
      limitations: '',
      summary: 'Strong growth outlook across core markets.',
    },
    findings: [
      {
        id: 'f-1',
        category: 'supply_chain_dependency',
        categoryLabel: 'Supply Chain Bottlenecks',
        title: 'Component Lead Time Extension',
        excerpt: 'Lead times for specialized modules lengthened slightly.',
        explanation: 'Supply constraints noted.',
        severity: 'medium',
        severityRationale: 'Manageable buffer inventory in place.',
        confidence: 0.88,
        potentialImpact: 'Moderate delivery delays.',
        suggestedNextSteps: ['Expand dual sourcing'],
        classification: 'explicitly_stated',
      },
    ],
    createdAt: '2024-09-30T10:00:00.000Z',
    updatedAt: '2024-09-30T10:00:00.000Z',
  };

  const mockDocB: AnalysisRecord = {
    id: 'doc-2',
    userId: 'user-1',
    title: 'FY2024 Q4 10-K Annual Report',
    sourceType: 'document_upload',
    sourceCategory: 'regulatory_filing',
    analysisMode: 'combined',
    status: 'completed',
    inputText: 'In Q4, severe margin compression materialized alongside credit facility covenant breaches.',
    wordCount: 220,
    sentimentResult: {
      overall: 'negative',
      score: -0.68,
      confidence: 0.95,
      positiveSignals: [],
      negativeSignals: [],
      neutralSignals: [],
      contradictions: [],
      limitations: '',
      summary: 'Adverse developments impacted profitability and liquidity.',
    },
    findings: [
      {
        id: 'f-2',
        category: 'supply_chain_dependency',
        categoryLabel: 'Supply Chain Bottlenecks',
        title: 'Severe Logistics Bottlenecks',
        excerpt: 'Global transit disruptions escalated component shortages.',
        explanation: 'Persistent supply disruptions.',
        severity: 'high',
        severityRationale: 'Escalated from prior quarter.',
        confidence: 0.94,
        potentialImpact: 'Unfulfilled customer backorders.',
        suggestedNextSteps: ['Air freight emergency expedited items'],
        classification: 'explicitly_stated',
      },
      {
        id: 'f-3',
        category: 'debt_leverage',
        categoryLabel: 'Debt & Covenant Strains',
        title: 'Credit Facility Covenant Breach',
        excerpt: 'Company is in breach of the senior leverage covenant as of year-end.',
        explanation: 'Debt covenant breach triggered default interest provisions.',
        severity: 'critical',
        severityRationale: 'May trigger debt acceleration if waiver is denied.',
        confidence: 0.99,
        potentialImpact: 'Insolvency risk upon debt acceleration.',
        suggestedNextSteps: ['Engage lending syndicate immediately for waiver amendment'],
        classification: 'explicitly_stated',
      },
    ],
    createdAt: '2024-12-31T10:00:00.000Z',
    updatedAt: '2024-12-31T10:00:00.000Z',
  };

  it('requires at least two documents for comparison', () => {
    expect(() => compareMultipleAnalyses([mockDocA])).toThrow(
      'Cross-document investigation requires at least two comparative analysis dossiers.'
    );
  });

  it('correctly tracks sentiment trajectory over time', () => {
    const comparison = compareMultipleAnalyses([mockDocA, mockDocB], 'Annual Progression');

    expect(comparison.title).toBe('Annual Progression');
    expect(comparison.sentimentTrajectory).toHaveLength(2);
    expect(comparison.sentimentTrajectory[0].overall).toBe('positive');
    expect(comparison.sentimentTrajectory[0].score).toBe(0.54);
    expect(comparison.sentimentTrajectory[1].overall).toBe('negative');
    expect(comparison.sentimentTrajectory[1].score).toBe(-0.68);
  });

  it('identifies recurring risk categories that persist across periods', () => {
    const comparison = compareMultipleAnalyses([mockDocA, mockDocB]);

    const recurring = comparison.recurringRiskThemes.find((r) => r.category === 'supply_chain_dependency');
    expect(recurring).toBeDefined();
    expect(recurring?.occurrencesCount).toBe(2);
    expect(recurring?.documentMentions).toContain(mockDocA.title);
    expect(recurring?.documentMentions).toContain(mockDocB.title);
  });

  it('detects newly emerged threats absent in baseline period', () => {
    const comparison = compareMultipleAnalyses([mockDocA, mockDocB]);

    const newlyObserved = comparison.newlyObservedRisks.find((n) => n.category === 'debt_leverage');
    expect(newlyObserved).toBeDefined();
    expect(newlyObserved?.firstObservedIn).toBe(mockDocB.title);
    expect(newlyObserved?.findingTitle).toBe('Credit Facility Covenant Breach');
  });

  it('generates inter-document contradiction anomalies for sudden covenant breach escalations', () => {
    const comparison = compareMultipleAnalyses([mockDocA, mockDocB]);

    expect(comparison.contradictionsBetweenDocuments.length).toBeGreaterThanOrEqual(1);
    const breachConflict = comparison.contradictionsBetweenDocuments.find((c) =>
      c.title.includes('Covenant Breach')
    );
    expect(breachConflict).toBeDefined();
    expect(breachConflict?.severity).toBe('critical');
    expect(breachConflict?.comparedExcerpts).toHaveLength(2);
  });
});
