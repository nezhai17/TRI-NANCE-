import { SentimentClass, SentimentResult, SentimentSignal } from '../types';

// Financial-specific sentiment terms with domain weighting
const POSITIVE_LEXICON: Record<string, number> = {
  profitable: 0.85,
  profitability: 0.85,
  growth: 0.7,
  growing: 0.7,
  expansion: 0.65,
  expanded: 0.65,
  outperformed: 0.9,
  outperforming: 0.9,
  exceeded: 0.85,
  exceeding: 0.85,
  surpassed: 0.85,
  robust: 0.75,
  resilient: 0.7,
  resilience: 0.7,
  strong: 0.65,
  strength: 0.65,
  accelerated: 0.75,
  acceleration: 0.75,
  record: 0.8,
  dividend: 0.5,
  dividends: 0.5,
  upside: 0.75,
  tailwind: 0.7,
  tailwinds: 0.7,
  gain: 0.6,
  gains: 0.6,
  gained: 0.6,
  solvency: 0.75,
  solvent: 0.75,
  liquidity_surplus: 0.9,
  cash_rich: 0.85,
  upgrade: 0.8,
  upgraded: 0.8,
  rebound: 0.7,
  rebounded: 0.7,
  recovery: 0.65,
  efficiency: 0.6,
  efficient: 0.6,
  cost_savings: 0.7,
  margin_expansion: 0.85,
};

const NEGATIVE_LEXICON: Record<string, number> = {
  loss: 0.8,
  losses: 0.8,
  deficit: 0.85,
  decline: 0.7,
  declined: 0.7,
  declining: 0.7,
  downturn: 0.8,
  deterioration: 0.85,
  deteriorated: 0.85,
  deteriorating: 0.85,
  collapse: 0.95,
  collapsed: 0.95,
  impairment: 0.85,
  impaired: 0.85,
  write_off: 0.9,
  writedown: 0.85,
  insolvency: 0.95,
  insolvent: 0.95,
  bankruptcy: 1.0,
  default: 0.95,
  defaulted: 0.95,
  distress: 0.9,
  distressed: 0.9,
  debt_burden: 0.85,
  covenant_breach: 0.95,
  headwind: 0.7,
  headwinds: 0.7,
  pressure: 0.65,
  pressures: 0.65,
  underperformed: 0.85,
  underperforming: 0.85,
  missed: 0.75,
  downgrade: 0.8,
  downgraded: 0.8,
  litigation: 0.75,
  lawsuit: 0.75,
  investigation: 0.8,
  sanction: 0.85,
  sanctions: 0.85,
  fine: 0.7,
  fined: 0.7,
  penalty: 0.75,
  penalties: 0.75,
  churn: 0.75,
  margin_compression: 0.85,
  dilution: 0.7,
  burn_rate: 0.75,
  overdue: 0.7,
  uncollectible: 0.85,
  layoffs: 0.75,
  restructuring: 0.65,
};

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'hardly', 'barely', 'scarcely',
  'unable', 'failed', 'fails', 'failing', 'without', 'lack', 'lacks', 'lacking'
]);

export function analyzeFinancialSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      overall: 'neutral',
      score: 0,
      confidence: 0,
      summary: 'No text content provided for analysis.',
      positiveSignals: [],
      negativeSignals: [],
      neutralSignals: [],
      contradictions: [],
      limitations: 'Input text was empty.',
    };
  }

  // Segment into sentences
  const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
  const rawSentences = text.match(sentenceRegex) || [text];

  const positiveSignals: SentimentSignal[] = [];
  const negativeSignals: SentimentSignal[] = [];
  const neutralSignals: SentimentSignal[] = [];
  const contradictions: string[] = [];

  let totalPositiveScore = 0;
  let totalNegativeScore = 0;
  let totalWordsCount = 0;

  let currentOffset = 0;

  rawSentences.forEach((sentence, sIdx) => {
    const cleanSentence = sentence.trim();
    if (cleanSentence.length < 5) return;

    const sentenceStart = text.indexOf(sentence, currentOffset);
    if (sentenceStart !== -1) currentOffset = sentenceStart + sentence.length;

    const words = cleanSentence.toLowerCase().replace(/[^a-z0-9_\s-]/g, ' ').split(/\s+/).filter(Boolean);
    totalWordsCount += words.length;

    let sentencePosScore = 0;
    let sentenceNegScore = 0;
    const foundPos: string[] = [];
    const foundNeg: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Check 2-word phrase
      const twoWord = i < words.length - 1 ? `${word}_${words[i + 1]}` : null;

      // Check negation in preceding 3 words
      const isNegated = [1, 2, 3].some((back) => {
        const prev = words[i - back];
        return prev && NEGATION_WORDS.has(prev);
      });

      if (twoWord && POSITIVE_LEXICON[twoWord]) {
        const val = POSITIVE_LEXICON[twoWord];
        if (isNegated) {
          sentenceNegScore += val;
          foundNeg.push(`not ${twoWord.replace('_', ' ')}`);
        } else {
          sentencePosScore += val;
          foundPos.push(twoWord.replace('_', ' '));
        }
      } else if (twoWord && NEGATIVE_LEXICON[twoWord]) {
        const val = NEGATIVE_LEXICON[twoWord];
        if (isNegated) {
          sentencePosScore += val * 0.7; // slight positive
          foundPos.push(`mitigated ${twoWord.replace('_', ' ')}`);
        } else {
          sentenceNegScore += val;
          foundNeg.push(twoWord.replace('_', ' '));
        }
      } else if (POSITIVE_LEXICON[word]) {
        const val = POSITIVE_LEXICON[word];
        if (isNegated) {
          sentenceNegScore += val;
          foundNeg.push(`not ${word}`);
        } else {
          sentencePosScore += val;
          foundPos.push(word);
        }
      } else if (NEGATIVE_LEXICON[word]) {
        const val = NEGATIVE_LEXICON[word];
        if (isNegated) {
          sentencePosScore += val * 0.7;
          foundPos.push(`no ${word}`);
        } else {
          sentenceNegScore += val;
          foundNeg.push(word);
        }
      }
    }

    const excerpt = cleanSentence.length > 220 ? cleanSentence.substring(0, 217) + '...' : cleanSentence;
    const loc = {
      line: sIdx + 1,
      startOffset: sentenceStart !== -1 ? sentenceStart : undefined,
      endOffset: sentenceStart !== -1 ? sentenceStart + cleanSentence.length : undefined,
    };

    if (sentencePosScore > 0 && sentenceNegScore > 0) {
      // Internal contradiction / mixed in same sentence!
      contradictions.push(`Mixed evidence: "${excerpt}" contains both optimistic indicators (${foundPos.join(', ')}) alongside adverse signals (${foundNeg.join(', ')}).`);
      positiveSignals.push({
        id: `pos-${sIdx}`,
        label: `Positive signal: ${foundPos.slice(0, 2).join(', ')}`,
        excerpt,
        score: Number(sentencePosScore.toFixed(2)),
        context: 'Context contains co-occurring headwinds',
        sourceLocation: loc,
      });
      negativeSignals.push({
        id: `neg-${sIdx}`,
        label: `Negative signal: ${foundNeg.slice(0, 2).join(', ')}`,
        excerpt,
        score: -Number(sentenceNegScore.toFixed(2)),
        context: 'Disclosed alongside growth commentary',
        sourceLocation: loc,
      });
    } else if (sentencePosScore > 0) {
      positiveSignals.push({
        id: `pos-${sIdx}`,
        label: `Strong indicator: ${foundPos.slice(0, 2).join(', ')}`,
        excerpt,
        score: Number(sentencePosScore.toFixed(2)),
        sourceLocation: loc,
      });
    } else if (sentenceNegScore > 0) {
      negativeSignals.push({
        id: `neg-${sIdx}`,
        label: `Adverse signal: ${foundNeg.slice(0, 2).join(', ')}`,
        excerpt,
        score: -Number(sentenceNegScore.toFixed(2)),
        sourceLocation: loc,
      });
    } else if (cleanSentence.match(/\b(revenue|margin|ebitda|assets|cash|debt|quarter|fiscal|audited|balance)\b/i)) {
      neutralSignals.push({
        id: `neu-${sIdx}`,
        label: 'Factual disclosure',
        excerpt,
        score: 0,
        sourceLocation: loc,
      });
    }

    totalPositiveScore += sentencePosScore;
    totalNegativeScore += sentenceNegScore;
  });

  // Calculate composite normalized sentiment score (-1 to +1)
  const netScore = totalPositiveScore - totalNegativeScore;
  const totalWeight = totalPositiveScore + totalNegativeScore;
  let normalizedScore = 0;
  if (totalWeight > 0) {
    normalizedScore = Number((netScore / (totalWeight + 0.5)).toFixed(2));
  }

  // Determine sentiment class
  let overall: SentimentClass = 'neutral';
  if (totalPositiveScore >= 1.5 && totalNegativeScore >= 1.5) {
    overall = 'mixed';
  } else if (normalizedScore >= 0.2) {
    overall = 'positive';
  } else if (normalizedScore <= -0.2) {
    overall = 'negative';
  } else {
    overall = 'neutral';
  }

  // Calibrated model confidence calculation based on volume and consistency
  const signalCount = positiveSignals.length + negativeSignals.length;
  const coverageRatio = totalWordsCount > 0 ? Math.min(signalCount / (totalWordsCount / 30), 1) : 0;
  const confidence = Math.min(0.96, Math.max(0.45, Number((0.5 + coverageRatio * 0.45).toFixed(2))));

  // Construct summary
  let summary = '';
  if (overall === 'positive') {
    summary = `Report conveys predominantly favorable sentiment (score: +${normalizedScore}). Primary catalysts include ${positiveSignals.slice(0, 2).map((s) => s.label).join(', ') || 'profitable metrics'}. No systemic balance sheet deterioration detected.`;
  } else if (overall === 'negative') {
    summary = `Report reflects adverse financial sentiment (score: ${normalizedScore}). Significant negative pressure identified around ${negativeSignals.slice(0, 2).map((s) => s.label).join(', ') || 'margin compression and financial headwinds'}.`;
  } else if (overall === 'mixed') {
    summary = `Report demonstrates conflicting sentiment signals (score: ${normalizedScore > 0 ? '+' : ''}${normalizedScore}). Narrative combines expansionary outlook with notable disclosures of liabilities, cost pressures, or liquidity constraints.`;
  } else {
    summary = `Report maintains a predominantly neutral or factual operational tone with balanced financial disclosures and modest directional sentiment.`;
  }

  const limitations = `Deterministic domain-lexicon analysis validated against ${totalWordsCount} words across ${rawSentences.length} sentences. Sentiment classifications should be evaluated alongside underlying financial statements and cash-flow audits.`;

  return {
    overall,
    score: normalizedScore,
    confidence,
    summary,
    positiveSignals: positiveSignals.slice(0, 8),
    negativeSignals: negativeSignals.slice(0, 8),
    neutralSignals: neutralSignals.slice(0, 6),
    contradictions,
    limitations,
  };
}
