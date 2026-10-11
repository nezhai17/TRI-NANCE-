import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses, getDashboardMetrics } from '@/lib/store/repository';
import { RiskFinding, RiskSeverity, RiskCategory } from '@/lib/types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowRight,
  ExternalLink,
  Search,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RiskCenterClient } from './RiskCenterClient';

export default async function RiskCenterPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const [{ analyses }, metrics] = await Promise.all([
    listAnalyses(userId, { limit: 50 }),
    getDashboardMetrics(userId),
  ]);

  // Aggregate all findings across analyses
  const allFindingsWithMeta: Array<{
    finding: RiskFinding;
    analysisId: string;
    analysisTitle: string;
  }> = [];

  analyses.forEach((a) => {
    (a.findings || []).forEach((f) => {
      allFindingsWithMeta.push({
        finding: f,
        analysisId: a.id,
        analysisTitle: a.title,
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy tracking-tight">
                Commercial Risk Intelligence Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-dossier risk exposure across 12 core commercial disciplines, triage tracking, and severity distribution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/investigations"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <span>Launch Cross-Doc Investigation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stored Findings</span>
          <p className="text-2xl font-bold text-brand-navy mt-1 tabular-nums">{allFindingsWithMeta.length}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Across {analyses.length} active dossiers</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-red-200/80 bg-red-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Critical Urgency</span>
          <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
            {allFindingsWithMeta.filter((f) => f.finding.severity === 'critical').length}
          </p>
          <span className="text-[10px] text-red-500 mt-0.5 block">Requires immediate committee review</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-amber-200/80 bg-amber-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">High Severity</span>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {allFindingsWithMeta.filter((f) => f.finding.severity === 'high').length}
          </p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Material commercial drag</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-emerald-200/80 bg-emerald-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Resolved / Mitigated</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {allFindingsWithMeta.filter((f) => f.finding.reviewStatus === 'resolved').length}
          </p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Verified through audit logs</span>
        </div>
      </div>

      {/* Client-side Interactive Filter & Findings List */}
      <RiskCenterClient initialFindings={allFindingsWithMeta} />
    </div>
  );
}
