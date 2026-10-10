import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics, listAnalyses } from '@/lib/store/repository';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { AnalyticalCharts } from '@/components/dashboard/AnalyticalCharts';
import { RecentAnalysesTable } from '@/components/dashboard/RecentAnalysesTable';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const metrics = await getDashboardMetrics(userId);
  const { analyses } = await listAnalyses(userId, { limit: 15 });

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            Welcome, {user?.fullName || 'Analyst'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active workspace for financial sentiment scoring, 12-category risk pattern detection, and evidence grounding.
          </p>
        </div>
      </div>

      {/* 4 Real Computed Metrics */}
      <MetricCards metrics={metrics} />

      {/* Recharts Visualizations */}
      <AnalyticalCharts metrics={metrics} />

      {/* Interactive Recent Analyses Table */}
      <RecentAnalysesTable initialAnalyses={analyses} />
    </div>
  );
}
