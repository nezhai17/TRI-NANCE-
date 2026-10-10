import { describe, it, expect } from 'vitest';
import { analyzeFinancialSentiment } from '../lib/intelligence/sentiment-engine';

describe('Financial Sentiment Intelligence Engine', () => {
  it('correctly classifies strong positive financial reports', () => {
    const text = 'The company achieved record profitability and robust revenue expansion. Operating efficiency and cost savings accelerated margin expansion.';
    const result = analyzeFinancialSentiment(text);

    expect(result.overall).toBe('positive');
    expect(result.score).toBeGreaterThan(0.2);
    expect(result.positiveSignals.length).toBeGreaterThan(0);
  });

  it('correctly classifies adverse financial reports with severe headwinds', () => {
    const text = 'The company reported a severe net loss and significant revenue decline. Cash burn accelerated, creating substantial debt burden and distress.';
    const result = analyzeFinancialSentiment(text);

    expect(result.overall).toBe('negative');
    expect(result.score).toBeLessThan(-0.2);
    expect(result.negativeSignals.length).toBeGreaterThan(0);
  });

  it('correctly inverts sentiment when negation words precede positive terms', () => {
    const text = 'The company was not profitable this quarter and failed to achieve growth.';
    const result = analyzeFinancialSentiment(text);

    expect(result.overall).toBe('negative');
    expect(result.score).toBeLessThan(0);
    expect(result.negativeSignals.some(s => s.label.includes('not profitable') || s.label.includes('not growth'))).toBe(true);
  });

  it('detects mixed and contradictory sentiment disclosures', () => {
    const text = 'Although we saw strong growth and record revenue expansion, net income collapsed into heavy losses due to severe margin compression.';
    const result = analyzeFinancialSentiment(text);

    expect(['mixed', 'neutral']).toContain(result.overall);
    expect(result.positiveSignals.length).toBeGreaterThan(0);
    expect(result.negativeSignals.length).toBeGreaterThan(0);
  });

  it('handles empty input gracefully without errors', () => {
    const result = analyzeFinancialSentiment('');
    expect(result.overall).toBe('neutral');
    expect(result.score).toBe(0);
    expect(result.positiveSignals).toEqual([]);
  });
});
