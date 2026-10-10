import React from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, ShieldCheck, TrendingDown, PlusCircle } from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  if (metrics.totalCompletedAnalyses === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-brand-text-primary">No Financial Analyses Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit your first financial statement, earnings commentary, or customer write-up to unlock real sentiment scoring and multi-category risk pattern detection.
            </p>
          </div>
          <Link href="/dashboard/analyze" className="inline-block">
            <Button variant="primary" size="md">
              Start First Analysis
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Completed Analyses */}
      <Card className="hover:border-slate-300 transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Analyses
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-accent flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-brand-text-primary font-mono">
              {metrics.totalCompletedAnalyses}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fully verified intelligence dossiers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Negative Sentiment Share */}
      <Card className="hover:border-slate-300 transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Adverse Sentiment Share
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-danger flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-brand-danger font-mono">
              {metrics.negativeSentimentShare}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.negativeCount} of {metrics.eligibleCompletedCount} evaluated reports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Open High & Critical Severity Findings */}
      <Card className="hover:border-slate-300 transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              High & Critical Risks
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-600 font-mono">
              {metrics.openHighSeverityFindings}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Urgent covenant, liquidity & control flags
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Recent Analysis Activity */}
      <Card className="hover:border-slate-300 transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              7-Day Activity
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-700 font-mono">
              {metrics.recentActivityCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Submissions in the past 7 days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
