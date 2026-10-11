import { describe, it, expect } from 'vitest';
import { analyzeFinancialSentiment } from '../lib/intelligence/sentiment-engine';
import { analyzeFinancialRisks } from '../lib/intelligence/risk-engine';
import { analyzeCustomerTextFeedback } from '../lib/intelligence/customer-text-engine';
import { segmentDocumentText } from '../lib/intelligence/document-parser';
import { compareMultipleAnalyses } from '../lib/intelligence/cross-document-engine';
import { verifyEvidenceAgainstSource } from '../lib/intelligence/evidence-verifier';
import { AnalysisRecord } from '../lib/types';

describe('Financial Sentiment & Risk Pattern Intelligence Acceptance Suite', () => {
  // Scenario 1: Financial report containing neutral factual language and liquidity concerns produces separate sentiment and risk assessments
  it('Scenario 1: Decouples neutral tone from severe liquidity risks', () => {
    const text = 'During the period, current liabilities exceeded current assets, resulting in a working capital deficit of $45 million.';
    const sentiment = analyzeFinancialSentiment(text);
    const risk = analyzeFinancialRisks(text);

    // Tone must be neutral/factual, NOT emotional
    expect(sentiment.overall).toBe('neutral');

    // Risk engine must independently identify acute liquidity and cash flow risk
    expect(risk.findings.length).toBeGreaterThan(0);
    expect(risk.findings[0].category).toBe('liquidity_cash_flow');
    expect(risk.findings[0].severity).toBe('high');
  });

  // Scenario 2: Customer comment containing positive and negative aspects produces multiple aspect findings
  it('Scenario 2: Extracts multi-aspect sentiment (ABSA) for customer feedback', () => {
    const text = 'The product performance and software speed are outstanding, but the delivery was delayed by three weeks and the support staff was completely unresponsive.';
    const sentiment = analyzeFinancialSentiment(text);

    expect(sentiment.aspects).toBeDefined();
    expect(sentiment.aspects!.length).toBeGreaterThanOrEqual(2);

    const productAspect = sentiment.aspects!.find((a) => a.topic === 'product_quality');
    const deliveryAspect = sentiment.aspects!.find((a) => a.topic === 'delivery_fulfillment');
    const supportAspect = sentiment.aspects!.find((a) => a.topic === 'service_support');

    expect(productAspect).toBeDefined();
    expect(productAspect!.score).toBeGreaterThan(0); // Positive about product

    expect(deliveryAspect).toBeDefined();
    expect(deliveryAspect!.score).toBeLessThanOrEqual(0); // Negative about delivery

    expect(supportAspect).toBeDefined();
  });

  // Scenario 3: Long document produces traceable sentence-level and segment results
  it('Scenario 3: Long document segmentation preserves section headings and character offsets', () => {
    const text = `Management Discussion and Analysis\n\nOperating revenues reached $150 million. The company experienced strong order growth.\n\nItem 1A. Risk Factors\n\nSubstantial doubt exists regarding our cash runway under stressed credit scenarios. Current liabilities exceeded current assets.`;
    const segments = segmentDocumentText(text, 20, 5);

    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].startOffset).toBe(0);
    expect(segments.some((s) => s.sectionHeading?.includes('Risk Factors'))).toBe(true);
  });

  // Scenario 4: Every important finding links to a real source excerpt
  it('Scenario 4: Grounded findings link to verifiable source excerpts', () => {
    const sourceText = 'The syndicate declared an event of default following a severe covenant breach on the senior revolving credit facility.';
    const risk = analyzeFinancialRisks(sourceText);

    expect(risk.findings.length).toBeGreaterThan(0);
    const finding = risk.findings[0];
    const verification = verifyEvidenceAgainstSource(finding.excerpt, sourceText);

    expect(verification.isVerified).toBe(true);
    expect(verification.matchType).toBe('exact');
    expect(sourceText.substring(verification.startOffset!, verification.endOffset!)).toBe(finding.excerpt);
  });

  // Scenario 5: A risk described conditionally in the future is not presented as an already realized event
  it('Scenario 5: Classifies conditional risks as hedged projections rather than realized events', () => {
    const text = 'Supply chain disruptions may potentially impact quarterly manufacturing output if geopolitical tensions escalate further.';
    const risk = analyzeFinancialRisks(text);

    expect(risk.findings.length).toBeGreaterThan(0);
    const finding = risk.findings[0];
    expect(finding.epistemicCertainty).toBe('hedged_projection');
    expect(finding.uncertaintyRationale).toContain('Hedged Risk Warning');
  });

  // Scenario 6: Repeated copies of the same complaint do not become false independent corroboration
  it('Scenario 6: Deduplicates customer messages to prevent false corroboration', () => {
    const customerFeedbackText = `Customer 1: I want to cancel my subscription because of hidden fees.\n\nCustomer 2: I want to cancel my subscription because of hidden fees.\n\nCustomer 3: I want to cancel my subscription because of hidden fees.`;
    const customerResult = analyzeCustomerTextFeedback(customerFeedbackText);

    // 3 raw messages submitted, but only 1 unique distinct customer complaint pattern
    expect(customerResult.totalMessagesAnalyzed).toBe(3);
    expect(customerResult.distinctCustomersIdentified).toBe(1);
    expect(customerResult.cancellationIntentCount).toBe(1);
  });

  // Scenario 7: Negative sentiment alone does not automatically become a severe financial risk
  it('Scenario 7: Prevents negative user experience from falsely triggering financial solvency risk', () => {
    const text = 'The new user interface navigation is frustrating and confusing for our team.';
    const sentiment = analyzeFinancialSentiment(text);
    const risk = analyzeFinancialRisks(text);

    // Tone is negative
    expect(sentiment.overall).toBe('negative');

    // But NOT classified as debt, solvency, or going-concern risk!
    const solvencyRisk = risk.findings.find(
      (f) => f.category === 'liquidity_cash_flow' || f.category === 'debt_leverage' || f.category === 'business_continuity'
    );
    expect(solvencyRisk).toBeUndefined();
  });

  // Scenario 8: Cross-document comparative analysis computes recurrence, trajectory trends, and co-occurrence
  it('Scenario 8: Identifies recurring risks, escalating trajectory, and co-occurrence across documents', () => {
    const analysisA: AnalysisRecord = {
      id: 'doc-a',
      userId: 'usr-1',
      title: 'Q1 Disclosure',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      status: 'completed',
      inputText: 'Cash runway declining. Current liabilities exceeded current assets.',
      wordCount: 15,
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      findings: [
        {
          id: 'f-1',
          category: 'liquidity_cash_flow',
          categoryLabel: 'Liquidity & Cash Flow Risk',
          title: 'Liquidity Strain',
          excerpt: 'Current liabilities exceeded current assets.',
          explanation: 'Working capital strain',
          severity: 'high',
          severityRationale: 'Severe',
          confidence: 0.9,
          potentialImpact: 'Default',
          suggestedNextSteps: [],
          classification: 'explicitly_stated',
        },
      ],
    };

    const analysisB: AnalysisRecord = {
      id: 'doc-b',
      userId: 'usr-1',
      title: 'Q2 Disclosure',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      status: 'completed',
      inputText: 'Cash runway declining further. Covenant breach on senior credit facility.',
      wordCount: 18,
      createdAt: '2025-04-15T00:00:00Z',
      updatedAt: '2025-04-15T00:00:00Z',
      findings: [
        {
          id: 'f-2',
          category: 'liquidity_cash_flow',
          categoryLabel: 'Liquidity & Cash Flow Risk',
          title: 'Liquidity Strain',
          excerpt: 'Cash runway declining further.',
          explanation: 'Working capital strain',
          severity: 'critical',
          severityRationale: 'Severe',
          confidence: 0.95,
          potentialImpact: 'Default',
          suggestedNextSteps: [],
          classification: 'explicitly_stated',
        },
        {
          id: 'f-3',
          category: 'debt_leverage',
          categoryLabel: 'Debt & Leverage Structure',
          title: 'Covenant Breach',
          excerpt: 'Covenant breach on senior credit facility.',
          explanation: 'Debt default',
          severity: 'critical',
          severityRationale: 'Severe',
          confidence: 0.95,
          potentialImpact: 'Acceleration',
          suggestedNextSteps: [],
          classification: 'explicitly_stated',
        },
      ],
    };

    const comparison = compareMultipleAnalyses([analysisA, analysisB]);

    // Recurrence identified
    const liquidityRecurring = comparison.recurringRiskThemes.find(
      (r) => r.category === 'liquidity_cash_flow'
    );
    expect(liquidityRecurring).toBeDefined();
    expect(liquidityRecurring!.distinctSourceCount).toBe(2);

    // Newly emerged risk identified in Q2
    const newlyDebt = comparison.newlyObservedRisks.find((n) => n.category === 'debt_leverage');
    expect(newlyDebt).toBeDefined();

    // Co-occurring pair in Q2 identified
    expect(comparison.coOccurringRiskPairs).toBeDefined();
  });
});
