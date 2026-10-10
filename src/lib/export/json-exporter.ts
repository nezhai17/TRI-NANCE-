import { AnalysisRecord } from '../types';

export function exportAnalysisToJson(analysis: AnalysisRecord): string {
  // Omit any internal credentials or sensitive debug properties
  const sanitized = {
    reportId: analysis.id,
    reportTitle: analysis.title,
    generatedAt: new Date().toISOString(),
    sourceType: analysis.sourceType,
    sourceCategory: analysis.sourceCategory,
    analysisMode: analysis.analysisMode,
    wordCount: analysis.wordCount,
    sentimentIntelligence: analysis.sentimentResult ? {
      overall: analysis.sentimentResult.overall,
      score: analysis.sentimentResult.score,
      confidence: analysis.sentimentResult.confidence,
      summary: analysis.sentimentResult.summary,
      positiveSignals: analysis.sentimentResult.positiveSignals,
      negativeSignals: analysis.sentimentResult.negativeSignals,
      neutralSignals: analysis.sentimentResult.neutralSignals,
      contradictions: analysis.sentimentResult.contradictions,
      limitations: analysis.sentimentResult.limitations,
    } : null,
    riskIntelligence: analysis.riskResult ? {
      overallRiskScore: analysis.riskResult.overallRiskScore,
      highestSeverity: analysis.riskResult.highestSeverity,
      openFindingsCount: analysis.riskResult.openFindingsCount,
      severityDistribution: analysis.riskResult.severityDistribution,
      categoryDistribution: analysis.riskResult.categoryDistribution,
      summary: analysis.riskResult.summary,
    } : null,
    findings: analysis.findings.map(f => ({
      id: f.id,
      category: f.category,
      categoryLabel: f.categoryLabel,
      title: f.title,
      severity: f.severity,
      severityRationale: f.severityRationale,
      evidenceExcerpt: f.excerpt,
      sourceLocation: f.sourceLocation,
      explanation: f.explanation,
      confidence: f.confidence,
      potentialImpact: f.potentialImpact,
      suggestedNextSteps: f.suggestedNextSteps,
      classification: f.classification,
    })),
  };

  return JSON.stringify(sanitized, null, 2);
}
