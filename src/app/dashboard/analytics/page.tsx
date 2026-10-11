import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses } from '@/lib/store/repository';
import { BarChart3, ArrowRight, Calculator, Sparkles } from 'lucide-react';
import { AnalyticsClient } from './AnalyticsClient';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const { analyses } = await listAnalyses(userId, { limit: 100 });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy tracking-tight">
                Quantitative Financial Analytics & Variance Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic metric parsing, multi-period variance calculations, cash runway modeling, and forensic anomaly detection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/copilot"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Calculate with Copilot</span>
          </Link>
          <Link
            href="/dashboard/evidence"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <span>Cross-Check Evidence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Analytics Tools & Catalog */}
      <AnalyticsClient analyses={analyses} />
    </div>
  );
}
