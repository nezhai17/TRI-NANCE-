import { RiskCategory, RiskFinding, RiskResult, RiskSeverity } from '../types';

interface RiskRule {
  category: RiskCategory;
  categoryLabel: string;
  pattern: RegExp;
  title: string;
  baseSeverity: RiskSeverity;
  classification: 'explicitly_stated' | 'inferred' | 'requiring_verification';
  explanationGenerator: (matchText: string) => string;
  rationaleGenerator: (matchText: string) => string;
  impactGenerator: (matchText: string) => string;
  nextStepsGenerator: () => string[];
}

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  liquidity_cash_flow: 'Liquidity & Cash Flow Risk',
  debt_leverage: 'Debt & Leverage Structure',
  revenue_earnings_pressure: 'Revenue & Earnings Pressure',
  expense_margin_deterioration: 'Expense Growth & Margin Deterioration',
  customer_churn_confidence: 'Customer Churn & Confidence',
  late_payments_collections: 'Late Payments & Collections',
  operational_disruption: 'Operational Disruption',
  supply_chain_dependency: 'Supply Chain Dependency',
  regulatory_compliance: 'Regulatory & Compliance Concerns',
  fraud_inconsistencies: 'Potential Inconsistencies & Irregularities',
  reputational_risk: 'Reputational Risk',
  business_continuity: 'Business Continuity & Going Concern',
};

const RISK_RULES: RiskRule[] = [
  // 1. Liquidity & Cash Flow
  {
    category: 'liquidity_cash_flow',
    categoryLabel: CATEGORY_LABELS.liquidity_cash_flow,
    pattern: /\b(?:cash\s+runway\s+(?:under|less\s+than|below)\s+\d+|declining\s+cash\s+reserves|operating\s+cash\s+flow\s+(?:deficit|negative)|cash\s+burn\s+accelerat(?:ed|ing)|insufficient\s+working\s+capital|unable\s+to\s+meet\s+short-term\s+obligations)\b/i,
    title: 'Acute Cash Burn & Liquidity Strain',
    baseSeverity: 'high',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Discloses immediate liquidity constraints or accelerating cash burn (${match}) that threaten operating solvency.`,
    rationaleGenerator: () => `Materiality is severe because near-term obligations cannot be sustained without external capital injection or emergency credit facilities.`,
    impactGenerator: () => `Potential inability to meet vendor obligations or debt service covenants within the next 3 to 6 months.`,
    nextStepsGenerator: () => [
      'Conduct 13-week rolling cash flow forecast.',
      'Audit working capital requirements and defer discretionary capital expenditures.',
      'Engage secondary lending syndicates for emergency revolving credit extension.'
    ],
  },
  // 2. Debt & Leverage
  {
    category: 'debt_leverage',
    categoryLabel: CATEGORY_LABELS.debt_leverage,
    pattern: /\b(?:covenant\s+breach|breached\s+(?:debt|loan)\s+covenants?|debt\s+to\s+equity\s+(?:exceeding|ratio\s+above)|heavily\s+leveraged|refinancing\s+risk|upcoming\s+debt\s+maturity|credit\s+rating\s+downgrade)\b/i,
    title: 'Elevated Leverage & Debt Covenant Exposure',
    baseSeverity: 'critical',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Highlights critical leverage vulnerability or impending debt covenant non-compliance (${match}).`,
    rationaleGenerator: () => `Covenant default triggers cross-acceleration across existing senior facilities, creating systemic refinancing risk.`,
    impactGenerator: () => `Creditors may demand immediate principal prepayment or penal interest rate escalations.`,
    nextStepsGenerator: () => [
      'Review credit agreement cure periods and request formal lender waivers.',
      'Assess debt restructuring alternatives and maturity ladder extensions.',
      'Model debt service coverage ratio (DSCR) under stressed EBITDA scenarios.'
    ],
  },
  // 3. Revenue & Earnings Pressure
  {
    category: 'revenue_earnings_pressure',
    categoryLabel: CATEGORY_LABELS.revenue_earnings_pressure,
    pattern: /\b(?:revenue\s+(?:decline|contracted|fell\s+by|plunged)|declining\s+earnings|missed\s+(?:revenue|earnings)\s+guidance|top-line\s+contraction|slowdown\s+in\s+customer\s+demand|slumping\s+sales)\b/i,
    title: 'Top-Line Contraction & Earnings Vulnerability',
    baseSeverity: 'medium',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Identifies negative growth trajectory or downward earnings revision (${match}).`,
    rationaleGenerator: () => `Sustained revenue contraction depresses operating leverage and compromises enterprise valuation.`,
    impactGenerator: () => `Compressed operating margins and negative analyst re-rating.`,
    nextStepsGenerator: () => [
      'Segment churn and cohort retention by product line.',
      'Re-examine pricing elasticity and promotional discounts.',
      'Review sales pipeline conversion rates and pipeline velocity.'
    ],
  },
  // 4. Expense Growth & Margin Deterioration
  {
    category: 'expense_margin_deterioration',
    categoryLabel: CATEGORY_LABELS.expense_margin_deterioration,
    pattern: /\b(?:margin\s+compression|gross\s+margin\s+(?:eroded|dropped|contracted)|operating\s+expenses\s+outpac(?:ed|ing)|cost\s+inflation|spiraling\s+costs|sg&a\s+increased\s+substantially)\b/i,
    title: 'Operating Margin Compression & Cost Inflation',
    baseSeverity: 'medium',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Notes deterioration of gross or operating margins caused by runaway expenditures or input cost inflation (${match}).`,
    rationaleGenerator: () => `Operating cost escalation outstrips top-line realization, eroding bottom-line profitability.`,
    impactGenerator: () => `Shrinking free cash flow conversion and diminished reinvestment capacity.`,
    nextStepsGenerator: () => [
      'Perform line-item OPEX variance audit across business units.',
      'Renegotiate vendor contracts and introduce procurement threshold freezes.',
      'Automate high-cost manual processing workflows.'
    ],
  },
  // 5. Customer Churn & Confidence
  {
    category: 'customer_churn_confidence',
    categoryLabel: CATEGORY_LABELS.customer_churn_confidence,
    pattern: /\b(?:customer\s+churn\s+(?:spiked|accelerated|increased)|loss\s+of\s+key\s+clients?|client\s+defections?|declining\s+nps|customer\s+retention\s+(?:fell|dropped)|contract\s+non-renewal)\b/i,
    title: 'Customer Churn & Enterprise Client Attrition',
    baseSeverity: 'high',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Reveals escalating customer defections or non-renewal of significant enterprise accounts (${match}).`,
    rationaleGenerator: () => `Elevated churn erodes recurring revenue baseline and increases customer acquisition cost (CAC) payback periods.`,
    impactGenerator: () => `Persistent multi-quarter revenue drag and market share concession to competitors.`,
    nextStepsGenerator: () => [
      'Execute customer health score audits for top 20% revenue-generating accounts.',
      'Investigate primary cancellation reasons via executive outreach.',
      'Implement proactive SLA monitoring and customer success intervention programs.'
    ],
  },
  // 6. Late Payments & Collections
  {
    category: 'late_payments_collections',
    categoryLabel: CATEGORY_LABELS.late_payments_collections,
    pattern: /\b(?:overdue\s+receivables|delayed\s+collections|dso\s+(?:increased|lengthened)|days\s+sales\s+outstanding\s+rose|uncollectible\s+accounts|provision\s+for\s+bad\s+debts?|client\s+payment\s+delays)\b/i,
    title: 'DSO Extension & Counterparty Collection Delays',
    baseSeverity: 'medium',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Reports growing days sales outstanding (DSO) or surge in overdue customer receivables (${match}).`,
    rationaleGenerator: () => `Aging accounts receivable tie up operating cash in working capital and elevate default loss exposure.`,
    impactGenerator: () => `Cash drag and mandatory provision write-downs against aged ledger balances.`,
    nextStepsGenerator: () => [
      'Enforce stricter credit evaluation limits on delayed accounts.',
      'Introduce early payment discounting (e.g. 2/10 net 30).',
      'Escalate past-due accounts over 60 days to dedicated collection protocol.'
    ],
  },
  // 7. Operational Disruption
  {
    category: 'operational_disruption',
    categoryLabel: CATEGORY_LABELS.operational_disruption,
    pattern: /\b(?:service\s+outage|production\s+halt|operational\s+(?:bottleneck|downtime|breakdown)|unplanned\s+shutdown|facility\s+interruption|system\s+failure)\b/i,
    title: 'Core Operational Downtime & Service Interruption',
    baseSeverity: 'high',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Documents structural operational bottlenecks or unplanned downtime (${match}) impacting delivery.`,
    rationaleGenerator: () => `Core facility or infrastructure downtime immediately jeopardizes customer SLAs and contractual warranties.`,
    impactGenerator: () => `Direct contractual liquidated damages and loss of client trust.`,
    nextStepsGenerator: () => [
      'Initiate root-cause engineering review and disaster failover testing.',
      'Establish secondary redundant cloud and operational nodes.',
      'Verify business interruption insurance policy limits.'
    ],
  },
  // 8. Supply Chain Dependency
  {
    category: 'supply_chain_dependency',
    categoryLabel: CATEGORY_LABELS.supply_chain_dependency,
    pattern: /\b(?:sole-source\s+supplier|single\s+vendor\s+dependency|supply\s+chain\s+(?:bottleneck|chokepoint|disruption)|material\s+shortages?|component\s+delay|supplier\s+insolvency)\b/i,
    title: 'Concentrated Vendor Dependency & Supply Chokepoints',
    baseSeverity: 'high',
    classification: 'inferred',
    explanationGenerator: (match) => `Uncovers vulnerability to single-source suppliers or critical material procurement chokepoints (${match}).`,
    rationaleGenerator: () => `A single-point supplier breakdown halts manufacturing or service fulfillment without immediate alternative sourcing.`,
    impactGenerator: () => `Severe lead time elongation, unfulfilled purchase orders, and inventory stock-outs.`,
    nextStepsGenerator: () => [
      'Qualify dual-sourcing secondary suppliers across tier-1 materials.',
      'Maintain strategic safety stock buffers for critical components.',
      'Audit financial health and solvency ratings of primary suppliers.'
    ],
  },
  // 9. Regulatory & Compliance
  {
    category: 'regulatory_compliance',
    categoryLabel: CATEGORY_LABELS.regulatory_compliance,
    pattern: /\b(?:regulatory\s+(?:investigation|sanction|inquiry)|sec\s+(?:probe|investigation)|doj\s+subpoena|fined\s+by\s+regulators|non-compliance\s+with\s+(?:gdpr|sox|sec|finra)|license\s+revocation|compliance\s+violation)\b/i,
    title: 'Regulatory Enforcement & Compliance Inquiries',
    baseSeverity: 'critical',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Discloses formal regulatory inquiries, enforcement actions, or statutory non-compliance (${match}).`,
    rationaleGenerator: () => `Regulatory sanctions carry substantial financial penalties, legal expenses, and potential operational restrictions.`,
    impactGenerator: () => `Substantial penalty assessments, operating license suspension, and mandatory structural remediation.`,
    nextStepsGenerator: () => [
      'Retain specialized regulatory counsel to oversee agency engagement.',
      'Perform thorough internal compliance audit and preserve audit trails.',
      'Prepare disclosure strategy for stakeholder and shareholder communication.'
    ],
  },
  // 10. Fraud & Inconsistencies
  {
    category: 'fraud_inconsistencies',
    categoryLabel: CATEGORY_LABELS.fraud_inconsistencies,
    pattern: /\b(?:accounting\s+irregularit(?:y|ies)|unsupported\s+transactions|whistleblower\s+allegation|discrepanc(?:y|ies)\s+in\s+financials|restatement\s+of\s+earnings|audit\s+qualification|material\s+weakness\s+in\s+internal\s+controls)\b/i,
    title: 'Internal Control Material Weakness & Financial Inconsistency',
    baseSeverity: 'critical',
    classification: 'requiring_verification',
    explanationGenerator: (match) => `Flags accounting inconsistencies, internal control deficiencies, or restatements (${match}).`,
    rationaleGenerator: () => `Internal control failures create significant uncertainty around financial statement accuracy and management representations.`,
    impactGenerator: () => `Loss of capital market confidence, credit rating downgrades, and potential forensic investigations.`,
    nextStepsGenerator: () => [
      'Form independent audit committee investigation team.',
      'Commission external forensic accounting review.',
      'Remediate internal control gaps under COSO framework standards.'
    ],
  },
  // 11. Reputational Risk
  {
    category: 'reputational_risk',
    categoryLabel: CATEGORY_LABELS.reputational_risk,
    pattern: /\b(?:public\s+backlash|negative\s+media\s+coverage|boycott|brand\s+damage|executive\s+misconduct|scandal|public\s+relations\s+crisis)\b/i,
    title: 'Reputational Brand Damage & Stakeholder Scrutiny',
    baseSeverity: 'medium',
    classification: 'inferred',
    explanationGenerator: (match) => `Cites widespread negative public exposure or corporate governance controversies (${match}).`,
    rationaleGenerator: () => `Damaged brand reputation impairs consumer trust, employee retention, and enterprise sales conversions.`,
    impactGenerator: () => `Depressed conversion rates, commercial partner hesitance, and higher cost of customer acquisition.`,
    nextStepsGenerator: () => [
      'Deploy rapid crisis communications and transparent stakeholder briefing.',
      'Conduct stakeholder sentiment tracking across key client accounts.',
      'Address core cultural or governance root causes transparently.'
    ],
  },
  // 12. Business Continuity & Going Concern
  {
    category: 'business_continuity',
    categoryLabel: CATEGORY_LABELS.business_continuity,
    pattern: /\b(?:substantial\s+doubt\s+about\s+(?:the\s+)?(?:company(?:'s)?)?\s*ability\s+to\s+continue\s+as\s+a\s+going\s+concern|going\s+concern\s+(?:warning|doubt|uncertainty|opinion)|going\s+concern|insolvency\s+proceedings|winding\s+up|threat\s+to\s+business\s+viability|cease\s+operations)\b/i,
    title: 'Going Concern Warning & Solvency Threat',
    baseSeverity: 'critical',
    classification: 'explicitly_stated',
    explanationGenerator: (match) => `Contains explicit auditor or management disclosures questioning going-concern viability (${match}).`,
    rationaleGenerator: () => `Represents the most acute stage of enterprise risk, indicating imminent operational collapse without radical capital intervention.`,
    impactGenerator: () => `Immediate covenant liquidation, equity wipeout risk, and supplier credit withdrawal.`,
    nextStepsGenerator: () => [
      'Engage specialized turnaround advisors and insolvency counsel.',
      'Formulate contingency liquidation or chapter reorganization plans.',
      'Explore urgent distressed M&A or debt-for-equity recapitalization options.'
    ],
  },
];

export function analyzeFinancialRisks(text: string): { findings: RiskFinding[]; summary: RiskResult } {
  if (!text || text.trim().length === 0) {
    return {
      findings: [],
      summary: {
        overallRiskScore: 0,
        highestSeverity: 'low',
        openFindingsCount: 0,
        severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        categoryDistribution: {},
        summary: 'No content available for risk pattern analysis.',
      },
    };
  }

  const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
  const rawSentences = text.match(sentenceRegex) || [text];

  const findings: RiskFinding[] = [];
  const categoryCounts: Partial<Record<RiskCategory, number>> = {};
  const severityDistribution: Record<RiskSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let offsetTracker = 0;

  rawSentences.forEach((sentence, sIdx) => {
    const cleanSentence = sentence.trim();
    if (cleanSentence.length < 10) return;

    const sentenceStart = text.indexOf(sentence, offsetTracker);
    if (sentenceStart !== -1) offsetTracker = sentenceStart + sentence.length;

    RISK_RULES.forEach((rule) => {
      const match = cleanSentence.match(rule.pattern);
      if (match) {
        // Matched a real pattern in source text!
        const matchedTerm = match[0];
        const excerpt = cleanSentence.length > 250 ? cleanSentence.substring(0, 247) + '...' : cleanSentence;

        // Contextual severity calibration: check if mitigated in sentence
        let severity = rule.baseSeverity;
        const isMitigated = /\b(managed|hedged|contained|mitigated|offset|temporary|resolved|waiver\s+granted)\b/i.test(cleanSentence);
        if (isMitigated && severity === 'critical') severity = 'high';
        else if (isMitigated && severity === 'high') severity = 'medium';

        // Check if multiple matching flags exist in same sentence to escalate
        const isCompounded = /\b(furthermore|substantially|drastic|unprecedented|immediate|severe)\b/i.test(cleanSentence);
        if (isCompounded && severity === 'medium') severity = 'high';

        const findingId = `risk-${rule.category}-${sIdx}-${findings.length + 1}`;

        findings.push({
          id: findingId,
          category: rule.category,
          categoryLabel: rule.categoryLabel,
          title: rule.title,
          excerpt,
          sourceLocation: {
            line: sIdx + 1,
            paragraph: Math.floor(sIdx / 3) + 1,
            startOffset: sentenceStart !== -1 ? sentenceStart : undefined,
            endOffset: sentenceStart !== -1 ? sentenceStart + cleanSentence.length : undefined,
          },
          explanation: rule.explanationGenerator(matchedTerm),
          severity,
          severityRationale: rule.rationaleGenerator(matchedTerm),
          confidence: rule.classification === 'explicitly_stated' ? 0.94 : 0.82,
          potentialImpact: rule.impactGenerator(matchedTerm),
          suggestedNextSteps: rule.nextStepsGenerator(),
          classification: rule.classification,
        });

        severityDistribution[severity]++;
        categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
      }
    });
  });

  // Calculate composite risk score (0-100)
  // critical = 30 pts each, high = 18 pts each, medium = 8 pts each, low = 3 pts each (capped at 100)
  const weightedRisk =
    severityDistribution.critical * 30 +
    severityDistribution.high * 18 +
    severityDistribution.medium * 8 +
    severityDistribution.low * 3;
  const overallRiskScore = Math.min(100, Math.round(weightedRisk));

  // Determine highest severity
  let highestSeverity: RiskSeverity = 'low';
  if (severityDistribution.critical > 0) highestSeverity = 'critical';
  else if (severityDistribution.high > 0) highestSeverity = 'high';
  else if (severityDistribution.medium > 0) highestSeverity = 'medium';
  else if (findings.length > 0) highestSeverity = 'low';

  let summaryText = '';
  if (highestSeverity === 'critical') {
    summaryText = `CRITICAL RISK PROFILE DETECTED: Platform uncovered ${findings.length} risk finding(s), with severe vulnerability in ${findings.filter(f => f.severity === 'critical').map(f => f.categoryLabel).slice(0, 2).join(' and ')}. Immediate management intervention required.`;
  } else if (highestSeverity === 'high') {
    summaryText = `ELEVATED RISK LEVEL: Identified ${findings.length} operational or financial risk pattern(s). Notable concentrations in ${findings.map(f => f.categoryLabel).slice(0, 2).join(', ')}. Liquidity and contractual terms warrant close surveillance.`;
  } else if (highestSeverity === 'medium') {
    summaryText = `MODERATE VULNERABILITY: ${findings.length} moderate risk signal(s) noted. Routine commercial or cyclical headwinds observed without immediate threat to financial solvency.`;
  } else if (findings.length > 0) {
    summaryText = `LOW RISK PROFILE: Minor disclosures recorded. No acute solvency, debt covenant, or regulatory threats identified.`;
  } else {
    summaryText = `CLEAN RISK RECORD: No systemic financial, operational, or compliance risk indicators were detected in the supplied text.`;
  }

  return {
    findings,
    summary: {
      overallRiskScore,
      highestSeverity,
      openFindingsCount: findings.length,
      severityDistribution,
      categoryDistribution: categoryCounts,
      summary: summaryText,
    },
  };
}
