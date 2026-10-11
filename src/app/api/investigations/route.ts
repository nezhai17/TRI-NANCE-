import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  listInvestigationComparisons,
  createInvestigationComparison,
  getAnalysesByUserId,
} from '@/lib/store/repository';
import { compareMultipleAnalyses } from '@/lib/intelligence/cross-document-engine';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized analyst session' }, { status: 401 });
    }

    const comparisons = await listInvestigationComparisons(user.id);
    return NextResponse.json({ comparisons });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to list investigations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized analyst session' }, { status: 401 });
    }

    const body = await request.json();
    const { title, documentIds, analysisIds } = body;

    const targetIds: string[] = analysisIds || documentIds || [];
    if (!Array.isArray(targetIds) || targetIds.length < 2) {
      return NextResponse.json(
        { error: 'At least two analyzed reports must be selected for cross-document comparative investigation.' },
        { status: 400 }
      );
    }

    const allAnalyses = await getAnalysesByUserId(user.id);
    const selectedAnalyses = allAnalyses.filter(
      (a) => targetIds.includes(a.id) || (a.documentId && targetIds.includes(a.documentId))
    );

    if (selectedAnalyses.length < 2) {
      return NextResponse.json(
        {
          error: `Cross-document audit requires at least 2 completed analyses. Found ${selectedAnalyses.length} matching dossiers.`,
        },
        { status: 400 }
      );
    }

    // Run real comparative intelligence engine
    const rawComparison = compareMultipleAnalyses(
      selectedAnalyses,
      title?.trim() || undefined
    );

    // Persist comparison record
    const saved = await createInvestigationComparison({
      ...rawComparison,
      userId: user.id,
    });

    return NextResponse.json({ success: true, comparison: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate cross-document investigation' },
      { status: 500 }
    );
  }
}
