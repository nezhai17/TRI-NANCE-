import { getCurrentUser } from '@/lib/auth';
import { listAnalyses } from '@/lib/store/repository';
import { ReportsHub } from '@/components/reports/ReportsHub';

export default async function ReportsHubPage() {
  const user = await getCurrentUser();
  const { analyses } = await listAnalyses(user?.id || '', { limit: 100 });

  return <ReportsHub initialAnalyses={analyses} />;
}
