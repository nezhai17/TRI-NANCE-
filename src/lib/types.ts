export type SentimentClass = 'positive' | 'negative' | 'neutral' | 'mixed';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RiskCategory =
  | 'liquidity_cash_flow'
  | 'debt_leverage'
  | 'revenue_earnings_pressure'
  | 'expense_margin_deterioration'
  | 'customer_churn_confidence'
  | 'late_payments_collections'
  | 'operational_disruption'
  | 'supply_chain_dependency'
  | 'regulatory_compliance'
  | 'fraud_inconsistencies'
  | 'reputational_risk'
  | 'business_continuity';

export type EvidenceClassification = 'explicitly_stated' | 'inferred' | 'requiring_verification';

export interface SentimentSignal {
  id: string;
  label: string;
  excerpt: string;
  score: number; // -1 to 1
  context?: string;
  sourceLocation?: {
    line?: number;
    paragraph?: number;
    startOffset?: number;
    endOffset?: number;
  };
}

export interface SentimentResult {
  overall: SentimentClass;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  summary: string;
  positiveSignals: SentimentSignal[];
  negativeSignals: SentimentSignal[];
  neutralSignals: SentimentSignal[];
  contradictions: string[];
  limitations: string;
}

export interface RiskFinding {
  id: string;
  category: RiskCategory;
  categoryLabel: string;
  title: string;
  excerpt: string;
  sourceLocation?: {
    page?: number;
    line?: number;
    paragraph?: number;
    startOffset?: number;
    endOffset?: number;
  };
  explanation: string;
  severity: RiskSeverity;
  severityRationale: string;
  confidence: number; // 0 to 1
  potentialImpact: string;
  suggestedNextSteps: string[];
  classification: EvidenceClassification;
  isApproximateMatch?: boolean;
}

export interface RiskResult {
  overallRiskScore: number; // 0 - 100
  highestSeverity: RiskSeverity;
  openFindingsCount: number;
  severityDistribution: Record<RiskSeverity, number>;
  categoryDistribution: Partial<Record<RiskCategory, number>>;
  summary: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  documentId?: string | null;
  title: string;
  sourceType: 'pasted_text' | 'document_upload';
  sourceCategory:
    | 'financial_report'
    | 'earnings_call'
    | 'customer_feedback'
    | 'management_writeup'
    | 'regulatory_filing'
    | 'news_commentary';
  analysisMode: 'sentiment_only' | 'risk_only' | 'combined';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  inputText: string;
  wordCount: number;
  sentimentResult?: SentimentResult;
  riskResult?: RiskResult;
  findings: RiskFinding[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv';
  fileSizeBytes: number;
  storagePath?: string;
  extractedText: string;
  wordCount: number;
  charCount: number;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultMode: 'sentiment_only' | 'risk_only' | 'combined';
    layout: 'standard' | 'compact' | 'expanded';
    reducedMotion?: boolean;
  };
  createdAt: string;
}

export interface DashboardMetrics {
  totalCompletedAnalyses: number;
  negativeSentimentShare: number; // Percentage 0 - 100
  negativeCount: number;
  eligibleCompletedCount: number;
  openHighSeverityFindings: number;
  recentActivityCount: number;
  sentimentCounts: Record<SentimentClass, number>;
  severityCounts: Record<RiskSeverity, number>;
}
