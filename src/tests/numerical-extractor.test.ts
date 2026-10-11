import { describe, it, expect } from 'vitest';
import {
  extractFinancialMetrics,
  calculateBaselineVariance,
} from '../lib/intelligence/numerical-extractor';

describe('Financial Numerical Extractor & Variance Calculator', () => {
  it('extracts structured financial metrics with locations from text', () => {
    const text = `
      In Q3 2025, Total Revenue reached $84.2 million, while Cash reserves stood at $14.8M.
      Gross Margin compressed to 28.4% and DSO expanded to 58 days.
    `;

    const metrics = extractFinancialMetrics(text);
    expect(metrics.length).toBeGreaterThanOrEqual(4);

    const rev = metrics.find((m) => m.name.toLowerCase().includes('revenue'));
    expect(rev).toBeDefined();
    expect(rev?.rawValue).toContain('84.2');
    expect(rev?.normalizedValue).toBe(84.2);
    expect(rev?.unit).toBe('USD Millions');
    expect(rev?.sourceLocation?.line).toBeGreaterThanOrEqual(1);

    const margin = metrics.find((m) => m.name.toLowerCase().includes('gross margin'));
    expect(margin).toBeDefined();
    expect(margin?.normalizedValue).toBe(28.4);
    expect(margin?.unit).toBe('Percentage (%)');

    const dso = metrics.find((m) => m.name.toLowerCase().includes('dso'));
    expect(dso).toBeDefined();
    expect(dso?.normalizedValue).toBe(58);
    expect(dso?.unit).toBe('Days');
  });

  describe('calculateBaselineVariance formula safeguards', () => {
    it('computes standard positive and negative percentage variance', () => {
      // 100 -> 125 is +25%
      const pos = calculateBaselineVariance(125, 100);
      expect(pos.percentChange).toBe(25);
      expect(pos.direction).toBe('increase');
      expect(pos.isComparable).toBe(true);

      // 100 -> 80 is -20%
      const neg = calculateBaselineVariance(80, 100);
      expect(neg.percentChange).toBe(-20);
      expect(neg.direction).toBe('decrease');
      expect(neg.isComparable).toBe(true);
    });

    it('safely handles zero baseline without division-by-zero errors', () => {
      // 0 -> 50: mathematically undefined percentage growth in finance, direction is increase
      const zeroToPos = calculateBaselineVariance(50, 0);
      expect(zeroToPos.percentChange).toBeNull();
      expect(zeroToPos.direction).toBe('increase');
      expect(zeroToPos.isComparable).toBe(false);
      expect(zeroToPos.formula).toContain('Undefined Division by Zero');

      // 0 -> 0: 0%
      const zeroToZero = calculateBaselineVariance(0, 0);
      expect(zeroToZero.percentChange).toBe(0);
      expect(zeroToZero.direction).toBe('unchanged');
      expect(zeroToZero.isComparable).toBe(true);
    });

    it('accurately calculates variance with negative baselines using absolute magnitude', () => {
      // Baseline net loss was -100, current net loss is -50 (improvement of +50)
      // formula: (-50 - (-100)) / abs(-100) * 100 = 50 / 100 * 100 = +50%
      const lossReduction = calculateBaselineVariance(-50, -100);
      expect(lossReduction.percentChange).toBe(50);
      expect(lossReduction.direction).toBe('increase');
      expect(lossReduction.formula).toContain('Negative Baseline Adjusted using |Prior|');

      // Baseline net loss was -100, current net profit is +20 (improvement of +120)
      // formula: (20 - (-100)) / abs(-100) * 100 = 120 / 100 * 100 = +120%
      const turnedProfitable = calculateBaselineVariance(20, -100);
      expect(turnedProfitable.percentChange).toBe(120);
      expect(turnedProfitable.direction).toBe('increase');

      // Baseline net loss was -100, current deepened loss is -150
      // formula: (-150 - (-100)) / abs(-100) * 100 = -50 / 100 * 100 = -50%
      const deepenedLoss = calculateBaselineVariance(-150, -100);
      expect(deepenedLoss.percentChange).toBe(-50);
      expect(deepenedLoss.direction).toBe('decrease');
    });
  });
});
