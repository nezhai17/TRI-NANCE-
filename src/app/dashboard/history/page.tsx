import { getCurrentUser } from '@/lib/auth';
import { listAnalyses } from '@/lib/store/repository';
import { RecentAnalysesTable } from '@/components/dashboard/RecentAnalysesTable';

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const { analyses } = await listAnalyses(user?.id || '', { limit: 50 });

  return (
    <div className="space-y-6">
      <RecentAnalysesTable initialAnalyses={analyses} />
    </div>
  );
}
