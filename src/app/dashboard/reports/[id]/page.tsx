import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAnalysisById } from '@/lib/store/repository';
import { ReportView } from '@/components/reports/ReportView';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  const analysis = await getAnalysisById(id, user?.id);

  if (!analysis) {
    notFound();
  }

  return <ReportView analysis={analysis} />;
}
