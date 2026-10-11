import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ModelRegistry, MLInferenceEngine } from '@/lib/ml/model-registry';
import { MLTaskType, ModelLifecycleState } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const task = searchParams.get('task') as MLTaskType | null;

    const entries = task
      ? ModelRegistry.getModelsByTask(task)
      : ModelRegistry.loadRegistry();

    const activeSentiment = ModelRegistry.getActiveModel('sentiment_classification');
    const activeRisk = ModelRegistry.getActiveModel('risk_classification');

    return NextResponse.json({
      success: true,
      models: entries,
      activeModels: {
        sentiment_classification: activeSentiment,
        risk_classification: activeRisk,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve models from registry', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { modelId, state } = body as { modelId: string; state: ModelLifecycleState };

    if (!modelId || !state) {
      return NextResponse.json(
        { error: 'Required: modelId and state' },
        { status: 400 }
      );
    }

    const updated = ModelRegistry.setModelState(modelId, state);
    MLInferenceEngine.clearCache();

    return NextResponse.json({
      success: true,
      model: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update model lifecycle state', details: error.message },
      { status: 500 }
    );
  }
}
