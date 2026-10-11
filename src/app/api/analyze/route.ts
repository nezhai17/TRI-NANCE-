import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { analyzeFinancialSentiment } from '@/lib/intelligence/sentiment-engine';
import { analyzeFinancialRisks } from '@/lib/intelligence/risk-engine';
import { verifyEvidenceAgainstSource } from '@/lib/intelligence/evidence-verifier';
import { extractFinancialSignals } from '@/lib/intelligence/numerical-extractor';
import { detectAnomaliesAndContradictions } from '@/lib/intelligence/anomaly-engine';
import { analyzeCustomerTextFeedback } from '@/lib/intelligence/customer-text-engine';
import { extractAndResolveEntities } from '@/lib/intelligence/entity-extractor';
import { MLInferenceEngine } from '@/lib/ml/model-registry';
import { createAnalysis, getDocumentById } from '@/lib/store/repository';
import { RiskFinding } from '@/lib/types';

const analyzeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  sourceType: z.enum(['pasted_text', 'document_upload']),
  sourceCategory: z.enum([
    'financial_report',
    'earnings_call',
    'customer_feedback',
    'management_writeup',
    'regulatory_filing',
    'news_commentary',
  ]),
  analysisMode: z.enum(['sentiment_only', 'risk_only', 'combined']),
  inputText: z.string().optional(),
  documentId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid analysis input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, sourceType, sourceCategory, analysisMode, documentId } = parsed.data;
    let textToAnalyze = parsed.data.inputText?.trim() || '';

    // If document upload was chosen, retrieve text from persisted document record
    if (sourceType === 'document_upload' && documentId) {
      const doc = await getDocumentById(documentId, user.id);
      if (!doc) {
        return NextResponse.json({ error: 'Referenced document not found or access denied.' }, { status: 404 });
      }
      textToAnalyze = doc.extractedText;
    }

    if (!textToAnalyze || textToAnalyze.length < 10) {
      return NextResponse.json(
        { error: 'Insufficient text content to analyze. Please provide at least 10 characters of financial text.' },
        { status: 400 }
      );
    }

    const words = textToAnalyze.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Sentiment Intelligence
    let sentimentResult = undefined;
    if (analysisMode === 'sentiment_only' || analysisMode === 'combined') {
      sentimentResult = analyzeFinancialSentiment(textToAnalyze);

      // Execute live trained ML Model inference if available
      try {
        const mlResult = MLInferenceEngine.predict('sentiment_classification', textToAnalyze);
        if (mlResult) {
          sentimentResult.mlInference = mlResult;
        }
      } catch (err) {
        console.warn('ML Inference warning:', err);
      }

      // If source category is customer feedback, run dedicated customer text intelligence engine
      if (sourceCategory === 'customer_feedback') {
        const customerFeedback = analyzeCustomerTextFeedback(textToAnalyze);
        sentimentResult = {
          ...sentimentResult,
          customerIntelligence: customerFeedback,
        };
      }

      // Map resolved entities to entity sentiment
      const resolvedEntities = extractAndResolveEntities(textToAnalyze);
      if (resolvedEntities.length > 0) {
        sentimentResult.entitySentiments = resolvedEntities.map((ent) => ({
          entityId: ent.id,
          entityName: ent.name,
          entityType: ent.type,
          sentiment: sentimentResult!.overall,
          score: sentimentResult!.score,
          mentionCount: ent.mentionsCount,
          supportingExcerpts: ent.excerpts,
        }));
      }
    }

    // 2. Risk Intelligence
    let riskResult = undefined;
    let validatedFindings: RiskFinding[] = [];
    if (analysisMode === 'risk_only' || analysisMode === 'combined') {
      const { findings, summary } = analyzeFinancialRisks(textToAnalyze);
      riskResult = summary;

      // 3. Evidence Intelligence: Verify and anchor each finding directly to source text
      validatedFindings = findings.map((f) => {
        const verification = verifyEvidenceAgainstSource(f.excerpt, textToAnalyze);
        return {
          ...f,
          sourceLocation: {
            ...f.sourceLocation,
            startOffset: verification.startOffset ?? f.sourceLocation?.startOffset,
            endOffset: verification.endOffset ?? f.sourceLocation?.endOffset,
            line: verification.line ?? f.sourceLocation?.line,
            paragraph: verification.paragraph ?? f.sourceLocation?.paragraph,
          },
          isApproximateMatch: verification.matchType === 'normalized',
          reviewStatus: 'open' as const,
          reviewNotes: [],
        };
      });
    }

    // 4. Numerical Financial Signals
    const numericalSignals = extractFinancialSignals(textToAnalyze);

    // 5. Contradiction & Anomaly Detection
    const anomalies = detectAnomaliesAndContradictions(
      textToAnalyze,
      sentimentResult,
      validatedFindings,
      numericalSignals
    );

    // 6. Persist analysis record
    const record = await createAnalysis({
      userId: user.id,
      documentId: documentId || null,
      title,
      sourceType,
      sourceCategory,
      analysisMode,
      status: 'completed',
      inputText: textToAnalyze,
      wordCount,
      sentimentResult,
      riskResult,
      findings: validatedFindings,
      numericalSignals,
      anomalies,
    });

    const { logAuditEvent } = await import('@/lib/store/repository');
    await logAuditEvent(
      user.id,
      'analysis_completed',
      'analysis',
      record.id,
      { title: record.title, findingsCount: validatedFindings.length, severity: riskResult?.highestSeverity }
    );

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('Analysis execution failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred during analysis.' },
      { status: 500 }
    );
  }
}
