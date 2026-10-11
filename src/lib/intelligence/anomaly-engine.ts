import { AnomalyFinding, SentimentResult, RiskFinding, FinancialMetric } from '../types';

export function detectAnomaliesAndContradictions(
  text: string,
  sentiment?: SentimentResult,
  findings?: RiskFinding[],
  metrics?: FinancialMetric[]
): AnomalyFinding[] {
  const anomalies: AnomalyFinding[] = [];

  if (!text || text.trim().length === 0) return anomalies;

  // 1. Check for Narrative vs Financial Reality Dissonance
  // Scenario: Optimistic top-line expansion combined with severe cash deficit or debt covenant breach
  const hasGrowthClaims = /\b(strong\s+growth|revenue\s+exceeded|record\s+growth|accelerated\s+top-line|resilient\s+expansion)\b/i.test(text);
  const hasLiquidityCrisis = (findings || []).some(
    (f) => f.category === 'liquidity_cash_flow' || f.category === 'business_continuity'
  );
  const hasCovenantBreach = (findings || []).some((f) => f.category === 'debt_leverage');

  if (hasGrowthClaims && (hasLiquidityCrisis || hasCovenantBreach)) {
    const growthExcerpt = text.match(/[^.!?\n]*?\b(strong\s+growth|revenue\s+exceeded|record\s+growth|accelerated\s+top-line|resilient\s+expansion)\b[^.!?\n]*?[.!?\n]/i)?.[0]?.trim() || 'Prominent growth narrative claimed';
    const distressExcerpt = findings?.find(
      (f) => f.category === 'liquidity_cash_flow' || f.category === 'debt_leverage' || f.category === 'business_continuity'
    )?.excerpt || 'Severe liquidity or debt covenant strain disclosed';

    anomalies.push({
      id: `anomaly-narrative-dissonance-${anomalies.length + 1}`,
      type: 'narrative_vs_financial_dissonance',
      title: 'Narrative Growth vs. Solvency Dissonance',
      description: 'Management narrative portrays strong top-line momentum, but disclaims acute liquidity erosion, debt covenant breaches, or going-concern doubts in the same filing.',
      severity: 'critical',
      comparedExcerpts: [
        { label: 'Optimistic Claim', text: growthExcerpt },
        { label: 'Adverse Balance Sheet Disclosure', text: distressExcerpt },
      ],
      requiresVerification: true,
    });
  }

  // 2. Margin Compression alongside Revenue Growth
  const hasMarginErosion = (findings || []).some((f) => f.category === 'expense_margin_deterioration');
  if (hasGrowthClaims && hasMarginErosion && !anomalies.some((a) => a.title.includes('Dissonance'))) {
    const marginFinding = findings?.find((f) => f.category === 'expense_margin_deterioration');
    anomalies.push({
      id: `anomaly-margin-erosion-${anomalies.length + 1}`,
      type: 'metric_discrepancy',
      title: 'Top-Line Expansion with Gross Margin Decoupling',
      description: 'Top-line sales volumes expanded, but operating expenses and cost inflation outstripped realizations, compressing operating leverage and net earnings.',
      severity: 'high',
      comparedExcerpts: [
        { label: 'Expansion Statement', text: 'Top-line revenue delivered growth guidance' },
        { label: 'Margin Compression', text: marginFinding?.excerpt || 'Gross margin compressed significantly' },
      ],
      requiresVerification: true,
    });
  }

  // 3. Low Cash Reserves (< $10M) with High Operating Cash Deficit (> $15M)
  const cashMetric = metrics?.find((m) => m.name.includes('Cash') && m.normalizedValue !== undefined);
  const deficitMetric = metrics?.find((m) => m.name.includes('Operating Cash Flow') && m.normalizedValue !== undefined);

  if (cashMetric?.normalizedValue !== undefined && deficitMetric?.normalizedValue !== undefined) {
    if (cashMetric.normalizedValue < 10 && deficitMetric.normalizedValue > 15) {
      anomalies.push({
        id: `anomaly-runway-deficit-${anomalies.length + 1}`,
        type: 'covenant_liquidity_contradiction',
        title: 'Runway Depletion Anomaly',
        description: `Disclosed cash reserves ($${cashMetric.normalizedValue}M) are less than the single-period operating cash deficit ($${deficitMetric.normalizedValue}M), indicating immediate external recapitalization dependency.`,
        severity: 'critical',
        comparedExcerpts: [
          { label: 'Liquid Reserves', text: cashMetric.excerpt },
          { label: 'Operating Deficit', text: deficitMetric.excerpt },
        ],
        requiresVerification: true,
      });
    }
  }

  // 4. Inherent Sentiment Contradictions from Sentiment Engine
  if (sentiment?.contradictions && sentiment.contradictions.length > 0) {
    sentiment.contradictions.forEach((contradictionText, idx) => {
      anomalies.push({
        id: `anomaly-sentiment-contradiction-${idx + 1}`,
        type: 'narrative_vs_financial_dissonance',
        title: 'Mixed Sentiment & Hedging Anomaly',
        description: contradictionText,
        severity: 'medium',
        comparedExcerpts: [
          { label: 'Sentence Context', text: contradictionText },
        ],
        requiresVerification: true,
      });
    });
  }

  return anomalies;
}
