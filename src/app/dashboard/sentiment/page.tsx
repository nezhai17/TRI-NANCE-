import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses, getDashboardMetrics } from '@/lib/store/repository';
import { TrendingUp, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { SentimentClient } from './SentimentClient';

export default async function SentimentPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const [{ analyses }, metrics] = await Promise.all([
    listAnalyses(userId, { limit: 100 }),
    getDashboardMetrics(userId),
  ]);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy tracking-tight">
                Sentiment & Tone Trajectory Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-dossier tone decomposition, epistemic hedging radar, and positive vs. negative commercial signal extraction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/copilot"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Audit Tone with Copilot</span>
          </Link>
          <Link
            href="/dashboard/risk"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <span>Correlate with Risk Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Client View */}
      <SentimentClient analyses={analyses} metrics={metrics} />
    </div>
  );
}
