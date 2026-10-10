import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAnalysisById } from '@/lib/store/repository';
import { exportFindingsToCsv } from '@/lib/export/csv-exporter';
import { exportAnalysisToJson } from '@/lib/export/json-exporter';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const analysis = await getAnalysisById(id, user.id);
  if (!analysis) return NextResponse.json({ error: 'Analysis record not found.' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  const sanitizedTitle = analysis.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'json') {
    const jsonContent = exportAnalysisToJson(analysis);
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tri-nance-report-${sanitizedTitle}.json"`,
      },
    });
  }

  // Default CSV format
  const csvContent = exportFindingsToCsv(analysis);
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tri-nance-findings-${sanitizedTitle}.csv"`,
    },
  });
}
