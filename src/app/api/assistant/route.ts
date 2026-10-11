import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import {
  listAnalyses,
  listDocuments,
  listInvestigationComparisons,
  saveCopilotSession,
  listCopilotSessions,
  getCopilotSessionById,
} from '@/lib/store/repository';
import {
  processCopilotQuery,
  CopilotSession,
  CopilotMessage,
} from '@/lib/intelligence/copilot-engine';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const sessions = await listCopilotSessions(user.id);
    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve copilot sessions.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const question = (body.question || body.query)?.trim();
    if (!question) {
      return NextResponse.json({ error: 'A question or prompt is required.' }, { status: 400 });
    }

    const contextAnalysisId = body.contextAnalysisId;
    let sessionId = body.conversationId || body.sessionId;

    // Load authorized workspace records: analyses, raw documents, and investigations
    const [{ analyses }, documents, investigations] = await Promise.all([
      listAnalyses(user.id, { limit: 50 }),
      listDocuments(user.id),
      listInvestigationComparisons(user.id),
    ]);

    // Process inquiry through Copilot engine
    const assistantMessage = processCopilotQuery(question, analyses, contextAnalysisId, {
      documents,
      investigations,
    });

    // Retrieve or create persistent session
    let session: CopilotSession | null = null;
    if (sessionId) {
      session = await getCopilotSessionById(sessionId, user.id);
    }

    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    if (!session) {
      sessionId = sessionId || crypto.randomUUID();
      session = {
        id: sessionId,
        userId: user.id,
        title: question.slice(0, 48),
        contextAnalysisId,
        messages: [userMessage, assistantMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      session.messages.push(userMessage, assistantMessage);
      session.updatedAt = new Date().toISOString();
    }

    await saveCopilotSession(session);

    // Backward-compatible response mapping alongside rich copilot fields
    const responsePayload = {
      ...assistantMessage,
      sessionId,
      question,
      answer: assistantMessage.content,
      relevantFindings: (assistantMessage.citations || []).map((c) => ({
        title: c.title,
        categoryLabel: c.categoryLabel,
        severity: c.severity,
        excerpt: c.excerpt,
        analysisTitle: c.analysisTitle,
        epistemicCertainty: c.epistemicCertainty,
      })),
      informationGaps: assistantMessage.informationGaps || [],
      suggestedAction: assistantMessage.suggestedFollowUps?.[0] || 'Continue diligence review.',
      sessionMessagesCount: session.messages.length,
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Copilot query execution failed.' },
      { status: 500 }
    );
  }
}
