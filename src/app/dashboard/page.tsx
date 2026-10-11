import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics, listAnalyses, listInvestigationComparisons } from '@/lib/store/repository';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { AnalyticalCharts } from '@/components/dashboard/AnalyticalCharts';
import { RecentAnalysesTable } from '@/components/dashboard/RecentAnalysesTable';
import { ActivityStream } from '@/components/dashboard/ActivityStream';
import {
  ShieldAlert,
  TrendingUp,
  BarChart3,
  SearchCheck,
  Compass,
  Bot,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const [metrics, { analyses }, investigations] = await Promise.all([
    getDashboardMetrics(userId),
    listAnalyses(userId, { limit: 10 }),
    listInvestigationComparisons(userId),
  ]);

  return (
    <div className="space-y-6">
      {/* Overview Operational Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-navy tracking-tight">
              Executive Intelligence Overview
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Production Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Operational summary across {metrics.totalCompletedAnalyses} evaluated filings, {metrics.openHighSeverityFindings} active high-urgency findings, and {investigations.length} comparative investigations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/copilot"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Bot className="w-4 h-4 text-brand-accent" />
            <span>Launch Copilot</span>
          </Link>
          <Link
            href="/dashboard/analyze"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <span>New Ingestion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Core Computed Financial & Risk Metrics */}
      <MetricCards metrics={metrics} />

      {/* Quick Workspace Nav Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/dashboard/risk"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/20 transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-red-600 uppercase">
              {metrics.openHighSeverityFindings} Urgent
            </span>
          </div>
          <h3 className="text-xs font-bold text-brand-navy">Risk Center</h3>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">12-category commercial matrix & triage</p>
        </Link>

        <Link
          href="/dashboard/sentiment"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-blue-600 uppercase">
              {metrics.negativeSentimentShare}% Negative
            </span>
          </div>
          <h3 className="text-xs font-bold text-brand-navy">Sentiment Analytics</h3>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Tone trajectory & hedging radar</p>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Math Tools</span>
          </div>
          <h3 className="text-xs font-bold text-brand-navy">Financial Analytics</h3>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Variance math & runway runway</p>
        </Link>

        <Link
          href="/dashboard/evidence"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <SearchCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-amber-600 uppercase">Provenance</span>
          </div>
          <h3 className="text-xs font-bold text-brand-navy">Evidence Explorer</h3>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Verbatim citations & contradictions</p>
        </Link>
      </div>

      {/* Visual Analytics Charts */}
      <AnalyticalCharts metrics={metrics} analyses={analyses} />

      {/* Activity & Recent Dossiers Grid */}
      <div className="space-y-6">
        <ActivityStream />
        <RecentAnalysesTable initialAnalyses={analyses} />
      </div>
    </div>
  );
}
