import { FinancialMetric } from '../types';

interface MetricPattern {
  name: string;
  unit: string;
  regex: RegExp;
  normalize: (match: string) => number | undefined;
}

const METRIC_PATTERNS: MetricPattern[] = [
  // 1. Revenue
  {
    name: 'Operating Revenue',
    unit: 'USD Millions',
    regex: /(?:revenue(?:\s+of)?|\btop-line\b)[^;\n]*?(?:[\$€£¥])?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:billion|b\b|million|m\b|thousand|k\b)/i,
    normalize: (m) => parseFloat(m),
  },
  // 2. Cash Reserves
  {
    name: 'Cash & Liquid Reserves',
    unit: 'USD Millions',
    regex: /(?:cash\s+reserves|cash\s+and\s+cash\s+equivalents|balance\s+sheet\s+reserves)[^;\n]*?(?:[\$€£¥])?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:billion|b\b|million|m\b|thousand|k\b)/i,
    normalize: (m) => parseFloat(m),
  },
  // 3. Operating Cash Flow (Surplus or Deficit)
  {
    name: 'Operating Cash Flow',
    unit: 'USD Millions',
    regex: /(?:operating\s+cash\s+flow(?:\s+(?:deficit|surplus))?)[^;\n]*?(?:[\$€£¥])?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:billion|b\b|million|m\b|thousand|k\b)/i,
    normalize: (m) => parseFloat(m),
  },
  // 4. Net Income / Loss
  {
    name: 'Net Income / Profit',
    unit: 'USD Millions',
    regex: /(?:net\s+income|net\s+profit|net\s+loss)[^;\n]*?(?:[\$€£¥])?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:billion|b\b|million|m\b|thousand|k\b)/i,
    normalize: (m) => parseFloat(m),
  },
  // 5. Gross Margin
  {
    name: 'Gross Margin',
    unit: 'Percentage (%)',
    regex: /(?:gross\s+margin)[^;\n]*?([0-9]+(?:\.[0-9]+)?)\s*%/i,
    normalize: (m) => parseFloat(m),
  },
  // 6. Days Sales Outstanding (DSO)
  {
    name: 'Days Sales Outstanding (DSO)',
    unit: 'Days',
    regex: /(?:days\s+sales\s+outstanding|dso)[^;\n]*?([0-9]+)\s*days?/i,
    normalize: (m) => parseInt(m, 10),
  },
  // 7. Customer Churn Rate
  {
    name: 'Customer Churn Rate',
    unit: 'Percentage (%)',
    regex: /(?:customer\s+churn|client\s+churn)[^;\n]*?([0-9]+(?:\.[0-9]+)?)\s*%/i,
    normalize: (m) => parseFloat(m),
  },
  // 8. Solvency / Tier-1 Ratio
  {
    name: 'Tier-1 Capital / Solvency Ratio',
    unit: 'Percentage (%)',
    regex: /(?:tier-1\s+capital\s+ratio|solvency\s+ratio)[^;\n]*?([0-9]+(?:\.[0-9]+)?)\s*%/i,
    normalize: (m) => parseFloat(m),
  },
];

/**
 * Extracts structured numerical financial figures from raw commercial text.
 */
export function extractFinancialSignals(text: string): FinancialMetric[] {
  if (!text || text.trim().length === 0) return [];

  const metrics: FinancialMetric[] = [];
  const rawSentences = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"']|$)/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [text.trim()];

  let offset = 0;

  sentences.forEach((sentence, sIdx) => {
    const cleanSentence = sentence.trim();
    const sentenceStart = text.indexOf(sentence, offset);
    if (sentenceStart !== -1) offset = sentenceStart + sentence.length;

    METRIC_PATTERNS.forEach((pattern) => {
      const match = cleanSentence.match(pattern.regex);
      if (match && match[1]) {
        const rawNum = match[1];
        const normalized = pattern.normalize(rawNum);

        // Avoid adding duplicate metrics from same sentence
        const alreadyExists = metrics.some(
          (m) => m.name === pattern.name && m.rawValue === match[0].trim()
        );

        if (!alreadyExists) {
          const excerpt = cleanSentence.length > 200 ? cleanSentence.substring(0, 197) + '...' : cleanSentence;
          metrics.push({
            id: `metric-${pattern.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${metrics.length + 1}`,
            name: pattern.name,
            rawValue: match[0].trim(),
            normalizedValue: normalized,
            unit: pattern.unit,
            period: cleanSentence.match(/\b(Q[1-4]\s*(?:20\d\d)?|FY\s*20\d\d|fiscal\s+year\s*20\d\d|third\s+quarter|annual)\b/i)?.[0] || 'Disclosed Period',
            sourceLocation: {
              line: sIdx + 1,
              startOffset: sentenceStart !== -1 ? sentenceStart : undefined,
              endOffset: sentenceStart !== -1 ? sentenceStart + cleanSentence.length : undefined,
            },
            excerpt,
          });
        }
      }
    });
  });

  return metrics;
}

export const extractFinancialMetrics = extractFinancialSignals;

/**
 * Calculates deterministic percentage variance between two comparative financial numbers.
 * Safely handles negative baselines and zero baselines as required by financial analysis standards.
 */
export function calculateBaselineVariance(
  current: number,
  prior: number
): {
  percentChange: number | null;
  direction: 'increase' | 'decrease' | 'unchanged' | 'undefined';
  formula: string;
  isComparable: boolean;
  explanation: string;
} {
  if (prior === 0) {
    if (current === 0) {
      return {
        percentChange: 0,
        direction: 'unchanged',
        formula: '(0 - 0) / 0',
        isComparable: true,
        explanation: 'Both baseline and current period are zero; no percentage variance defined.',
      };
    }
    return {
      percentChange: null,
      direction: current > 0 ? 'increase' : 'decrease',
      formula: `(${current} - 0) / |0| (Undefined Division by Zero)`,
      isComparable: false,
      explanation: 'Prior period baseline was zero. Absolute dollar difference applies, but percentage growth is mathematically undefined.',
    };
  }

  // Safe percentage change formula handling negative baselines:
  // % Change = (Current - Prior) / |Prior| * 100
  const diff = current - prior;
  const percentChange = Number(((diff / Math.abs(prior)) * 100).toFixed(2));

  let direction: 'increase' | 'decrease' | 'unchanged' = 'unchanged';
  if (diff > 0) direction = 'increase';
  else if (diff < 0) direction = 'decrease';

  const baselineNote = prior < 0 ? ' [Negative Baseline Adjusted using |Prior|]' : '';

  return {
    percentChange,
    direction,
    formula: `((${current} - ${prior}) / |${prior}|) * 100 = ${percentChange}%${baselineNote}`,
    isComparable: true,
    explanation: prior < 0
      ? `Prior period was negative (${prior}). Adjusted using absolute prior denominator to preserve economic direction.`
      : `Normalized change: ${percentChange > 0 ? '+' : ''}${percentChange}% relative to prior baseline of ${prior}.`,
  };
}
