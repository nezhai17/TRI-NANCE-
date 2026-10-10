import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { parseDocumentBuffer } from '@/lib/intelligence/document-parser';
import { createDocumentRecord, listDocuments } from '@/lib/store/repository';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const docs = await listDocuments(user.id);
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const titleInput = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Limit 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit.' }, { status: 400 });
    }

    const filename = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const extracted = await parseDocumentBuffer(buffer, filename, file.type);
    const title = titleInput?.trim() || filename.replace(/\.[^/.]+$/, '');

    const record = await createDocumentRecord({
      userId: user.id,
      title,
      filename,
      fileType: extracted.fileType,
      fileSizeBytes: file.size,
      extractedText: extracted.text,
      wordCount: extracted.wordCount,
      charCount: extracted.charCount,
      status: 'processed',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    console.error('Document parsing error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process document upload.' },
      { status: 500 }
    );
  }
}
