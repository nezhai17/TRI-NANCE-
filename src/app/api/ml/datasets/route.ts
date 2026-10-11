import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { DatasetManager } from '@/lib/ml/dataset-manager';
import { MLTaskType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const task = (searchParams.get('task') as MLTaskType) || 'sentiment_classification';

    const items = DatasetManager.loadDataset(task);
    const stats = DatasetManager.getDatasetStats(task);

    return NextResponse.json({
      success: true,
      task,
      stats,
      sampleItems: items.slice(0, 25),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch dataset', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { task, items } = body;

    if (!task || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input. Required: task and non-empty items array.' },
        { status: 400 }
      );
    }

    const updatedDataset = DatasetManager.addItems(task, items);
    const stats = DatasetManager.getDatasetStats(task);

    return NextResponse.json({
      success: true,
      task,
      stats,
      totalItems: updatedDataset.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to append dataset items', details: error.message },
      { status: 500 }
    );
  }
}
