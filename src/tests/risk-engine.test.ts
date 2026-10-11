import { describe, it, expect } from 'vitest';
import { analyzeFinancialRisks } from '../lib/intelligence/risk-engine';

describe('Financial Risk Intelligence Engine', () => {
  it('detects liquidity and cash burn risks', () => {
    const text = 'The organization reported declining cash reserves and an operating cash flow deficit.';
    const { findings, summary } = analyzeFinancialRisks(text);

    expect(findings.some((f) => f.category === 'liquidity_cash_flow')).toBe(true);
    expect(summary.highestSeverity).toBe('high');
    expect(summary.overallRiskScore).toBeGreaterThan(0);
  });

  it('detects critical debt covenant breaches', () => {
    const text = 'We experienced a covenant breach under our senior credit agreement during the third quarter.';
    const { findings, summary } = analyzeFinancialRisks(text);

    const debtFinding = findings.find((f) => f.category === 'debt_leverage');
    expect(debtFinding).toBeDefined();
    expect(debtFinding?.severity).toBe('critical');
    expect(summary.highestSeverity).toBe('critical');
  });

  it('detects customer churn and late payment collections', () => {
    const text = 'Customer churn spiked dramatically following outage incidents. Concurrently, overdue receivables and days sales outstanding rose to 85 days.';
    const { findings } = analyzeFinancialRisks(text);

    expect(findings.some((f) => f.category === 'customer_churn_confidence')).toBe(true);
    expect(findings.some((f) => f.category === 'late_payments_collections')).toBe(true);
  });

  it('detects regulatory investigation disclosures', () => {
    const text = 'The company received a formal subpoena regarding a regulatory investigation by securities authorities.';
    const { findings } = analyzeFinancialRisks(text);

    const regFinding = findings.find((f) => f.category === 'regulatory_compliance');
    expect(regFinding).toBeDefined();
    expect(regFinding?.severity).toBe('critical');
  });

  it('detects going concern warnings as critical enterprise risk', () => {
    const text = 'The independent audit report highlighted substantial doubt about the company ability to continue as a going concern.';
    const { findings, summary } = analyzeFinancialRisks(text);

    expect(findings.some((f) => f.category === 'business_continuity')).toBe(true);
    expect(summary.highestSeverity).toBe('critical');
  });

  it('returns clean risk profile when no risk patterns exist', () => {
    const text = 'The company maintained steady operations and positive cash flows with no material disputes.';
    const { findings, summary } = analyzeFinancialRisks(text);

    expect(findings.length).toBe(0);
    expect(summary.highestSeverity).toBe('low');
    expect(summary.overallRiskScore).toBe(0);
  });

  it('generates targeted management inquiries, footnote cross-references, and epistemic certainty tags', () => {
    const text = 'The company experienced a severe covenant breach on its revolving credit facility and cash runway fell below 3 months.';
    const { findings } = analyzeFinancialRisks(text);

    const covFinding = findings.find((f) => f.category === 'debt_leverage');
    expect(covFinding).toBeDefined();
    expect(covFinding?.epistemicCertainty).toBe('documented_fact');
    expect(covFinding?.investigationDiligence).toBeDefined();
    expect(covFinding?.investigationDiligence?.questionsForManagement.length).toBeGreaterThan(0);
    expect(covFinding?.investigationDiligence?.recordsToCrossExamine.length).toBeGreaterThan(0);
    expect(covFinding?.investigationDiligence?.identifiedInformationGap).toContain('covenant');
  });
});
