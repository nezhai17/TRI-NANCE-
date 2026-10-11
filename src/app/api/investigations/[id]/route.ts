import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getInvestigationComparisonById,
  deleteInvestigationComparison,
} from '@/lib/store/repository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized analyst session' }, { status: 401 });
    }

    const { id } = await params;
    const comparison = await getInvestigationComparisonById(id, user.id);

    if (!comparison) {
      return NextResponse.json({ error: 'Investigation dossier not found' }, { status: 404 });
    }

    return NextResponse.json({ comparison });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch investigation' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized analyst session' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteInvestigationComparison(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Investigation dossier not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Investigation audit removed from workspace' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete investigation' }, { status: 500 });
  }
}
