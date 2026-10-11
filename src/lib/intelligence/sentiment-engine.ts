import {
  SentimentClass,
  SentimentResult,
  SentimentSignal,
  EpistemicCertainty,
  AspectSentiment,
  AspectTopic,
  EntitySentiment,
} from '../types';

// Financial-specific sentiment terms with Loughran-McDonald domain weighting
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
  outstanding: 0.9,
  excellent: 0.85,
  speed: 0.6,
  fast: 0.6,
  satisfied: 0.7,
  exceptional: 0.85,
  reliable: 0.75,
  innovative: 0.7,
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
  frustrating: 0.75,
  frustrated: 0.75,
  confusing: 0.65,
  confused: 0.65,
  delayed: 0.7,
  delay: 0.7,
  unresponsive: 0.8,
  broken: 0.75,
  poor: 0.7,
};

const NEGATION_WORDS = new Set([
  'not',
  'no',
  'never',
  'neither',
  'nor',
  'hardly',
  'barely',
  'scarcely',
  'unable',
  'failed',
  'fails',
  'failing',
  'without',
  'lack',
  'lacks',
  'lacking',
]);

// Loughran-McDonald Uncertainty & Hedging Lexicon
const UNCERTAINTY_LEXICON = new Set([
  'anticipate',
  'anticipates',
  'anticipated',
  'assume',
  'assumes',
  'assumed',
  'assumption',
  'assumptions',
  'believe',
  'believes',
  'believed',
  'contingent',
  'contingency',
  'contingencies',
  'depend',
  'depends',
  'dependent',
  'depending',
  'estimate',
  'estimates',
  'estimated',
  'expect',
  'expects',
  'expected',
  'expectations',
  'fluctuate',
  'fluctuates',
  'fluctuating',
  'forecast',
  'forecasts',
  'forecasted',
  'hope',
  'hopes',
  'hoped',
  'intend',
  'intends',
  'intended',
  'intention',
  'may',
  'might',
  'could',
  'perhaps',
  'possible',
  'possibly',
  'potential',
  'potentially',
  'predict',
  'predicts',
  'projected',
  'projection',
  'projections',
  'preliminary',
  'probable',
  'probably',
  'risk',
  'risks',
  'risky',
  'subject',
  'speculate',
  'speculative',
  'uncertain',
  'uncertainty',
  'uncertainties',
  'unclear',
  'unpredictable',
  'variable',
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
      uncertaintyScore: 0,
      hedgedSignals: [],
      informationGaps: [],
    };
  }

  // Segment into sentences without splitting on decimals
  const rawSentences = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"']|$)/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [text.trim()];

  const positiveSignals: SentimentSignal[] = [];
  const negativeSignals: SentimentSignal[] = [];
  const neutralSignals: SentimentSignal[] = [];
  const hedgedSignals: SentimentSignal[] = [];
  const contradictions: string[] = [];

  let totalPositiveScore = 0;
  let totalNegativeScore = 0;
  let totalWordsCount = 0;
  let totalHedgedSentencesCount = 0;

  let currentOffset = 0;

  sentences.forEach((sentence, sIdx) => {
    const cleanSentence = sentence.trim();
    if (cleanSentence.length < 5) return;

    const sentenceStart = text.indexOf(sentence, currentOffset);
    if (sentenceStart !== -1) currentOffset = sentenceStart + sentence.length;

    const words = cleanSentence
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    totalWordsCount += words.length;

    // Detect uncertainty & hedging in this sentence
    const foundHedging = words.filter((w) => UNCERTAINTY_LEXICON.has(w));
    const isHedged = foundHedging.length > 0;
    if (isHedged) totalHedgedSentencesCount++;

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

    const excerpt =
      cleanSentence.length > 220 ? cleanSentence.substring(0, 217) + '...' : cleanSentence;
    const loc = {
      line: sIdx + 1,
      startOffset: sentenceStart !== -1 ? sentenceStart : undefined,
      endOffset: sentenceStart !== -1 ? sentenceStart + cleanSentence.length : undefined,
    };

    const epistemicCertainty: EpistemicCertainty = isHedged
      ? 'hedged_projection'
      : sentencePosScore > 0 && sentenceNegScore > 0
      ? 'ambiguous_disclosure'
      : 'documented_fact';

    if (sentencePosScore > 0 && sentenceNegScore > 0) {
      // Internal contradiction / mixed in same sentence
      contradictions.push(
        `Mixed evidence: "${excerpt}" contains both optimistic indicators (${foundPos.join(', ')}) alongside adverse signals (${foundNeg.join(', ')}).`
      );
      positiveSignals.push({
        id: `pos-${sIdx}`,
        label: `Positive signal: ${foundPos.slice(0, 2).join(', ')}`,
        excerpt,
        score: Number(sentencePosScore.toFixed(2)),
        context: 'Context contains co-occurring headwinds',
        epistemicCertainty,
        hedgingTerms: isHedged ? Array.from(new Set(foundHedging)) : undefined,
        sourceLocation: loc,
      });
      negativeSignals.push({
        id: `neg-${sIdx}`,
        label: `Negative signal: ${foundNeg.slice(0, 2).join(', ')}`,
        excerpt,
        score: -Number(sentenceNegScore.toFixed(2)),
        context: 'Disclosed alongside growth commentary',
        epistemicCertainty,
        hedgingTerms: isHedged ? Array.from(new Set(foundHedging)) : undefined,
        sourceLocation: loc,
      });
    } else if (sentencePosScore > 0) {
      positiveSignals.push({
        id: `pos-${sIdx}`,
        label: `Positive indicator: ${foundPos.slice(0, 2).join(', ')}`,
        excerpt,
        score: Number(sentencePosScore.toFixed(2)),
        epistemicCertainty,
        hedgingTerms: isHedged ? Array.from(new Set(foundHedging)) : undefined,
        sourceLocation: loc,
      });
    } else if (sentenceNegScore > 0) {
      negativeSignals.push({
        id: `neg-${sIdx}`,
        label: `Adverse signal: ${foundNeg.slice(0, 2).join(', ')}`,
        excerpt,
        score: -Number(sentenceNegScore.toFixed(2)),
        epistemicCertainty,
        hedgingTerms: isHedged ? Array.from(new Set(foundHedging)) : undefined,
        sourceLocation: loc,
      });
    } else if (
      cleanSentence.match(
        /\b(revenue|margin|ebitda|assets|cash|debt|quarter|fiscal|audited|balance)\b/i
      )
    ) {
      neutralSignals.push({
        id: `neu-${sIdx}`,
        label: 'Factual disclosure',
        excerpt,
        score: 0,
        epistemicCertainty: 'documented_fact',
        sourceLocation: loc,
      });
    }

    // Explicitly catalog hedged claims for analyst investigation
    if (
      isHedged &&
      (sentencePosScore > 0 ||
        sentenceNegScore > 0 ||
        cleanSentence.match(/\b(guidance|outlook|target|plan|aim|expect|anticipate|estimate)\b/i))
    ) {
      hedgedSignals.push({
        id: `hedge-${sIdx}`,
        label: `Hedged claim (${foundHedging.slice(0, 2).join(', ')})`,
        excerpt,
        score: Number((sentencePosScore - sentenceNegScore).toFixed(2)),
        epistemicCertainty: 'hedged_projection',
        hedgingTerms: Array.from(new Set(foundHedging)),
        sourceLocation: loc,
      });
    }

    totalPositiveScore += sentencePosScore;
    totalNegativeScore += sentenceNegScore;
  });

  // Net normalized score bounded between -1 and 1
  const rawDifference = totalPositiveScore - totalNegativeScore;
  const maxPossible = Math.max(totalPositiveScore + totalNegativeScore, 1);
  const normalizedScore = Number((rawDifference / maxPossible).toFixed(2));

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
  const confidence = Math.min(
    0.96,
    Math.max(0.45, Number((0.5 + coverageRatio * 0.45).toFixed(2)))
  );

  // Uncertainty Barometer Score (0-100)
  const uncertaintyScore =
    sentences.length > 0
      ? Math.min(100, Math.round((totalHedgedSentencesCount / sentences.length) * 100))
      : 0;

  // Synthesize verifiable information gaps
  const informationGaps: string[] = [];
  if (uncertaintyScore >= 25) {
    informationGaps.push(
      `Prevalence of conditional language (${totalHedgedSentencesCount} hedged statements, ${uncertaintyScore}% uncertainty index). Forward-looking statements rely on conditions without citing committed order backlog.`
    );
  }
  if (
    positiveSignals.length > 0 &&
    !positiveSignals.some((s) => /\b\d+(?:\.\d+)?%?|\$\d+/i.test(s.excerpt))
  ) {
    informationGaps.push(
      'Optimistic operational claims lack quantitative baseline metrics (no specific dollar revenue figures or margin percentage baselines cited in excerpted sentences).'
    );
  }
  if (contradictions.length > 0) {
    informationGaps.push(
      `${contradictions.length} divergent disclosures indicate conflicting internal assessments between top-line optimism and adverse footnote conditions.`
    );
  }

  // Construct summary explaining both findings and uncertainty
  let summary = '';
  if (overall === 'positive') {
    summary = `Report conveys predominantly favorable sentiment (score: +${normalizedScore}, confidence: ${Math.round(confidence * 100)}%). Primary positive catalysts include ${positiveSignals.slice(0, 2).map((s) => s.label).join(', ') || 'profitable metrics'}. ${uncertaintyScore > 20 ? `Note: ${uncertaintyScore}% of sentences contain forward-looking caveats that warrant cross-examination.` : 'Disclosures reflect high factual grounding.'}`;
  } else if (overall === 'negative') {
    summary = `Report reflects adverse financial sentiment (score: ${normalizedScore}, confidence: ${Math.round(confidence * 100)}%). Significant negative disclosures identified around ${negativeSignals.slice(0, 2).map((s) => s.label).join(', ') || 'margin compression and financial headwinds'}.`;
  } else if (overall === 'mixed') {
    summary = `Report demonstrates conflicting sentiment signals (score: ${normalizedScore > 0 ? '+' : ''}${normalizedScore}). Narrative combines expansionary outlook with notable disclosures of liabilities, cost pressures, or liquidity constraints. Direct inquiry recommended.`;
  } else {
    summary = `Report maintains a predominantly neutral or factual operational tone with balanced financial disclosures and modest directional sentiment.`;
  }

  const limitations = `Deterministic Loughran-McDonald lexicon analysis validated against ${totalWordsCount} words across ${sentences.length} sentences (${uncertaintyScore}% uncertainty index). Signal classifications reflect textual representations and must be corroborated against cash flow statements and auditor notes.`;

  // Aspect-Based Sentiment Analysis (ABSA) Taxonomy
  const aspectTaxonomy: Record<
    AspectTopic,
    { label: string; keywords: RegExp }
  > = {
    product_quality: {
      label: 'Product Quality & Reliability',
      keywords: /\b(product|quality|features|performance|defect|defects|bug|bugs|stability|durability|reliable|reliability|build|craftsmanship)\b/i,
    },
    service_support: {
      label: 'Customer Support & Service',
      keywords: /\b(support|service|representative|agent|helpdesk|ticket|response\s+time|resolution|assistance|care|staff)\b/i,
    },
    pricing_value: {
      label: 'Pricing & Value Proposition',
      keywords: /\b(price|pricing|cost|costs|expensive|overpriced|affordable|fee|fees|subscription|rate|rates|discount|value\s+for\s+money)\b/i,
    },
    delivery_fulfillment: {
      label: 'Delivery & Fulfillment',
      keywords: /\b(delivery|deliveries|shipping|shipment|fulfillment|transit|delayed|delays|timely|tracking|on-time|package|logistics)\b/i,
    },
    billing_payments: {
      label: 'Billing & Payment Experience',
      keywords: /\b(billing|bill|invoice|invoices|charged|charge|overcharged|refund|refunds|payment|payments|credit\s+card|transaction|dispute)\b/i,
    },
    management_execution: {
      label: 'Management Execution & Governance',
      keywords: /\b(management|executive|executives|leadership|board|guidance|strategy|execution|capital\s+allocation|governance)\b/i,
    },
    financial_performance: {
      label: 'Financial Metrics & Earnings',
      keywords: /\b(revenue|profit|profitability|margin|earnings|cash\s+flow|ebitda|income|dividend|balance\s+sheet|liquidity|solvency)\b/i,
    },
    operational_stability: {
      label: 'Operational Stability & Infrastructure',
      keywords: /\b(operational|operations|system|systems|outage|downtime|uptime|infrastructure|capacity|supply\s+chain|vendor|supplier)\b/i,
    },
  };

  const aspectScores: Partial<Record<AspectTopic, { pos: number; neg: number; count: number; excerpts: string[] }>> = {};

  // Sub-clause segmentation (splitting on "but", "however", "while", "although", "yet", commas, semicolons)
  const clauses: string[] = [];
  sentences.forEach((sentence) => {
    const parts = sentence.split(/\b(?:but|however|while|although|yet|whereas)\b|;/i);
    parts.forEach((p) => {
      const clean = p.trim();
      if (clean.length > 3) clauses.push(clean);
    });
  });

  clauses.forEach((clause) => {
    const sLower = clause.toLowerCase();
    const clauseWords = sLower.replace(/[^a-z0-9_\s-]/g, ' ').split(/\s+/).filter(Boolean);

    // Score clause polarity
    let cPos = 0;
    let cNeg = 0;
    clauseWords.forEach((w, wIdx) => {
      let isNegated = false;
      for (let i = Math.max(0, wIdx - 3); i < wIdx; i++) {
        if (NEGATION_WORDS.has(clauseWords[i])) isNegated = true;
      }
      if (POSITIVE_LEXICON[w]) {
        if (isNegated) cNeg += POSITIVE_LEXICON[w];
        else cPos += POSITIVE_LEXICON[w];
      }
      if (NEGATIVE_LEXICON[w]) {
        if (isNegated) cPos += NEGATIVE_LEXICON[w];
        else cNeg += NEGATIVE_LEXICON[w];
      }
    });

    // Check which aspects are mentioned in this specific clause
    (Object.keys(aspectTaxonomy) as AspectTopic[]).forEach((topic) => {
      const def = aspectTaxonomy[topic];
      if (def.keywords.test(clause)) {
        if (!aspectScores[topic]) {
          aspectScores[topic] = { pos: 0, neg: 0, count: 0, excerpts: [] };
        }
        aspectScores[topic]!.pos += cPos;
        aspectScores[topic]!.neg += cNeg;
        aspectScores[topic]!.count += 1;
        if (aspectScores[topic]!.excerpts.length < 3) {
          aspectScores[topic]!.excerpts.push(clause.trim());
        }
      }
    });
  });

  const aspects: AspectSentiment[] = (Object.keys(aspectScores) as AspectTopic[]).map((topic) => {
    const data = aspectScores[topic]!;
    const net = data.pos - data.neg;
    const maxVal = Math.max(data.pos + data.neg, 1);
    const score = Number((net / maxVal).toFixed(2));
    let sentiment: SentimentClass = 'neutral';
    if (data.pos >= 1 && data.neg >= 1) sentiment = 'mixed';
    else if (score >= 0.15) sentiment = 'positive';
    else if (score <= -0.15) sentiment = 'negative';

    return {
      topic,
      topicLabel: aspectTaxonomy[topic].label,
      sentiment,
      score,
      mentionCount: data.count,
      excerpts: data.excerpts,
    };
  });

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
    uncertaintyScore,
    hedgedSignals: hedgedSignals.slice(0, 8),
    informationGaps,
    aspects,
  };
}
