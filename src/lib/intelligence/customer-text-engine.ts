import {
  CustomerTextResult,
  CustomerIssueCluster,
  RiskSeverity,
  SentimentClass,
} from '../types';

interface IssueRule {
  id: string;
  category: string;
  label: string;
  keywords: RegExp;
  baseSeverity: RiskSeverity;
  isEscalation: boolean;
  isCancellation: boolean;
  isBillingDispute: boolean;
}

const CUSTOMER_ISSUE_TAXONOMY: IssueRule[] = [
  // 1. Explicit Churn & Cancellation Intent
  {
    id: 'cancellation_churn',
    category: 'customer_churn',
    label: 'Customer Cancellation & Churn Intent',
    keywords: /\b(cancel|cancelling|cancelled|cancellation|switching\s+to|taking\s+my\s+business|closing\s+my\s+account|terminated\s+(?:contract|subscription)|unsubscribed)\b/i,
    baseSeverity: 'high',
    isEscalation: true,
    isCancellation: true,
    isBillingDispute: false,
  },
  // 2. Billing & Overcharge Disputes
  {
    id: 'billing_overcharge',
    category: 'billing_disputes',
    label: 'Billing Discrepancy & Unauthorized Charges',
    keywords: /\b(overcharged|double\s+charged|unauthorized\s+charge|hidden\s+fee|incorrect\s+invoice|billing\s+error|refuse\s+to\s+refund|refund\s+denied|disputed\s+charge)\b/i,
    baseSeverity: 'high',
    isEscalation: false,
    isCancellation: false,
    isBillingDispute: true,
  },
  // 3. Escalations & Legal / Regulatory Threats
  {
    id: 'escalation_legal',
    category: 'regulatory_compliance',
    label: 'Escalation to Management or Legal Complaint',
    keywords: /\b(speak\s+to\s+(?:a\s+manager|supervisor)|lawyer|legal\s+action|small\s+claims|better\s+business\s+bureau|bbb|consumer\s+protection|sec\s+complaint|attorney)\b/i,
    baseSeverity: 'critical',
    isEscalation: true,
    isCancellation: false,
    isBillingDispute: false,
  },
  // 4. Repeated Service Outages & Downtime
  {
    id: 'service_unreliability',
    category: 'operational_disruption',
    label: 'Platform Outage & Service Instability',
    keywords: /\b(down\s+again|system\s+crash|platform\s+offline|server\s+error|unusable|keeps\s+crashing|downtime|outage|unreliable)\b/i,
    baseSeverity: 'high',
    isEscalation: false,
    isCancellation: false,
    isBillingDispute: false,
  },
  // 5. Unresponsive Support & Unresolved Tickets
  {
    id: 'unresponsive_support',
    category: 'customer_dissatisfaction',
    label: 'Unresponsive Customer Support',
    keywords: /\b(no\s+response|ignored\s+my\s+(?:email|ticket)|waiting\s+(?:for\s+days|weeks)|unhelpful\s+support|ghosted|automated\s+response\s+only)\b/i,
    baseSeverity: 'medium',
    isEscalation: false,
    isCancellation: false,
    isBillingDispute: false,
  },
  // 6. Product Defects & Broken Features
  {
    id: 'product_defect',
    category: 'product_quality',
    label: 'Product Defect or Regression',
    keywords: /\b(broken\s+feature|buggy|defect|regression|stopped\s+working|flawed\s+update|poor\s+quality)\b/i,
    baseSeverity: 'medium',
    isEscalation: false,
    isCancellation: false,
    isBillingDispute: false,
  },
];

/**
 * Normalizes customer text by splitting into individual customer messages/reviews.
 * Extracts customer feedback, complaint categories, and escalation indicators.
 * Prevents copy-pasted or duplicate messages from falsely inflating customer churn counts.
 */
export function analyzeCustomerTextFeedback(text: string): CustomerTextResult {
  if (!text || text.trim().length === 0) {
    return {
      totalMessagesAnalyzed: 0,
      distinctCustomersIdentified: 0,
      dominantSentiment: 'neutral',
      cancellationIntentCount: 0,
      billingDisputeCount: 0,
      escalationCount: 0,
      issueClusters: [],
      repeatedIssuesSummary: 'No customer text provided.',
    };
  }

  // Split into individual messages (either by delimiter, bullet, or paragraphs)
  const rawMessages = text
    .split(/\n{2,}|\n(?=[0-9]+\.|\*|-|Customer\s+[A-Za-z0-9]+:|Review\s+[0-9]+:)/)
    .map((m) => m.trim())
    .filter((m) => m.length > 10);

  const messages = rawMessages.length > 0 ? rawMessages : [text.trim()];

  // Deduplicate identical customer messages to avoid false corroboration
  const seenMessages = new Set<string>();
  const uniqueMessages: string[] = [];

  messages.forEach((msg) => {
    // Strip prefix markers like "Customer 1:", "Review 2:", etc. to compare actual body content
    const cleanedBody = msg.replace(/^(?:Customer\s+[A-Za-z0-9]+:|Review\s+[0-9]+:|[0-9]+\.|\*|-)\s*/i, '');
    const normalized = cleanedBody.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenMessages.has(normalized)) {
      seenMessages.add(normalized);
      uniqueMessages.push(msg);
    }
  });

  const totalMessagesAnalyzed = messages.length;
  const distinctCustomersIdentified = uniqueMessages.length;

  let cancellationIntentCount = 0;
  let billingDisputeCount = 0;
  let escalationCount = 0;

  // Track cluster matches
  const clusterCounts: Record<
    string,
    { rule: IssueRule; frequency: number; distinctSources: Set<string>; excerpts: string[] }
  > = {};

  uniqueMessages.forEach((msg, idx) => {
    let msgHasCancellation = false;
    let msgHasBilling = false;
    let msgHasEscalation = false;

    CUSTOMER_ISSUE_TAXONOMY.forEach((rule) => {
      if (rule.keywords.test(msg)) {
        if (!clusterCounts[rule.id]) {
          clusterCounts[rule.id] = {
            rule,
            frequency: 0,
            distinctSources: new Set(),
            excerpts: [],
          };
        }
        clusterCounts[rule.id].frequency++;
        clusterCounts[rule.id].distinctSources.add(`msg-${idx + 1}`);
        if (clusterCounts[rule.id].excerpts.length < 3) {
          clusterCounts[rule.id].excerpts.push(msg.slice(0, 180));
        }

        if (rule.isCancellation) msgHasCancellation = true;
        if (rule.isBillingDispute) msgHasBilling = true;
        if (rule.isEscalation) msgHasEscalation = true;
      }
    });

    if (msgHasCancellation) cancellationIntentCount++;
    if (msgHasBilling) billingDisputeCount++;
    if (msgHasEscalation) escalationCount++;
  });

  const issueClusters: CustomerIssueCluster[] = Object.values(clusterCounts).map((c) => ({
    id: c.rule.id,
    category: c.rule.category,
    label: c.rule.label,
    frequency: c.frequency,
    distinctSourcesCount: c.distinctSources.size,
    severity: c.rule.baseSeverity,
    isEscalated: c.rule.isEscalation,
    hasCancellationIntent: c.rule.isCancellation,
    representativeExcerpts: c.excerpts,
  }));

  // Sort clusters by frequency descending
  issueClusters.sort((a, b) => b.frequency - a.frequency);

  // Dominant sentiment across customer batch
  let dominantSentiment: SentimentClass = 'neutral';
  if (cancellationIntentCount + billingDisputeCount > uniqueMessages.length * 0.4) {
    dominantSentiment = 'negative';
  } else if (issueClusters.length === 0) {
    dominantSentiment = 'positive';
  } else {
    dominantSentiment = 'mixed';
  }

  // Construct summary
  let repeatedIssuesSummary = '';
  if (issueClusters.length === 0) {
    repeatedIssuesSummary = `Analyzed ${distinctCustomersIdentified} unique customer messages. No systemic recurring complaint clusters detected.`;
  } else {
    const topClusters = issueClusters.slice(0, 2).map((c) => `${c.label} (${c.frequency} reports)`);
    repeatedIssuesSummary = `Analyzed ${distinctCustomersIdentified} distinct customer reports (from ${totalMessagesAnalyzed} raw records). Primary issue clusters: ${topClusters.join(', ')}. ${cancellationIntentCount > 0 ? `Detected ${cancellationIntentCount} explicit churn/cancellation risks.` : ''}`;
  }

  return {
    totalMessagesAnalyzed,
    distinctCustomersIdentified,
    dominantSentiment,
    cancellationIntentCount,
    billingDisputeCount,
    escalationCount,
    issueClusters,
    repeatedIssuesSummary,
  };
}
