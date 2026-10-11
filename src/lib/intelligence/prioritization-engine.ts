import { RiskFinding, RiskSeverity, EpistemicCertainty } from '../types';

export type PriorityTier = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_ELEVATED' | 'P4_MONITOR';

export interface PrioritizedFindingScore {
  findingId: string;
  compositePriorityScore: number; // 0 to 100
  tier: PriorityTier;
  factors: {
    severityWeight: number; // 0 to 40
    certaintyWeight: number; // 0 to 25
    materialityWeight: number; // 0 to 20
    actionabilityWeight: number; // 0 to 15
  };
  explanation: string;
}

/**
 * Deterministic Transparent Prioritization Engine:
 * Separates severity, epistemic certainty, financial materiality, and actionability.
 * Explains exactly why a finding is prioritized over others.
 */
export function calculateFindingPriority(finding: RiskFinding): PrioritizedFindingScore {
  // 1. Severity Weight (0 - 40 points)
  let severityWeight = 10;
  switch (finding.severity) {
    case 'critical':
      severityWeight = 40;
      break;
    case 'high':
      severityWeight = 28;
      break;
    case 'medium':
      severityWeight = 18;
      break;
    case 'low':
      severityWeight = 8;
      break;
  }

  // 2. Certainty Weight (0 - 25 points)
  // Documented historical facts rank highest because evidence is conclusive
  let certaintyWeight = 15;
  switch (finding.epistemicCertainty) {
    case 'documented_fact':
      certaintyWeight = 25;
      break;
    case 'ambiguous_disclosure':
      certaintyWeight = 18;
      break;
    case 'hedged_projection':
      certaintyWeight = 12;
      break;
    default:
      certaintyWeight = 14;
      break;
  }

  // 3. Financial Materiality (0 - 20 points)
  // Categories directly affecting solvency, going-concern, or legal compliance receive higher weight
  let materialityWeight = 10;
  if (
    finding.category === 'business_continuity' ||
    finding.category === 'debt_leverage' ||
    finding.category === 'liquidity_cash_flow'
  ) {
    materialityWeight = 20;
  } else if (
    finding.category === 'regulatory_compliance' ||
    finding.category === 'fraud_inconsistencies' ||
    finding.category === 'revenue_earnings_pressure'
  ) {
    materialityWeight = 15;
  } else if (
    finding.category === 'expense_margin_deterioration' ||
    finding.category === 'late_payments_collections' ||
    finding.category === 'customer_churn_confidence'
  ) {
    materialityWeight = 12;
  }

  // 4. Actionability & Diligence Readiness (0 - 15 points)
  let actionabilityWeight = 5;
  if (
    finding.investigationDiligence &&
    finding.investigationDiligence.questionsForManagement &&
    finding.investigationDiligence.questionsForManagement.length > 0
  ) {
    actionabilityWeight += 5;
  }
  if (finding.suggestedNextSteps && finding.suggestedNextSteps.length > 0) {
    actionabilityWeight += 5;
  }

  const compositePriorityScore = Math.min(
    100,
    severityWeight + certaintyWeight + materialityWeight + actionabilityWeight
  );

  let tier: PriorityTier = 'P4_MONITOR';
  if (compositePriorityScore >= 80) tier = 'P1_CRITICAL';
  else if (compositePriorityScore >= 60) tier = 'P2_HIGH';
  else if (compositePriorityScore >= 40) tier = 'P3_ELEVATED';

  const explanation = `${tier} (${compositePriorityScore}/100) — Severity (${severityWeight}/40), Textual Certainty (${certaintyWeight}/25), Materiality (${materialityWeight}/20), and Actionability (${actionabilityWeight}/15).`;

  return {
    findingId: finding.id,
    compositePriorityScore,
    tier,
    factors: {
      severityWeight,
      certaintyWeight,
      materialityWeight,
      actionabilityWeight,
    },
    explanation,
  };
}

export function rankFindingsByPriority(findings: RiskFinding[]): Array<{
  finding: RiskFinding;
  priority: PrioritizedFindingScore;
}> {
  return findings
    .map((f) => ({
      finding: f,
      priority: calculateFindingPriority(f),
    }))
    .sort((a, b) => b.priority.compositePriorityScore - a.priority.compositePriorityScore);
}
