import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MLInferenceEngine } from '@/lib/ml/model-registry';
import { MLTaskType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, task = 'sentiment_classification' } = body as {
      text: string;
      task?: MLTaskType;
    };

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide at least 5 characters of text to run inference.' },
        { status: 400 }
      );
    }

    const result = MLInferenceEngine.predict(task, text);
    if (!result) {
      return NextResponse.json(
        { error: 'No active production model registered for this task. Train a model first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Inference execution failed', details: error.message },
      { status: 500 }
    );
  }
}
