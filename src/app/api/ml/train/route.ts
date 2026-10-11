import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ModelTrainer } from '@/lib/ml/trainer';
import { ModelRegistry, MLInferenceEngine } from '@/lib/ml/model-registry';
import { MLTaskType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const task: MLTaskType = body.task || 'sentiment_classification';

    // Run multi-algorithm benchmarking and training
    const report = await ModelTrainer.runTrainingPipeline(task);

    // Auto-register winning model in model registry
    const registryEntry = ModelRegistry.registerModel(
      report.registeredModelId,
      'active_production',
      `Trained and selected by multi-algorithm benchmark pipeline (Validation Macro F1: ${(report.benchmarks[0].validationMacroF1 * 100).toFixed(1)}%)`
    );

    // Invalidate cached inference runtime
    MLInferenceEngine.clearCache();

    return NextResponse.json({
      success: true,
      report,
      registeredModel: registryEntry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Training pipeline failed', details: error.message },
      { status: 500 }
    );
  }
}
