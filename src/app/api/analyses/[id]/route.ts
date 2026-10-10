import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAnalysisById, updateAnalysis, deleteAnalysis } from '@/lib/store/repository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const analysis = await getAnalysisById(id, user.id);
  if (!analysis) return NextResponse.json({ error: 'Analysis record not found.' }, { status: 404 });

  return NextResponse.json(analysis);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const updated = await updateAnalysis(id, user.id, {
      title: body.title,
      status: body.status,
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update analysis.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteAnalysis(id, user.id);
  if (!deleted) return NextResponse.json({ error: 'Analysis not found or unauthorized.' }, { status: 404 });

  return NextResponse.json({ success: true });
}
