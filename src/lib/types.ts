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

export type EpistemicCertainty = 'documented_fact' | 'hedged_projection' | 'ambiguous_disclosure';

export interface InvestigationDiligence {
  questionsForManagement: string[];
  recordsToCrossExamine: string[];
  identifiedInformationGap?: string;
}

export type ReviewStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface FindingNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SentimentSignal {
  id: string;
  label: string;
  excerpt: string;
  score: number; // -1 to 1
  context?: string;
  epistemicCertainty?: EpistemicCertainty;
  hedgingTerms?: string[];
  sourceLocation?: {
    line?: number;
    paragraph?: number;
    startOffset?: number;
    endOffset?: number;
  };
}

export type AspectTopic =
  | 'product_quality'
  | 'service_support'
  | 'pricing_value'
  | 'delivery_fulfillment'
  | 'billing_payments'
  | 'management_execution'
  | 'financial_performance'
  | 'operational_stability';

export interface AspectSentiment {
  topic: AspectTopic;
  topicLabel: string;
  sentiment: SentimentClass;
  score: number; // -1 to 1
  mentionCount: number;
  excerpts: string[];
}

export interface EntitySentiment {
  entityId: string;
  entityName: string;
  entityType: 'company' | 'subsidiary' | 'counterparty' | 'facility' | 'auditor';
  sentiment: SentimentClass;
  score: number; // -1 to 1
  mentionCount: number;
  supportingExcerpts: string[];
}

export interface CustomerIssueCluster {
  id: string;
  category: string;
  label: string;
  frequency: number;
  distinctSourcesCount: number;
  severity: RiskSeverity;
  isEscalated: boolean;
  hasCancellationIntent: boolean;
  representativeExcerpts: string[];
}

export interface CustomerTextResult {
  totalMessagesAnalyzed: number;
  distinctCustomersIdentified: number;
  dominantSentiment: SentimentClass;
  cancellationIntentCount: number;
  billingDisputeCount: number;
  escalationCount: number;
  issueClusters: CustomerIssueCluster[];
  repeatedIssuesSummary: string;
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
  uncertaintyScore?: number; // 0 - 100 percentage
  hedgedSignals?: SentimentSignal[];
  informationGaps?: string[];
  aspects?: AspectSentiment[];
  entitySentiments?: EntitySentiment[];
  customerIntelligence?: CustomerTextResult;
  mlInference?: MLInferenceResult;
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
  epistemicCertainty?: EpistemicCertainty;
  uncertaintyRationale?: string;
  investigationDiligence?: InvestigationDiligence;
  isApproximateMatch?: boolean;
  reviewStatus?: ReviewStatus;
  reviewNotes?: FindingNote[];
  resolutionReason?: string;
  resolvedAt?: string;
}

export interface RiskResult {
  overallRiskScore: number; // 0 - 100
  highestSeverity: RiskSeverity;
  openFindingsCount: number;
  severityDistribution: Record<RiskSeverity, number>;
  categoryDistribution: Partial<Record<RiskCategory, number>>;
  summary: string;
}

export interface FinancialMetric {
  id: string;
  name: string;
  rawValue: string;
  normalizedValue?: number;
  unit: string;
  period?: string;
  sourceLocation?: {
    line?: number;
    startOffset?: number;
    endOffset?: number;
  };
  excerpt: string;
}

export interface AnomalyFinding {
  id: string;
  type:
    | 'narrative_vs_financial_dissonance'
    | 'cross_period_conflict'
    | 'covenant_liquidity_contradiction'
    | 'metric_discrepancy';
  title: string;
  description: string;
  severity: RiskSeverity;
  comparedExcerpts: Array<{
    label: string;
    text: string;
    documentTitle?: string;
  }>;
  requiresVerification: boolean;
}

export interface CrossDocumentComparison {
  id: string;
  userId: string;
  title: string;
  documentIds: string[];
  documentTitles: string[];
  sentimentTrajectory: Array<{
    documentTitle: string;
    period?: string;
    overall: SentimentClass;
    score: number;
  }>;
  recurringRiskThemes: Array<{
    category: RiskCategory;
    categoryLabel: string;
    occurrencesCount: number;
    distinctSourceCount: number;
    trajectoryTrend: 'escalating' | 'stable' | 'declining';
    documentMentions: string[];
  }>;
  coOccurringRiskPairs?: Array<{
    pair: [RiskCategory, RiskCategory];
    labels: [string, string];
    coOccurrenceCount: number;
  }>;
  newlyObservedRisks: Array<{
    category: RiskCategory;
    categoryLabel: string;
    firstObservedIn: string;
    findingTitle: string;
  }>;
  contradictionsBetweenDocuments: AnomalyFinding[];
  investigationSummary: string;
  createdAt: string;
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
  numericalSignals?: FinancialMetric[];
  anomalies?: AnomalyFinding[];
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
  unresolvedInvestigationsCount?: number;
}

export interface CopilotFeedback {
  id: string;
  userId: string;
  messageId: string;
  rating: 'positive' | 'negative';
  reason?: 'correct' | 'incorrect' | 'missing_evidence' | 'poor_retrieval' | 'incorrect_calculation' | 'misleading_conclusion';
  comment?: string;
  createdAt: string;
}

export interface InvestigationChecklistItem {
  id: string;
  title: string;
  category: string;
  status: 'completed' | 'pending' | 'blocked';
  notes?: string;
  evidenceRef?: string;
}

// ==========================================
// MACHINE LEARNING SUBSYSTEM TYPES
// ==========================================

export type MLTaskType = 'sentiment_classification' | 'risk_classification';

export type MLAlgorithm =
  | 'multinomial_naive_bayes'
  | 'complement_naive_bayes'
  | 'logistic_regression'
  | 'linear_svc'
  | 'finbert_transformer';

export type ModelLifecycleState = 'candidate' | 'approved' | 'active_production' | 'deprecated';

export interface DatasetItem {
  id: string;
  text: string;
  task: MLTaskType;
  sentimentLabel?: SentimentClass;
  riskLabels?: RiskCategory[];
  sourceCategory: string;
  provenance: string;
  metadata?: Record<string, unknown>;
}

export interface DatasetSplit {
  train: DatasetItem[];
  validation: DatasetItem[];
  test: DatasetItem[];
}

export interface ClassMetric {
  className: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface ConfusionMatrixCell {
  actual: string;
  predicted: string;
  count: number;
}

export interface ConfusionMatrix {
  labels: string[];
  matrix: number[][]; // rows: actual, cols: predicted
  details: ConfusionMatrixCell[];
}

export interface EvaluationMetrics {
  macroF1: number;
  weightedF1: number;
  accuracy: number;
  logLoss?: number;
  brierScore?: number;
  perClass: Record<string, ClassMetric>;
  confusionMatrix: ConfusionMatrix;
  testSampleCount: number;
  evaluatedAt: string;
}

export interface ModelHyperparameters {
  ngramRange?: [number, number];
  minDf?: number;
  maxFeatures?: number;
  sublinearTf?: boolean;
  alpha?: number; // Laplace / smoothing parameter
  c?: number; // Regularization parameter
  maxIter?: number;
  learningRate?: number;
  classWeight?: 'balanced' | 'uniform';
}

export interface ModelArtifact {
  id: string;
  version: string;
  name: string;
  task: MLTaskType;
  algorithm: MLAlgorithm;
  hyperparameters: ModelHyperparameters;
  vocabulary: Record<string, number>;
  idfWeights?: Record<string, number>;
  weights?: Record<string, number[]>; // For linear models / NB log likelihoods
  bias?: number[];
  classes: string[];
  metrics: EvaluationMetrics;
  createdAt: string;
  trainingDurationMs: number;
}

export interface ModelRegistryEntry {
  id: string;
  version: string;
  name: string;
  task: MLTaskType;
  algorithm: MLAlgorithm;
  state: ModelLifecycleState;
  metrics: EvaluationMetrics;
  artifactPath: string;
  trainingSamplesCount: number;
  testSamplesCount: number;
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
  notes?: string;
}

export interface AlgorithmBenchmark {
  algorithm: MLAlgorithm;
  algorithmLabel: string;
  validationMacroF1: number;
  validationAccuracy: number;
  trainingDurationMs: number;
  memoryEstimateKb?: number;
  metrics: EvaluationMetrics;
  isBestCandidate: boolean;
}

export interface TrainingRunReport {
  runId: string;
  task: MLTaskType;
  timestamp: string;
  datasetSize: {
    train: number;
    validation: number;
    test: number;
    total: number;
  };
  benchmarks: AlgorithmBenchmark[];
  winningAlgorithm: MLAlgorithm;
  registeredModelId: string;
  registeredVersion: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface MLInferenceResult {
  task: MLTaskType;
  predictedLabel: string;
  probabilities: Record<string, number>;
  confidence: number;
  modelVersion: string;
  algorithm: MLAlgorithm;
  latencyMs: number;
  featureWeights?: Array<{ term: string; weight: number }>;
}


