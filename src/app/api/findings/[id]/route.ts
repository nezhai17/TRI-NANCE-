import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateFindingReview } from '@/lib/store/repository';
import { ReviewStatus } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized analyst session' }, { status: 401 });
    }

    const { id: findingId } = await params;
    const body = await request.json();

    const { analysisId, reviewStatus, resolutionReason, noteText } = body;

    if (reviewStatus && !['open', 'under_review', 'resolved', 'dismissed'].includes(reviewStatus)) {
      return NextResponse.json({ error: 'Invalid review status value' }, { status: 400 });
    }

    if (reviewStatus === 'dismissed' && (!resolutionReason || !resolutionReason.trim())) {
      return NextResponse.json(
        { error: 'A mandatory audit justification reason is required when dismissing a finding.' },
        { status: 400 }
      );
    }

    const updatedFinding = await updateFindingReview(
      analysisId,
      findingId,
      user.id,
      {
        reviewStatus: reviewStatus as ReviewStatus,
        resolutionReason: resolutionReason?.trim(),
        noteText: noteText?.trim(),
        authorName: user.fullName || user.email,
      }
    );

    const { logAuditEvent } = await import('@/lib/store/repository');
    await logAuditEvent(
      user.id,
      'finding_triage_updated',
      'finding',
      findingId,
      { reviewStatus, resolutionReason: resolutionReason?.trim(), analysisId }
    );

    return NextResponse.json({ success: true, finding: updatedFinding });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update finding status' },
      { status: error?.message?.includes('not found') ? 404 : 500 }
    );
  }
}
