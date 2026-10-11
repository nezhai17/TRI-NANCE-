import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitCopilotFeedback, listCopilotFeedback } from '@/lib/store/repository';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const feedback = await listCopilotFeedback(user.id);
    return NextResponse.json({ feedback });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve feedback.' },
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
    const { messageId, rating, reason, comment } = body;

    if (!messageId || !rating) {
      return NextResponse.json({ error: 'Message ID and rating are required.' }, { status: 400 });
    }

    const saved = await submitCopilotFeedback({
      userId: user.id,
      messageId,
      rating,
      reason,
      comment,
    });

    return NextResponse.json({ success: true, feedback: saved });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record feedback.' },
      { status: 500 }
    );
  }
}
