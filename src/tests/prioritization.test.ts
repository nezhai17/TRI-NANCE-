import { describe, it, expect } from 'vitest';
import { calculateFindingPriority, rankFindingsByPriority } from '../lib/intelligence/prioritization-engine';
import { RiskFinding } from '../lib/types';

describe('Prioritization Engine', () => {
  const criticalFinding: RiskFinding = {
    id: 'risk-1',
    category: 'debt_leverage',
    categoryLabel: 'Debt & Leverage Structure',
    title: 'Senior Credit Facility Covenant Default',
    excerpt: 'The company breached its senior credit covenant in Q3.',
    explanation: 'Material covenant breach risking debt acceleration.',
    severity: 'critical',
    severityRationale: 'Direct breach of senior credit facility terms.',
    confidence: 0.95,
    potentialImpact: 'Lenders can demand immediate repayment.',
    suggestedNextSteps: ['Request waiver', 'Audit covenant calculation'],
    classification: 'explicitly_stated',
    epistemicCertainty: 'documented_fact',
    investigationDiligence: {
      questionsForManagement: ['Has a formal waiver been executed?'],
      recordsToCrossExamine: ['Credit agreement amendment'],
    },
  };

  const mediumFinding: RiskFinding = {
    id: 'risk-2',
    category: 'late_payments_collections',
    categoryLabel: 'Late Payments & Collections',
    title: 'Receivables Lengthening',
    excerpt: 'DSO lengthened to 70 days.',
    explanation: 'Collections cycle extended.',
    severity: 'medium',
    severityRationale: 'Cash conversion cycle slowed.',
    confidence: 0.7,
    potentialImpact: 'Working capital strain.',
    suggestedNextSteps: ['Review aging accounts'],
    classification: 'inferred',
    epistemicCertainty: 'hedged_projection',
  };

  it('ranks critical solvency breach at P1_CRITICAL tier', () => {
    const score = calculateFindingPriority(criticalFinding);
    expect(score.tier).toBe('P1_CRITICAL');
    expect(score.compositePriorityScore).toBeGreaterThanOrEqual(80);
    expect(score.factors.severityWeight).toBe(40);
    expect(score.factors.certaintyWeight).toBe(25);
    expect(score.factors.materialityWeight).toBe(20);
    expect(score.explanation).toContain('P1_CRITICAL');
  });

  it('ranks findings in descending composite priority order', () => {
    const ranked = rankFindingsByPriority([mediumFinding, criticalFinding]);
    expect(ranked[0].finding.id).toBe('risk-1');
    expect(ranked[1].finding.id).toBe('risk-2');
  });
});
