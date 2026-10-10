import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses, getDashboardMetrics } from '@/lib/store/repository';
import { SentimentClass, RiskSeverity } from '@/lib/types';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const sentiment = (searchParams.get('sentiment') as SentimentClass | 'all') || 'all';
  const severity = (searchParams.get('severity') as RiskSeverity | 'all') || 'all';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const includeMetrics = searchParams.get('metrics') === 'true';

  const result = await listAnalyses(user.id, {
    search,
    sentiment,
    severity,
    status,
    page,
    limit,
  });

  let metrics = undefined;
  if (includeMetrics) {
    metrics = await getDashboardMetrics(user.id);
  }

  return NextResponse.json({
    ...result,
    metrics,
  });
}
