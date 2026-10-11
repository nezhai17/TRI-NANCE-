import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listAuditLogs } from '@/lib/store/repository';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const logs = await listAuditLogs(user.id, 50);
  return NextResponse.json({
    events: logs,
    timestamp: new Date().toISOString(),
    connected: true,
  });
}
