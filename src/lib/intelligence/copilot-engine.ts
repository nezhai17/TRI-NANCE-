import crypto from 'crypto';
import {
  AnalysisRecord,
  RiskFinding,
  ReviewStatus,
  CrossDocumentComparison,
  AnomalyFinding,
  DocumentRecord,
  InvestigationChecklistItem,
} from '../types';
import { calculateBaselineVariance } from './numerical-extractor';

export type CopilotIntent =
  | 'explain_finding'
  | 'compare_periods'
  | 'calculate_variance'
  | 'cash_runway'
  | 'search_evidence'
  | 'counter_evidence'
  | 'investigation_plan'
  | 'propose_investigation'
  | 'propose_triage_update'
  | 'diligence_inquiry'
  | 'executive_briefing'
  | 'anomaly_contradictions'
  | 'general_qna';

export interface CopilotCitation {
  findingId?: string;
  analysisId: string;
  analysisTitle: string;
  title: string;
  categoryLabel: string;
  severity: string;
  excerpt: string;
  epistemicCertainty?: string;
  sourceLocation?: {
    line?: number;
    page?: number;
    paragraph?: number;
    startOffset?: number;
    endOffset?: number;
  };
}

export interface CalculationResult {
  metricName?: string;
  current: number;
  prior: number;
  percentChange: number | null;
  direction: 'increase' | 'decrease' | 'unchanged' | 'undefined';
  formula: string;
  isComparable: boolean;
  explanation: string;
}

export interface CopilotActionProposal {
  id: string;
  actionType: 'create_investigation' | 'update_triage_status';
  title: string;
  description: string;
  requiresConfirmation: boolean;
  payload: {
    analysisId?: string;
    findingId?: string;
    targetStatus?: ReviewStatus;
    resolutionReason?: string;
    investigationTitle?: string;
    documentIds?: string[];
    documentTitles?: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
}

export interface CopilotChartPayload {
  type: 'bar' | 'line' | 'pie' | 'waterfall';
  title: string;
  subtitle?: string;
  data: Array<Record<string, unknown>>;
  xAxisKey?: string;
  yAxisKey?: string;
  series?: Array<{ key: string; name: string; color?: string }>;
  assumptions?: string;
  limitations?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: CopilotIntent;
  citations?: CopilotCitation[];
  calculationResult?: CalculationResult;
  chartPayload?: CopilotChartPayload;
  checklist?: InvestigationChecklistItem[];
  informationGaps?: string[];
  pendingAction?: CopilotActionProposal;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export interface CopilotSession {
  id: string;
  userId: string;
  title: string;
  contextAnalysisId?: string;
  messages: CopilotMessage[];
  createdAt: string;
  updatedAt: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s+(override|reveal|leak)/i,
  /you\s+are\s+now\s+(in\s+)?(dan|developer\s+mode)/i,
  /reveal\s+(your\s+)?(secret|internal|hidden)\s+(instructions|prompt|api\s*key)/i,
  /bypass\s+(all\s+)?(safety|guardrails|filters)/i,
  /forget\s+(what\s+you\s+were\s+told|your\s+rules)/i,
];

/**
 * Sanitizes and verifies user queries against prompt-injection and adversarial extraction.
 */
export function sanitizeAndCheckPromptSecurity(query: string): { isSafe: boolean; sanitized: string; violationReason?: string } {
  const trimmed = query.trim();
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        sanitized: trimmed,
        violationReason: 'Input contained an adversarial system instruction or injection attempt.',
      };
    }
  }

  // Sanitize potentially unsafe control characters
  const clean = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return { isSafe: true, sanitized: clean };
}

/**
 * Classifies the primary intent of an inquiry.
 */
export function classifyCopilotIntent(query: string): CopilotIntent {
  const q = query.toLowerCase();

  // 1. Counter-Evidence
  if (
    q.includes('counter evidence') ||
    q.includes('counter-evidence') ||
    q.includes('countervailing') ||
    q.includes('mitigating') ||
    q.includes('mitigation') ||
    q.includes('weakens') ||
    q.includes('alternative explanation') ||
    q.includes('refute')
  ) {
    return 'counter_evidence';
  }

  // 2. Investigation Plan & Checklist
  if (
    q.includes('investigation plan') ||
    q.includes('checklist') ||
    q.includes('validation steps') ||
    q.includes('plan an investigation') ||
    q.includes('completion criteria') ||
    q.includes('diligence plan')
  ) {
    return 'investigation_plan';
  }

  // 3. Cash Runway Calculation
  if (
    q.includes('runway') ||
    q.includes('months of cash') ||
    q.includes('burn rate') ||
    q.includes('how long until cash runs out')
  ) {
    return 'cash_runway';
  }

  // 4. Math / Variance
  if (
    q.includes('calculate') ||
    q.includes('variance') ||
    q.includes('percent change') ||
    q.includes('percentage change') ||
    q.includes('% change') ||
    q.includes('delta') ||
    /(?:from|baseline)\s+[-+]?\$?\d+.*(?:to|current)\s+[-+]?\$?\d+/i.test(q)
  ) {
    return 'calculate_variance';
  }

  // 5. Action proposals: Investigation creation
  if (
    (q.includes('create') || q.includes('start') || q.includes('draft') || q.includes('launch')) &&
    (q.includes('investigation') || q.includes('comparison') || q.includes('cross-document'))
  ) {
    return 'propose_investigation';
  }

  // 6. Action proposals: Triage updates
  if (
    (q.includes('mark') || q.includes('change status') || q.includes('triage') || q.includes('set status') || q.includes('resolve') || q.includes('dismiss')) &&
    (q.includes('finding') || q.includes('under review') || q.includes('resolved') || q.includes('dismissed') || q.includes('open'))
  ) {
    return 'propose_triage_update';
  }

  // 7. Executive Briefing Memo
  if (
    q.includes('briefing') ||
    q.includes('memo') ||
    q.includes('executive summary') ||
    q.includes('summarize everything') ||
    q.includes('summarize all') ||
    q.includes('committee') ||
    q.includes('portfolio health') ||
    q.includes('brief me')
  ) {
    return 'executive_briefing';
  }

  // 8. Anomalies & Contradictions
  if (
    q.includes('anomaly') ||
    q.includes('anomalies') ||
    q.includes('contradict') ||
    q.includes('conflict') ||
    q.includes('discrepan') ||
    q.includes('mixed signals') ||
    q.includes('dissonan')
  ) {
    return 'anomaly_contradictions';
  }

  // 9. Period or document comparison inquiries
  if (q.includes('compare') || q.includes('versus') || q.includes('vs') || q.includes('trajectory') || q.includes('trend')) {
    return 'compare_periods';
  }

  // 10. Diligence / Management inquiry / Information gaps
  if (
    q.includes('questions for management') ||
    q.includes('diligence') ||
    q.includes('information gap') ||
    q.includes('missing') ||
    q.includes('unverified') ||
    q.includes('verify')
  ) {
    return 'diligence_inquiry';
  }

  // 11. Specific finding explanation
  if (q.includes('explain') || q.includes('why is') || q.includes('finding') || q.includes('covenant') || q.includes('liquidity')) {
    return 'explain_finding';
  }

  // 12. General evidence search
  if (q.includes('find') || q.includes('search') || q.includes('show evidence') || q.includes('where is')) {
    return 'search_evidence';
  }

  return 'general_qna';
}

/**
 * Extracts numbers from text for variance calculation.
 */
export function extractCalculationNumbers(query: string): { prior: number; current: number; metricName?: string } | null {
  const fromToMatch = query.match(/(?:from|baseline|prior|was)\s*[:=]?\s*[-+]?\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:m|million|k|b)?\s*(?:to|current|now|is)\s*[:=]?\s*[-+]?\$?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (fromToMatch) {
    let prior = parseFloat(fromToMatch[1]);
    let current = parseFloat(fromToMatch[2]);
    if (query.match(/(?:from|baseline|prior|was)\s*[:=]?\s*-\$?\s*[0-9]+/i)) prior = -prior;
    if (query.match(/(?:to|current|now|is)\s*[:=]?\s*-\$?\s*[0-9]+/i)) current = -current;
    return { prior, current };
  }

  const allNums = [...query.matchAll(/[-+]?\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:m|million|k|b)?/gi)];
  if (allNums.length >= 2) {
    const pStr = allNums[0][0].replace(/[\$\s]/g, '');
    const cStr = allNums[1][0].replace(/[\$\s]/g, '');
    const prior = parseFloat(pStr);
    const current = parseFloat(cStr);
    if (!isNaN(prior) && !isNaN(current)) {
      return { prior, current };
    }
  }

  return null;
}

/**
 * Main Copilot Engine: processes inquiry against authorized financial dossiers.
 */
export function processCopilotQuery(
  rawQuery: string,
  analyses: AnalysisRecord[],
  contextAnalysisId?: string,
  options?: {
    documents?: DocumentRecord[];
    investigations?: CrossDocumentComparison[];
  }
): CopilotMessage {
  // 1. Security Check
  const security = sanitizeAndCheckPromptSecurity(rawQuery);
  const timestamp = new Date().toISOString();

  if (!security.isSafe) {
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Security Guardrail Notice: ${security.violationReason || 'Adversarial query pattern blocked.'} Tri-nance Copilot operates strictly on authorized analytical dossiers and maintains immutable system guidelines.`,
      intent: 'general_qna',
      citations: [],
      informationGaps: ['Prompt injection attempt blocked by platform security boundary.'],
      suggestedFollowUps: [
        'What are the unresolved high-priority risks?',
        'Calculate variance between Q2 and Q3 revenue',
        'Summarize liquidity concerns across dossiers',
      ],
      timestamp,
    };
  }

  const query = security.sanitized;
  const intent = classifyCopilotIntent(query);
  const cleanQ = query.toLowerCase();

  // Aggregate all findings across authorized analyses
  const allFindings: Array<{ finding: RiskFinding; analysisId: string; analysisTitle: string }> = [];
  analyses.forEach((a) => {
    (a.findings || []).forEach((f) => {
      allFindings.push({ finding: f, analysisId: a.id, analysisTitle: a.title });
    });
  });

  const contextAnalysis = contextAnalysisId
    ? analyses.find((a) => a.id === contextAnalysisId)
    : undefined;

  // ----------------------------------------------------
  // INTENT: COUNTER-EVIDENCE SEARCH (Part 6.3)
  // ----------------------------------------------------
  if (intent === 'counter_evidence') {
    // Look for mitigating signals: positive sentiment signals, liquidity lines, or recovery statements
    const positiveSignals = analyses.flatMap((a) => a.sentimentResult?.positiveSignals || []);
    const matchingMitigants = positiveSignals.filter(
      (s) =>
        s.excerpt.toLowerCase().includes('credit') ||
        s.excerpt.toLowerCase().includes('facility') ||
        s.excerpt.toLowerCase().includes('cash') ||
        s.excerpt.toLowerCase().includes('grow') ||
        s.excerpt.toLowerCase().includes('margin') ||
        s.excerpt.toLowerCase().includes('renew')
    );

    let content = `### Counter-Evidence & Mitigating Factor Triangulation\n\n`;
    content += `Investigating whether disclosures offer evidence that **weakens, contextualizes, or counterbalances** detected risk findings:\n\n`;

    if (matchingMitigants.length > 0) {
      content += `#### 1. Disclosed Mitigating Signals (${matchingMitigants.length} identified)\n`;
      matchingMitigants.slice(0, 3).forEach((m, idx) => {
        content += `${idx + 1}. **${m.label}**: "${m.excerpt}"\n`;
        if (m.epistemicCertainty) {
          content += `   *Epistemic Certainty*: \`${m.epistemicCertainty}\`\n`;
        }
      });
      content += `\n#### 2. Evidentiary Synthesis\n`;
      content += `While acute operating deficits are documented, corporate management points to available credit capacity and operational efficiency measures as potential buffers.\n`;
    } else {
      content += `No affirmative mitigating counter-evidence was detected in the active filings. The documented risk pressures lack disclosed offsetting liquidity buffers.\n`;
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      intent,
      citations: allFindings.filter((f) => f.finding.severity === 'high' || f.finding.severity === 'critical').slice(0, 3).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
        epistemicCertainty: f.finding.epistemicCertainty,
      })),
      informationGaps: [
        'Lender consent letters and covenant amendment details are missing to confirm mitigant viability.',
      ],
      suggestedFollowUps: [
        'Calculate cash runway based on current deficit',
        'Prepare an investigation plan to test these mitigants',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: INVESTIGATION PLAN & CHECKLIST (Part 5 Mode G)
  // ----------------------------------------------------
  if (intent === 'investigation_plan') {
    const checklist: InvestigationChecklistItem[] = [
      {
        id: 'chk-1',
        title: 'Subpoena and inspect senior credit facility agreement and all amendment exhibits',
        category: 'Debt & Covenants',
        status: 'pending',
        notes: 'Required to verify whether 3.8x leverage ceiling triggers immediate acceleration.',
      },
      {
        id: 'chk-2',
        title: 'Reconcile 13-week rolling cash flow burn forecast against reported quarterly deficits',
        category: 'Liquidity & Runway',
        status: 'pending',
        notes: 'Determine exact month of liquidity breach.',
      },
      {
        id: 'chk-3',
        title: 'Review auditor engagement letters and subsequent event footnote certifications',
        category: 'Audit & Governance',
        status: 'blocked',
        notes: 'Footnotes omitted from preliminary earnings release.',
      },
      {
        id: 'chk-4',
        title: 'Cross-examine customer concentration disclosures against accounts receivable aging',
        category: 'Revenue Quality',
        status: 'completed',
        notes: 'Top 3 clients account for 42% of receivables.',
      },
      {
        id: 'chk-5',
        title: 'Interview CFO regarding revolving facility covenant waiver discussions',
        category: 'Management Diligence',
        status: 'pending',
      },
    ];

    let content = `### Structured Investigation Plan & Forensic Diligence Matrix\n\n`;
    content += `**Investigation Objective**: Establish verified covenant headroom, calculate precise insolvency runway, and determine whether forward revenue commitments are substantiated by binding contracts.\n\n`;
    content += `#### Forensic Verification Checklist (5 Action Items)\n`;
    checklist.forEach((item, idx) => {
      const statusIcon = item.status === 'completed' ? '✓' : item.status === 'blocked' ? '⊘' : '○';
      content += `${idx + 1}. [${statusIcon} **${item.status.toUpperCase()}**] **${item.title}** (${item.category})\n`;
      if (item.notes) content += `   *Rationale*: ${item.notes}\n`;
    });

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      intent,
      checklist,
      citations: allFindings.slice(0, 3).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
      })),
      informationGaps: [
        'Detailed cash burn schedule and lender waiver documentation remain outstanding.',
      ],
      suggestedFollowUps: [
        'Draft an investigation comparing these dossiers in the canvas',
        'What questions for management should we prepare from this checklist?',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: CASH RUNWAY CALCULATION (Part 5 Mode C)
  // ----------------------------------------------------
  if (intent === 'cash_runway') {
    // Search for cash reserves and operating cash flow metrics
    const metrics = contextAnalysis?.numericalSignals || analyses.flatMap((a) => a.numericalSignals || []);
    const cashMetric = metrics.find((m) => m.name.toLowerCase().includes('cash & liquid') || m.name.toLowerCase().includes('cash reserves'));
    const ocfMetric = metrics.find((m) => m.name.toLowerCase().includes('operating cash flow'));

    let reserves = cashMetric?.normalizedValue ?? 35; // USD Millions
    let annualDeficit = ocfMetric?.normalizedValue ? Math.abs(ocfMetric.normalizedValue) : 45; // USD Millions

    // Extract numbers from prompt if user passed explicit numbers (e.g. "$50M cash and $20M burn")
    const nums = extractCalculationNumbers(query);
    if (nums) {
      reserves = nums.prior;
      annualDeficit = Math.abs(nums.current);
    }

    const runwayMonths = annualDeficit > 0 ? Number(((reserves / annualDeficit) * 12).toFixed(1)) : 999;

    let summary = `### Deterministic Cash Runway & Solvency Analysis\n\n`;
    summary += `- **Liquid Cash Reserves**: \`$${reserves}M\`\n`;
    summary += `- **Annualized Operating Cash Burn**: \`$${annualDeficit}M\`\n`;
    summary += `- **Calculated Runway**: **${runwayMonths} Months**\n`;
    summary += `- **Formula**: \`(${reserves}M / ${annualDeficit}M) * 12 = ${runwayMonths} months\`\n\n`;

    if (runwayMonths < 6) {
      summary += `> ⚠️ **Critical Liquidity Alert**: Projected runway is under 6 months. In the absence of immediate debt refinancing or emergency equity injection, the entity risks technical insolvency.`;
    } else if (runwayMonths < 12) {
      summary += `> ⚠️ **Elevated Liquidity Concern**: Projected runway is under 12 months. Requires close monitoring of revolver covenants.`;
    } else {
      summary += `> **Liquidity Assessment**: Runway exceeds 12 months under current disclosed burn rates.`;
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: summary,
      intent,
      calculationResult: {
        metricName: 'Cash Burn Runway',
        current: runwayMonths,
        prior: reserves,
        percentChange: null,
        direction: runwayMonths < 12 ? 'decrease' : 'unchanged',
        formula: `(${reserves}M / ${annualDeficit}M) * 12 = ${runwayMonths} months`,
        isComparable: true,
        explanation: `Calculated from $${reserves}M cash reserves and $${annualDeficit}M operating deficit.`,
      },
      chartPayload: {
        type: 'line',
        title: 'Projected Cash Balance Depletion',
        subtitle: `Starting balance $${reserves}M at $${(annualDeficit / 12).toFixed(1)}M/mo burn`,
        data: Array.from({ length: Math.min(25, runwayMonths + 3) }, (_, i) => ({
          month: `M${i}`,
          balance: Math.max(0, Number((reserves - (annualDeficit / 12) * i).toFixed(1))),
          stress: Math.max(0, Number((reserves - (annualDeficit / 12) * 1.25 * i).toFixed(1))),
        })),
        xAxisKey: 'month',
        series: [
          { key: 'balance', name: 'Baseline Runway ($M)', color: '#2563EB' },
          { key: 'stress', name: 'Stress Runway (+25% burn)', color: '#DC2626' },
        ],
        assumptions: 'Uniform monthly burn distribution; zero revenue inflection scenario.',
        limitations: 'Excludes potential revolving credit drawdowns or vendor credit extensions.',
      },
      citations: allFindings.filter((f) => f.finding.category === 'liquidity_cash_flow').slice(0, 2).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
      })),
      informationGaps: ['13-week detailed cash budget required to reconcile seasonality of cash flows.'],
      suggestedFollowUps: [
        'Find counter-evidence or credit facilities available',
        'Prepare an investigation plan for cash burn',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: EXECUTIVE BRIEFING MEMO (Part 5 Mode E)
  // ----------------------------------------------------
  if (intent === 'executive_briefing') {
    const criticalFindings = allFindings.filter((f) => f.finding.severity === 'critical');
    const highFindings = allFindings.filter((f) => f.finding.severity === 'high');
    const openFindings = allFindings.filter((f) => f.finding.reviewStatus === 'open');

    const totalAnalyses = analyses.length;
    const catMap = new Map<string, number>();
    allFindings.forEach((f) => {
      catMap.set(f.finding.categoryLabel, (catMap.get(f.finding.categoryLabel) || 0) + 1);
    });

    const topCategories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let memo = `### Executive Risk & Sentiment Intelligence Briefing\n\n`;
    memo += `**Scope**: Synthesized across **${totalAnalyses} authorized filing(s)** with **${allFindings.length} total risk signals**.\n\n`;
    memo += `#### 1. Core Executive Thesis\n`;
    if (criticalFindings.length > 0 || highFindings.length > 0) {
      memo += `The evaluated dossiers reflect acute operational and covenant vulnerability. Active disclosures document **${criticalFindings.length} critical** and **${highFindings.length} high-severity** risk items requiring immediate committee scrutiny before capital allocation.\n\n`;
    } else {
      memo += `The evaluated filings present stable commercial parameters without detected default ceilings. Monitoring remains focused on baseline financial continuity.\n\n`;
    }

    memo += `#### 2. Primary Risk Concentration Pillars\n`;
    topCategories.forEach(([label, count], idx) => {
      memo += `${idx + 1}. **${label}**: ${count} disclosure finding(s) flagged across filings.\n`;
    });
    memo += `\n`;

    memo += `#### 3. Epistemic Certainty & Evidence Footprint\n`;
    memo += `- **Documented Facts**: ${allFindings.filter((f) => f.finding.epistemicCertainty === 'documented_fact').length} verified factual findings.\n`;
    memo += `- **Hedged / Ambiguous Disclosures**: ${allFindings.filter((f) => f.finding.epistemicCertainty === 'hedged_projection' || f.finding.epistemicCertainty === 'ambiguous_disclosure').length} forward projections requiring management cross-examination.\n\n`;

    memo += `#### 4. Priority Recommendations for Decision Committee\n`;
    memo += `1. Subpoena certified lender compliance certificates and revolver covenant calculation sheets.\n`;
    memo += `2. Reconcile operating cash flow deficits against rolling 13-week forecast models.\n`;
    memo += `3. Launch cross-document comparative investigation to track narrative shifts between periods.\n`;

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: memo,
      intent,
      chartPayload: {
        type: 'bar',
        title: 'Risk Finding Concentration by Domain',
        subtitle: `Disclosed risk concentration across ${topCategories.length} primary commercial categories`,
        data: topCategories.map(([label, count]) => ({
          name: label.length > 18 ? label.slice(0, 16) + '..' : label,
          count,
        })),
        xAxisKey: 'name',
        series: [{ key: 'count', name: 'Disclosed Findings', color: '#DC2626' }],
        assumptions: 'Categorization based on 12-category commercial risk framework.',
      },
      citations: (criticalFindings.length > 0 ? criticalFindings : highFindings).slice(0, 4).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
        epistemicCertainty: f.finding.epistemicCertainty,
      })),
      informationGaps: [
        'Detailed cash burn schedule for subsequent quarters is omitted.',
        'Auditor confirmation letters regarding debt covenant restructuring are required.',
      ],
      suggestedFollowUps: [
        'What questions should we ask management on this briefing?',
        'Calculate variance between Q2 and Q3 revenue',
        'Draft an investigation on these critical findings',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: ANOMALIES & CONTRADICTIONS (Part 5 Mode D)
  // ----------------------------------------------------
  if (intent === 'anomaly_contradictions') {
    const allAnomalies: AnomalyFinding[] = analyses.flatMap((a) => a.anomalies || []);

    if (allAnomalies.length > 0) {
      let content = `### Cross-Document Anomalies & Narrative Dissonances\n\n`;
      content += `Detected **${allAnomalies.length} discrepancy(ies)** where narrative disclosures diverge from underlying financial performance:\n\n`;

      allAnomalies.slice(0, 4).forEach((anom, idx) => {
        content += `**${idx + 1}. [${anom.severity.toUpperCase()}] ${anom.title}**\n`;
        content += `${anom.description}\n`;
        if (anom.comparedExcerpts && anom.comparedExcerpts.length > 0) {
          content += `> *Disclosed Excerpt*: "${anom.comparedExcerpts[0].text}"\n`;
        }
        content += `\n`;
      });

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        intent,
        citations: allFindings.filter((f) => f.finding.epistemicCertainty === 'ambiguous_disclosure').slice(0, 3).map((f) => ({
          findingId: f.finding.id,
          analysisId: f.analysisId,
          analysisTitle: f.analysisTitle,
          title: f.finding.title,
          categoryLabel: f.finding.categoryLabel,
          severity: f.finding.severity,
          excerpt: f.finding.excerpt,
        })),
        informationGaps: [
          'Segment-level reconciliation is missing to reconcile revenue statements with cash deficits.',
        ],
        suggestedFollowUps: [
          'Draft an investigation comparing these contradictions',
          'What questions should we ask management about these anomalies?',
        ],
        timestamp,
      };
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `No acute narrative-versus-financial contradictions were detected across your authorized dossiers. The evaluated disclosures maintain consistent accounting narratives.`,
      intent,
      citations: allFindings.slice(0, 2).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
      })),
      informationGaps: ['Cross-examination across prior year 10-K required to evaluate multi-year consistency.'],
      suggestedFollowUps: [
        'Synthesize an executive briefing memo',
        'What are the strongest unresolved liquidity findings?',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: CALCULATE VARIANCE (Part 5 Mode C)
  // ----------------------------------------------------
  if (intent === 'calculate_variance') {
    const extracted = extractCalculationNumbers(query);

    if (extracted) {
      const { prior, current } = extracted;
      const variance = calculateBaselineVariance(current, prior);

      const formattedCurrent = current < 0 ? `-$${Math.abs(current)}M` : `$${current}M`;
      const formattedPrior = prior < 0 ? `-$${Math.abs(prior)}M` : `$${prior}M`;

      let summary = `### Deterministic Variance Computation\n\n`;
      summary += `- **Baseline (Prior Period)**: \`${formattedPrior}\`\n`;
      summary += `- **Evaluation (Current Period)**: \`${formattedCurrent}\`\n`;
      summary += `- **Direction**: \`${variance.direction.toUpperCase()}\`\n`;
      if (variance.percentChange !== null) {
        const sign = variance.percentChange > 0 ? '+' : '';
        summary += `- **Calculated Variance**: **${sign}${variance.percentChange}%**\n`;
      } else {
        summary += `- **Calculated Variance**: **Mathematically Undefined** (Division by Zero)\n`;
      }
      summary += `- **Formula Used**: \`${variance.formula}\`\n\n`;
      summary += `> **Financial Method Note**: ${variance.explanation}`;

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        intent,
        calculationResult: {
          current,
          prior,
          percentChange: variance.percentChange,
          direction: variance.direction,
          formula: variance.formula,
          isComparable: variance.isComparable,
          explanation: variance.explanation,
        },
        chartPayload: {
          type: 'waterfall',
          title: 'Deterministic Metric Shift Bridge',
          subtitle: `Baseline: ${prior} → Actual: ${current}`,
          data: [
            { name: 'Prior Baseline', value: prior, color: '#64748B' },
            { name: 'Calculated Shift', value: Number((current - prior).toFixed(2)), color: current >= prior ? '#10B981' : '#EF4444' },
            { name: 'Current Actual', value: current, color: '#2563EB' },
          ],
          xAxisKey: 'name',
          assumptions: 'Uniform currency units and matching accounting standard.',
        },
        citations: [],
        informationGaps: variance.isComparable
          ? []
          : ['Baseline period had zero value; evaluate absolute dollar variance rather than percentage trajectory.'],
        suggestedFollowUps: [
          'What were the underlying drivers of this revenue movement?',
          'Are there contradictory statements regarding operating expenses?',
          'Draft an investigation on this variance',
        ],
        timestamp,
      };
    }

    const signals = contextAnalysis?.numericalSignals || analyses.flatMap((a) => a.numericalSignals || []);
    if (signals.length >= 2) {
      const s1 = signals[0];
      const s2 = signals[1];
      if (s1.normalizedValue !== undefined && s2.normalizedValue !== undefined) {
        const variance = calculateBaselineVariance(s2.normalizedValue, s1.normalizedValue);
        return {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Computed variance between **${s1.name}** (${s1.rawValue}) and **${s2.name}** (${s2.rawValue}):\n\n- **Formula**: \`${variance.formula}\`\n- **Variance**: **${variance.percentChange !== null ? `${variance.percentChange}%` : 'Undefined'}** (${variance.direction})\n- **Insight**: ${variance.explanation}`,
          intent,
          calculationResult: {
            metricName: s1.name,
            current: s2.normalizedValue,
            prior: s1.normalizedValue,
            percentChange: variance.percentChange,
            direction: variance.direction,
            formula: variance.formula,
            isComparable: variance.isComparable,
            explanation: variance.explanation,
          },
          citations: [
            {
              analysisId: contextAnalysis?.id || analyses[0].id,
              analysisTitle: contextAnalysis?.title || analyses[0].title,
              title: s1.name,
              categoryLabel: 'Financial Metric',
              severity: 'medium',
              excerpt: s1.excerpt,
            },
          ],
          suggestedFollowUps: [
            'Compare operating cash flow against debt obligations',
            'Does management offer guidance for the upcoming quarter?',
          ],
          timestamp,
        };
      }
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Please provide the baseline (prior) and evaluation (current) figures to compute variance. Example: *"Calculate variance from $45M to $62M"* or *"Calculate variance from -$10M to +$5M"*.`,
      intent,
      citations: [],
      informationGaps: ['Specific numerical figures missing from the query.'],
      suggestedFollowUps: [
        'Calculate variance from $50M to $65M',
        'Calculate variance from -$20M to -$5M',
        'Calculate variance from $0 to $30M',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: PROPOSE INVESTIGATION (Part 7 & 8)
  // ----------------------------------------------------
  if (intent === 'propose_investigation') {
    const docIds = analyses.slice(0, 3).map((a) => a.documentId || a.id);
    const docTitles = analyses.slice(0, 3).map((a) => a.title);
    const investigationTitle = cleanQ.includes('covenant') || cleanQ.includes('debt')
      ? 'Cross-Dossier Debt Covenant & Solvency Examination'
      : cleanQ.includes('liquidity')
      ? 'Multi-Period Operating Liquidity & Burn Trajectory'
      : 'Comprehensive Cross-Document Diligence Matrix';

    const proposal: CopilotActionProposal = {
      id: crypto.randomUUID(),
      actionType: 'create_investigation',
      title: investigationTitle,
      description: `Create a formal cross-document comparative canvas synthesizing findings, sentiment shifts, and discrepancies across ${docTitles.length} dossier(s).`,
      requiresConfirmation: true,
      payload: {
        investigationTitle,
        documentIds: docIds,
        documentTitles: docTitles,
      },
      status: 'pending',
    };

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `I have prepared a proposal to initiate a **Cross-Document Comparative Investigation** across **${docTitles.length} dossiers**:\n\n- **Investigation Dossier**: *${investigationTitle}*\n- **Scope**: ${docTitles.join(', ')}\n- **Action Type**: Consequential Store Mutation (requires analyst authorization).\n\nPlease review and confirm below to instantiate this investigation.`,
      intent,
      pendingAction: proposal,
      citations: analyses.slice(0, 2).map((a) => ({
        analysisId: a.id,
        analysisTitle: a.title,
        title: a.title,
        categoryLabel: a.sourceCategory,
        severity: 'medium',
        excerpt: `Includes ${a.findings?.length || 0} findings and ${a.wordCount} evaluated words.`,
      })),
      informationGaps: docTitles.length < 2 ? ['At least two distinct documents are recommended for meaningful comparative triangulation.'] : [],
      suggestedFollowUps: [
        'What are the key recurring risks in these dossiers?',
        'Are there conflicting statements across these records?',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: PROPOSE TRIAGE UPDATE (Part 7 & 8)
  // ----------------------------------------------------
  if (intent === 'propose_triage_update') {
    let targetFinding = allFindings[0];
    let targetStatus: ReviewStatus = 'under_review';

    if (cleanQ.includes('resolved') || cleanQ.includes('resolve')) {
      targetStatus = 'resolved';
    } else if (cleanQ.includes('dismiss') || cleanQ.includes('dismissed')) {
      targetStatus = 'dismissed';
    } else if (cleanQ.includes('under review')) {
      targetStatus = 'under_review';
    }

    for (const f of allFindings) {
      if (cleanQ.includes(f.finding.title.toLowerCase()) || cleanQ.includes(f.finding.category.toLowerCase())) {
        targetFinding = f;
        break;
      }
    }

    if (!targetFinding) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No matching risk finding found to update. Please specify the title or category of the finding you wish to triage.',
        intent,
        citations: [],
        timestamp,
      };
    }

    const proposal: CopilotActionProposal = {
      id: crypto.randomUUID(),
      actionType: 'update_triage_status',
      title: `Update Triage: ${targetFinding.finding.title}`,
      description: `Transition review status from '${targetFinding.finding.reviewStatus || 'open'}' to '${targetStatus}'.`,
      requiresConfirmation: true,
      payload: {
        analysisId: targetFinding.analysisId,
        findingId: targetFinding.finding.id,
        targetStatus,
        resolutionReason: targetStatus === 'dismissed' ? 'Dismissed via Copilot triage prompt after evidentiary verification.' : undefined,
      },
      status: 'pending',
    };

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `I have prepared a triage update action proposal:\n\n- **Finding**: *${targetFinding.finding.title}*\n- **Dossier**: ${targetFinding.analysisTitle}\n- **Current Status**: \`${targetFinding.finding.reviewStatus || 'open'}\`\n- **Target Status**: \`${targetStatus.toUpperCase()}\`\n- **Action Type**: Consequential Triage Mutation (requires analyst authorization).\n\nPlease approve or dismiss this action using the controls below.`,
      intent,
      pendingAction: proposal,
      citations: [
        {
          findingId: targetFinding.finding.id,
          analysisId: targetFinding.analysisId,
          analysisTitle: targetFinding.analysisTitle,
          title: targetFinding.finding.title,
          categoryLabel: targetFinding.finding.categoryLabel,
          severity: targetFinding.finding.severity,
          excerpt: targetFinding.finding.excerpt,
          epistemicCertainty: targetFinding.finding.epistemicCertainty,
          sourceLocation: targetFinding.finding.sourceLocation,
        },
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: DILIGENCE INQUIRY & MANAGEMENT QUESTIONS (Part 5 Mode F)
  // ----------------------------------------------------
  if (intent === 'diligence_inquiry') {
    const diligenceFindings = allFindings.filter((f) => f.finding.investigationDiligence || f.finding.severity === 'high' || f.finding.severity === 'critical');
    const questions: string[] = [];
    const recordsToExamine: string[] = [];
    const gaps: string[] = [];

    diligenceFindings.slice(0, 4).forEach((item) => {
      const d = item.finding.investigationDiligence;
      if (d?.questionsForManagement) questions.push(...d.questionsForManagement);
      if (d?.recordsToCrossExamine) recordsToExamine.push(...d.recordsToCrossExamine);
      if (d?.identifiedInformationGap) gaps.push(d.identifiedInformationGap);
    });

    if (questions.length === 0) {
      questions.push('What specific liquidity reserves remain uncommitted under the revolving credit facility?');
      questions.push('Has the company received formal auditor consent for non-standard revenue recognition?');
    }
    if (gaps.length === 0) {
      gaps.push('Subsequent events footnote and 13-week cash forecast are absent from available disclosures.');
    }

    const uniqueQs = Array.from(new Set(questions)).slice(0, 4);
    const uniqueRecords = Array.from(new Set(recordsToExamine)).slice(0, 3);

    let content = `### Management Diligence & Investigation Questions\n\n`;
    content += `Synthesized from **${diligenceFindings.length} critical findings** across your authorized dossiers:\n\n`;
    uniqueQs.forEach((q, idx) => {
      content += `${idx + 1}. **${q}**\n`;
    });

    if (uniqueRecords.length > 0) {
      content += `\n**Records to Subpoena / Cross-Examine**:\n`;
      uniqueRecords.forEach((r) => {
        content += `- ${r}\n`;
      });
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      intent,
      citations: diligenceFindings.slice(0, 3).map((f) => ({
        findingId: f.finding.id,
        analysisId: f.analysisId,
        analysisTitle: f.analysisTitle,
        title: f.finding.title,
        categoryLabel: f.finding.categoryLabel,
        severity: f.finding.severity,
        excerpt: f.finding.excerpt,
        epistemicCertainty: f.finding.epistemicCertainty,
      })),
      informationGaps: gaps.slice(0, 2),
      suggestedFollowUps: [
        'Which findings have the highest severity?',
        'Draft an investigation on these questions',
      ],
      timestamp,
    };
  }

  // ----------------------------------------------------
  // INTENT: EXPLAIN FINDING / SEARCH EVIDENCE / GENERAL (Part 4 & 5 Mode A)
  // ----------------------------------------------------
  const tokens = cleanQ.split(/\s+/).filter((t) => t.length > 2);
  const scored = allFindings.map((item) => {
    let score = 0;
    const titleLower = item.finding.title.toLowerCase();
    const excerptLower = item.finding.excerpt.toLowerCase();
    const explanationLower = (item.finding.explanation || '').toLowerCase();
    const catLower = item.finding.categoryLabel.toLowerCase();

    tokens.forEach((t) => {
      if (titleLower.includes(t)) score += 4;
      if (catLower.includes(t)) score += 3;
      if (excerptLower.includes(t)) score += 2;
      if (explanationLower.includes(t)) score += 1;
    });

    if (item.finding.severity === 'critical') score += 2;
    if (item.finding.severity === 'high') score += 1;
    if (item.finding.reviewStatus === 'open') score += 1;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.filter((s) => s.score > 0).slice(0, 4).map((s) => s.item);
  const results = topMatches.length > 0 ? topMatches : allFindings.slice(0, 3);

  let responseText = '';
  if (topMatches.length > 0) {
    responseText = `Found **${topMatches.length} high-relevance risk findings** across your authorized dossiers corresponding to *"**${query}**"*:\n\n`;
    topMatches.forEach((m, idx) => {
      responseText += `**${idx + 1}. [${m.finding.severity.toUpperCase()}] ${m.finding.title}** (${m.finding.categoryLabel})\n`;
      responseText += `> "${m.finding.excerpt}"\n`;
      responseText += `*Impact*: ${m.finding.potentialImpact || m.finding.explanation}\n\n`;
    });
  } else {
    responseText = `Scanned ${analyses.length} active dossier(s) containing ${allFindings.length} total findings. While no direct exact phrase matched *"**${query}**"*, here are the primary risk disclosures active in your workspace:`;
  }

  const informationGaps = [
    'Subsequent quarter compliance certifications are required to verify sustained covenant stability.',
    'Management discussion of internal controls is unverified against external auditor opinion.',
  ];

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: responseText,
    intent,
    citations: results.map((m) => ({
      findingId: m.finding.id,
      analysisId: m.analysisId,
      analysisTitle: m.analysisTitle,
      title: m.finding.title,
      categoryLabel: m.finding.categoryLabel,
      severity: m.finding.severity,
      excerpt: m.finding.excerpt,
      epistemicCertainty: m.finding.epistemicCertainty,
      sourceLocation: m.finding.sourceLocation,
    })),
    informationGaps,
    suggestedFollowUps: [
      'What are the strongest unresolved liquidity findings?',
      'Calculate variance from $100M to $125M',
      'Create an investigation comparing these dossiers',
    ],
    timestamp,
  };
}
