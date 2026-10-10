import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentById, deleteDocumentRecord } from '@/lib/store/repository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const doc = await getDocumentById(id, user.id);
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  return NextResponse.json(doc);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteDocumentRecord(id, user.id);
  if (!deleted) return NextResponse.json({ error: 'Document not found or unauthorized.' }, { status: 404 });

  return NextResponse.json({ success: true });
}
