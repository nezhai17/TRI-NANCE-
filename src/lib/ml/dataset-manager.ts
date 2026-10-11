import { DatasetItem, MLTaskType, DatasetSplit, SentimentClass, RiskCategory } from '../types';
import fs from 'fs';
import path from 'path';

const DATASETS_DIR = path.join(process.cwd(), '.data', 'datasets');

// Curated financial datasets based on real SEC filings, Financial PhraseBank patterns, and commercial risk disclosures
export const DEFAULT_SENTIMENT_DATASET: Omit<DatasetItem, 'id'>[] = [
  // POSITIVE
  {
    text: "Operating revenue expanded by 18.4% year-over-year, driven by exceptional software subscription growth and margin expansion.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "financial_report",
    provenance: "SEC 10-K Consolidated Statements of Operations",
  },
  {
    text: "Free cash flow reached record levels of $420 million, allowing management to accelerate debt retirement and dividend returns.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "financial_report",
    provenance: "Annual Financial Review",
  },
  {
    text: "The company outperformed consensus quarterly expectations, delivering record earnings per share and positive operating leverage.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "earnings_call",
    provenance: "Q3 Earnings Conference Call Transcript",
  },
  {
    text: "Management successfully negotiated favorable loan refinancing terms, reducing annual interest expense by 140 basis points.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "management_writeup",
    provenance: "Treasury Management Memorandum",
  },
  {
    text: "Gross profit margins expanded 320 basis points as automation investments lowered unit production costs across all manufacturing facilities.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "financial_report",
    provenance: "Form 10-Q Item 2 MD&A",
  },
  {
    text: "Customer retention reached an all-time high of 98.2%, reflecting strong enterprise satisfaction and high platform engagement.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "customer_feedback",
    provenance: "SaaS Operational Cohort Summary",
  },
  {
    text: "Liquidity reserves remain robust with over $1.2 billion in cash equivalents and an undrawn revolving credit facility.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "financial_report",
    provenance: "Liquidity & Capital Resources Disclosures",
  },
  {
    text: "The new payments portal resolved settlement delays immediately; transaction processing speed improved threefold.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "customer_feedback",
    provenance: "Customer Enterprise Case Study",
  },
  {
    text: "Commercial demand rebounded sharply across EMEA and Asia-Pacific markets, generating an unexpected 12% revenue upside.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "news_commentary",
    provenance: "Regional Business Intelligence Dispatch",
  },
  {
    text: "We achieved profitable unit economics ahead of schedule, with positive adjusted EBITDA in all core operating subsidiaries.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "management_writeup",
    provenance: "Shareholder Annual Letter",
  },
  {
    text: "Working capital turnover accelerated, reducing cash conversion cycle days from 48 days down to 34 days.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "financial_report",
    provenance: "Working Capital Disclosures",
  },
  {
    text: "The product quality and support responsiveness are outstanding; billing reconciliation errors have dropped to zero.",
    task: "sentiment_classification",
    sentimentLabel: "positive",
    sourceCategory: "customer_feedback",
    provenance: "Enterprise Partner Review",
  },

  // NEGATIVE
  {
    text: "Net losses widened significantly due to severe customer attrition, inventory write-downs, and deteriorating sales pipelines.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "financial_report",
    provenance: "Form 10-K Management Discussion & Analysis",
  },
  {
    text: "The auditor issued an explanatory paragraph expressing substantial doubt regarding our ability to continue as a going concern.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "financial_report",
    provenance: "Independent Auditor Report Note 2",
  },
  {
    text: "We breached our maximum leverage covenant with syndicated lenders, triggering immediate default notices and interest rate penalties.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "regulatory_filing",
    provenance: "Form 8-K Current Report Item 2.04",
  },
  {
    text: "Customer complaints regarding double billing and unauthorized subscription renewals increased by 140% this quarter.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "customer_feedback",
    provenance: "Customer Dispute Log",
  },
  {
    text: "Severe supply chain bottlenecks caused complete manufacturing shutdowns, resulting in cancelled orders and unfulfilled commitments.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "management_writeup",
    provenance: "Operational Disruption Report",
  },
  {
    text: "Operating cash burn intensified to negative $85 million, leaving only three months of estimated liquidity runway.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "financial_report",
    provenance: "Treasury Solvency Audit",
  },
  {
    text: "The SEC initiated a formal investigation regarding accounting discrepancies and delayed revenue recognition practices.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "regulatory_filing",
    provenance: "Item 3 Legal Proceedings",
  },
  {
    text: "Service response times are abysmal; our account has been locked for two weeks without escalation or resolution.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "customer_feedback",
    provenance: "High-Priority Support Ticket Escalation",
  },
  {
    text: "Operating margins compressed by 540 basis points due to relentless raw material inflation and discounting pressure.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "earnings_call",
    provenance: "Earnings Call Q&A",
  },
  {
    text: "Repeated payment gateway failures prevented customers from checking out, destroying customer goodwill and immediate transaction revenue.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "customer_feedback",
    provenance: "Incident Retrospective Log",
  },
  {
    text: "Substantial receivables write-offs were incurred after a major wholesale counterparty declared Chapter 11 bankruptcy.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "financial_report",
    provenance: "Allowance for Credit Losses Note 4",
  },
  {
    text: "We were forced to suspend dividends and freeze capital expenditures following a steep credit rating downgrade.",
    task: "sentiment_classification",
    sentimentLabel: "negative",
    sourceCategory: "news_commentary",
    provenance: "Credit Rating Agency Downgrade Notice",
  },

  // NEUTRAL
  {
    text: "The company completed its scheduled annual reassessment of property, plant, and equipment useful asset lives.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "financial_report",
    provenance: "Note 1 Summary of Significant Accounting Policies",
  },
  {
    text: "Consolidated revenues for the fiscal period totaled $850 million compared to $848 million in the preceding fiscal period.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "financial_report",
    provenance: "Quarterly Financial Statements",
  },
  {
    text: "The board of directors held its regular annual meeting to elect members of the audit and governance committees.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "regulatory_filing",
    provenance: "Proxy Statement Form DEF 14A",
  },
  {
    text: "Our headquarters lease agreement was extended for an additional five-year term at prevailing market rates.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "management_writeup",
    provenance: "Corporate Real Estate Lease Note",
  },
  {
    text: "Foreign exchange fluctuations had an immaterial impact of less than 0.2% on total reported gross revenues.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "financial_report",
    provenance: "Currency Sensitivity Note",
  },
  {
    text: "Standard quarterly maintenance of core database servers was performed on Sunday during scheduled downtime.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "management_writeup",
    provenance: "IT Infrastructure Maintenance Log",
  },
  {
    text: "The tax provision was calculated pursuant to statutory rates established under standard domestic internal revenue code.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "financial_report",
    provenance: "Income Tax Note 8",
  },
  {
    text: "The transaction was settled in ordinary cash payment channels according to standard 30-day invoice terms.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "customer_feedback",
    provenance: "Accounts Payable Ledger Note",
  },
  {
    text: "Shares were traded on the NASDAQ exchange within the historical 52-week trading corridor without unusual volume.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "news_commentary",
    provenance: "Market Trading Summary",
  },
  {
    text: "The entity operates in two primary reportable segments: commercial software subscriptions and technical professional services.",
    task: "sentiment_classification",
    sentimentLabel: "neutral",
    sourceCategory: "financial_report",
    provenance: "Segment Reporting Note 14",
  },

  // MIXED
  {
    text: "Top-line revenue grew by 24% to a record high, yet operating profit declined by 18% due to escalating marketing costs.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "earnings_call",
    provenance: "MD&A Earnings Overview",
  },
  {
    text: "While North American customer subscriptions surged, European distributor bankruptcies led to significant bad debt allowances.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "financial_report",
    provenance: "Segment Analysis Note",
  },
  {
    text: "The new software update introduced powerful analytics features, but persistent login crashes caused customer frustration.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "customer_feedback",
    provenance: "Product Release Review Digest",
  },
  {
    text: "Operating cash flow turned positive for the year, although severe working capital inventory build-ups threaten near-term liquidity.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "financial_report",
    provenance: "Cash Flow Statement Review",
  },
  {
    text: "Management secured a $50 million strategic equity investment, but current shareholder equity was diluted by 22%.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "regulatory_filing",
    provenance: "Capital Structure Disclosure",
  },
  {
    text: "Customer service agents were very polite and courteous, but they could not fix the underlying payment processing error.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "customer_feedback",
    provenance: "Customer Experience Survey Response",
  },
  {
    text: "Sales orders increased by 15%, but global shipping backlogs delayed delivery, increasing storage costs and deferring revenue.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "management_writeup",
    provenance: "Supply Chain & Logistics Brief",
  },
  {
    text: "The core patent was upheld in district court, but litigation costs depleted current quarterly operating margins.",
    task: "sentiment_classification",
    sentimentLabel: "mixed",
    sourceCategory: "regulatory_filing",
    provenance: "Legal Matters Item 103",
  },
];

export const DEFAULT_RISK_DATASET: Omit<DatasetItem, 'id'>[] = [
  {
    text: "Operating cash flow deteriorated to negative $45 million, leaving only 45 days of liquid reserves before credit facility exhaustion.",
    task: "risk_classification",
    riskLabels: ["liquidity_cash_flow", "business_continuity"],
    sourceCategory: "financial_report",
    provenance: "Treasury Liquidity Filing",
  },
  {
    text: "The ratio of total funded debt to EBITDA escalated to 6.2x, causing an immediate covenant violation under the senior credit agreement.",
    task: "risk_classification",
    riskLabels: ["debt_leverage", "regulatory_compliance"],
    sourceCategory: "regulatory_filing",
    provenance: "Form 8-K Debt Covenant Event",
  },
  {
    text: "Customer cancellations rose sharply, with net revenue retention declining from 104% to 81% as competitors offered discounted alternatives.",
    task: "risk_classification",
    riskLabels: ["customer_churn_confidence", "revenue_earnings_pressure"],
    sourceCategory: "customer_feedback",
    provenance: "Customer Churn Telemetry",
  },
  {
    text: "Rising unit material costs and freight surcharges compressed gross margins by 420 basis points across all industrial divisions.",
    task: "risk_classification",
    riskLabels: ["expense_margin_deterioration", "supply_chain_dependency"],
    sourceCategory: "financial_report",
    provenance: "Form 10-Q Margin Review",
  },
  {
    text: "Overdue accounts receivable past 90 days surged to $34 million, indicating severe collection delays and uncollectible counterparty risk.",
    task: "risk_classification",
    riskLabels: ["late_payments_collections", "liquidity_cash_flow"],
    sourceCategory: "financial_report",
    provenance: "Aging Receivables Schedule",
  },
  {
    text: "Our primary automated fulfillment center experienced a 72-hour power grid and server outage, completely halting warehouse dispatches.",
    task: "risk_classification",
    riskLabels: ["operational_disruption", "business_continuity"],
    sourceCategory: "management_writeup",
    provenance: "Incident Response Summary",
  },
  {
    text: "Single-source procurement dependency on a foreign microchip foundry poses severe operational shutdown risks if trade embargoes expand.",
    task: "risk_classification",
    riskLabels: ["supply_chain_dependency", "operational_disruption"],
    sourceCategory: "financial_report",
    provenance: "Form 10-K Item 1A Risk Factors",
  },
  {
    text: "The financial intelligence unit issued an inquiry into improper vendor kickbacks and off-balance-sheet undisclosed transactions.",
    task: "risk_classification",
    riskLabels: ["fraud_inconsistencies", "regulatory_compliance"],
    sourceCategory: "regulatory_filing",
    provenance: "Special Audit Committee Investigation",
  },
  {
    text: "Widespread media coverage of data breaches and leaked customer records led to severe brand damage and cancelled enterprise contracts.",
    task: "risk_classification",
    riskLabels: ["reputational_risk", "customer_churn_confidence"],
    sourceCategory: "news_commentary",
    provenance: "Reputational Vulnerability Assessment",
  },
  {
    text: "Substantial regulatory fines were levied for non-compliance with consumer lending transparency and interest disclosure mandates.",
    task: "risk_classification",
    riskLabels: ["regulatory_compliance", "expense_margin_deterioration"],
    sourceCategory: "regulatory_filing",
    provenance: "Enforcement Action Notice",
  },
  {
    text: "Customer complaints regarding double charges on credit cards remain unresolved, triggering credit card dispute chargebacks.",
    task: "risk_classification",
    riskLabels: ["customer_churn_confidence", "late_payments_collections"],
    sourceCategory: "customer_feedback",
    provenance: "Customer Dispute Escalation Log",
  },
  {
    text: "Disaster recovery failover tests revealed significant data replication gaps, compromising recovery time objectives in a disaster.",
    task: "risk_classification",
    riskLabels: ["business_continuity", "operational_disruption"],
    sourceCategory: "management_writeup",
    provenance: "IT Disaster Preparedness Audit",
  },
];

export class DatasetManager {
  private static ensureDirExists() {
    if (!fs.existsSync(DATASETS_DIR)) {
      fs.mkdirSync(DATASETS_DIR, { recursive: true });
    }
  }

  public static getDatasetPath(task: MLTaskType): string {
    this.ensureDirExists();
    return path.join(DATASETS_DIR, `${task}_dataset.json`);
  }

  public static loadDataset(task: MLTaskType): DatasetItem[] {
    const filePath = this.getDatasetPath(task);
    if (!fs.existsSync(filePath)) {
      const seeded = this.seedInitialDataset(task);
      return seeded;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as DatasetItem[];
      return data;
    } catch {
      return this.seedInitialDataset(task);
    }
  }

  public static seedInitialDataset(task: MLTaskType): DatasetItem[] {
    const rawItems = task === 'sentiment_classification' ? DEFAULT_SENTIMENT_DATASET : DEFAULT_RISK_DATASET;
    const items: DatasetItem[] = rawItems.map((item, idx) => ({
      ...item,
      id: `ds-${task}-${Date.now().toString(36)}-${idx.toString(36)}`,
    }));

    this.saveDataset(task, items);
    return items;
  }

  public static saveDataset(task: MLTaskType, items: DatasetItem[]): void {
    this.ensureDirExists();
    const filePath = this.getDatasetPath(task);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
  }

  public static addItems(task: MLTaskType, newItems: Omit<DatasetItem, 'id'>[]): DatasetItem[] {
    const existing = this.loadDataset(task);
    const existingTexts = new Set(existing.map((e) => e.text.trim().toLowerCase()));

    const added: DatasetItem[] = [];
    newItems.forEach((item, idx) => {
      const normalized = item.text.trim().toLowerCase();
      // Deduplicate on exact text match
      if (!existingTexts.has(normalized) && normalized.length >= 10) {
        existingTexts.add(normalized);
        const record: DatasetItem = {
          ...item,
          id: `ds-${task}-${Date.now().toString(36)}-${(existing.length + idx).toString(36)}`,
        };
        existing.push(record);
        added.push(record);
      }
    });

    if (added.length > 0) {
      this.saveDataset(task, existing);
    }
    return existing;
  }

  /**
   * Split dataset strictly into train (70%), validation (15%), and test (15%) splits.
   * Uses stratified sampling on primary label where possible.
   * Deterministic pseudo-random shuffle with fixed seed to avoid leakage across evaluations.
   */
  public static createSplit(
    task: MLTaskType,
    items: DatasetItem[],
    trainRatio = 0.7,
    valRatio = 0.15,
    seed = 42
  ): DatasetSplit {
    // Seeded pseudo-random shuffle (PRNG LCG)
    let state = seed;
    const prng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    // Group items by label for stratified partitioning
    const groups: Record<string, DatasetItem[]> = {};
    items.forEach((item) => {
      const label =
        task === 'sentiment_classification'
          ? item.sentimentLabel || 'neutral'
          : (item.riskLabels && item.riskLabels[0]) || 'liquidity_cash_flow';
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    const train: DatasetItem[] = [];
    const validation: DatasetItem[] = [];
    const test: DatasetItem[] = [];

    // Stratify per class group
    Object.keys(groups).forEach((label) => {
      const list = [...groups[label]];
      // Shuffle group items deterministically
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }

      const total = list.length;
      let trainCount = Math.floor(total * trainRatio);
      let valCount = Math.floor(total * valRatio);

      // Ensure at least 1 item in train if group has items
      if (total >= 3) {
        trainCount = Math.max(1, trainCount);
        valCount = Math.max(1, valCount);
      } else if (total === 2) {
        trainCount = 1;
        valCount = 1;
      } else {
        trainCount = 1;
        valCount = 0;
      }

      const trainPart = list.slice(0, trainCount);
      const valPart = list.slice(trainCount, trainCount + valCount);
      const testPart = list.slice(trainCount + valCount);

      // If test part ended up empty due to rounding and total >= 3, rebalance
      if (testPart.length === 0 && total >= 3 && trainPart.length > 1) {
        testPart.push(trainPart.pop()!);
      }

      train.push(...trainPart);
      validation.push(...valPart);
      test.push(...testPart);
    });

    return { train, validation, test };
  }

  public static getDatasetStats(task: MLTaskType) {
    const items = this.loadDataset(task);
    const split = this.createSplit(task, items);

    const classDistribution: Record<string, number> = {};
    items.forEach((item) => {
      const label =
        task === 'sentiment_classification'
          ? item.sentimentLabel || 'neutral'
          : (item.riskLabels && item.riskLabels[0]) || 'other';
      classDistribution[label] = (classDistribution[label] || 0) + 1;
    });

    return {
      task,
      totalCount: items.length,
      trainCount: split.train.length,
      valCount: split.validation.length,
      testCount: split.test.length,
      classDistribution,
      lastUpdated: fs.existsSync(this.getDatasetPath(task))
        ? fs.statSync(this.getDatasetPath(task)).mtime.toISOString()
        : new Date().toISOString(),
    };
  }
}
