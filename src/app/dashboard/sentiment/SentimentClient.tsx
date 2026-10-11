'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { AnalysisRecord, DashboardMetrics, SentimentSignal } from '@/lib/types';
import { SentimentTrajectoryChart } from '@/components/visualization/SentimentTrajectoryChart';
import { EpistemicRadarDonut } from '@/components/visualization/EpistemicRadarDonut';

interface SentimentClientProps {
  analyses: AnalysisRecord[];
  metrics: DashboardMetrics;
}

export const SentimentClient: React.FC<SentimentClientProps> = ({ analyses, metrics }) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'positive' | 'negative' | 'neutral' | 'hedged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossier, setSelectedDossier] = useState<string>('all');

  // Extract all signals across analyses
  const { allSignals, hedgingStats, epistemicStats, avgScore, aspectStats, customerIssueClusters } = useMemo(() => {
    const signals: Array<{
      signal: SentimentSignal;
      type: 'positive' | 'negative' | 'neutral' | 'hedged';
      analysisId: string;
      analysisTitle: string;
    }> = [];

    const hedgeTerms: Record<string, number> = {};
    const epistemic: Record<string, number> = {};
    let totalScore = 0;
    let scoreCount = 0;

    analyses.forEach((a) => {
      const res = a.sentimentResult;
      if (!res) return;

      totalScore += res.score;
      scoreCount++;

      (res.positiveSignals || []).forEach((s) => {
        signals.push({ signal: s, type: 'positive', analysisId: a.id, analysisTitle: a.title });
        if (s.epistemicCertainty) {
          epistemic[s.epistemicCertainty] = (epistemic[s.epistemicCertainty] || 0) + 1;
        }
        (s.hedgingTerms || []).forEach((t) => {
          hedgeTerms[t.toLowerCase()] = (hedgeTerms[t.toLowerCase()] || 0) + 1;
        });
      });

      (res.negativeSignals || []).forEach((s) => {
        signals.push({ signal: s, type: 'negative', analysisId: a.id, analysisTitle: a.title });
        if (s.epistemicCertainty) {
          epistemic[s.epistemicCertainty] = (epistemic[s.epistemicCertainty] || 0) + 1;
        }
        (s.hedgingTerms || []).forEach((t) => {
          hedgeTerms[t.toLowerCase()] = (hedgeTerms[t.toLowerCase()] || 0) + 1;
        });
      });

      (res.neutralSignals || []).forEach((s) => {
        signals.push({ signal: s, type: 'neutral', analysisId: a.id, analysisTitle: a.title });
      });

      (res.hedgedSignals || []).forEach((s) => {
        signals.push({ signal: s, type: 'hedged', analysisId: a.id, analysisTitle: a.title });
        (s.hedgingTerms || []).forEach((t) => {
          hedgeTerms[t.toLowerCase()] = (hedgeTerms[t.toLowerCase()] || 0) + 1;
        });
      });
    });

    // Aggregate Aspect-Based Sentiment Analysis across dossiers
    const aspectAggregation: Record<string, { label: string; pos: number; neg: number; count: number }> = {};
    const customerClusters: Array<any> = [];

    analyses.forEach((a) => {
      (a.sentimentResult?.aspects || []).forEach((asp) => {
        if (!aspectAggregation[asp.topic]) {
          aspectAggregation[asp.topic] = { label: asp.topicLabel, pos: 0, neg: 0, count: 0 };
        }
        if (asp.sentiment === 'positive') aspectAggregation[asp.topic].pos += asp.mentionCount;
        else if (asp.sentiment === 'negative') aspectAggregation[asp.topic].neg += asp.mentionCount;
        aspectAggregation[asp.topic].count += asp.mentionCount;
      });

      if (a.sentimentResult?.customerIntelligence) {
        customerClusters.push(...a.sentimentResult.customerIntelligence.issueClusters);
      }
    });

    const average = scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : '0.00';

    return {
      allSignals: signals,
      hedgingStats: hedgeTerms,
      epistemicStats: epistemic,
      avgScore: average,
      aspectStats: aspectAggregation,
      customerIssueClusters: customerClusters,
    };
  }, [analyses]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    return allSignals.filter((item) => {
      if (selectedTab !== 'all' && item.type !== selectedTab) {
        return false;
      }
      if (selectedDossier !== 'all' && item.analysisId !== selectedDossier) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesExcerpt = item.signal.excerpt.toLowerCase().includes(q);
        const matchesLabel = item.signal.label.toLowerCase().includes(q);
        const matchesDossier = item.analysisTitle.toLowerCase().includes(q);
        return matchesExcerpt || matchesLabel || matchesDossier;
      }
      return true;
    });
  }, [allSignals, selectedTab, selectedDossier, searchQuery]);

  const positiveCount = allSignals.filter((s) => s.type === 'positive').length;
  const negativeCount = allSignals.filter((s) => s.type === 'negative').length;
  const hedgedCount = allSignals.filter((s) => s.type === 'hedged' || (s.signal.hedgingTerms && s.signal.hedgingTerms.length > 0)).length;

  return (
    <div className="space-y-6">
      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Tone Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-brand-navy tabular-nums">
              {Number(avgScore) > 0 ? `+${avgScore}` : avgScore}
            </p>
            <span className="text-xs text-slate-400 font-medium">scale -1.0 to +1.0</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Aggregated across all completed filings</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200/70 bg-emerald-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Positive Drivers</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{positiveCount}</p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Verbatim growth & catalyst statements</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-rose-200/70 bg-rose-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Adverse Indicators</span>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{negativeCount}</p>
          <span className="text-[10px] text-rose-600 mt-0.5 block">{metrics.negativeSentimentShare}% negative share</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200/70 bg-amber-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Hedged & Conditional</span>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{hedgedCount}</p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Statements with speculative qualifiers</span>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentTrajectoryChart
            analyses={analyses}
            onSelectDossier={(id) => setSelectedDossier(id)}
          />
        </div>
        <div>
          <EpistemicRadarDonut epistemicStats={epistemicStats} />
        </div>
      </div>

      {/* Grid: Hedged Language Radar & Trajectory List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hedged Language & Epistemic Certainty */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Epistemic Hedging Radar
              </h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Audit Defense</span>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Detects linguistic hedging patterns in corporate disclosures that indicate veiled uncertainty, conditional expectations, or management downside hedging.
            </p>

            {/* Top Hedging Terms */}
            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">Frequently Disclosed Hedging Terms:</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(hedgingStats).length > 0 ? (
                  Object.entries(hedgingStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([term, count]) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium"
                      >
                        <span className="font-mono font-semibold italic">&quot;{term}&quot;</span>
                        <span className="px-1.5 py-0.2 bg-amber-200/60 rounded text-[10px] font-bold tabular-nums">
                          {count}
                        </span>
                      </span>
                    ))
                ) : (
                  ['may', 'could', 'subject to', 'anticipates', 'potentially', 'estimates'].map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono"
                    >
                      &quot;{term}&quot;
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Epistemic Distribution */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Statement Grounding:</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Direct Fact Grounded
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{epistemicStats['fact_grounded'] || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Management Projection
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{epistemicStats['management_projection'] || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Hedged Conditional
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{epistemicStats['hedged_conditional'] || 0}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Speculative / Subjective
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{epistemicStats['speculative'] || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Grounding classifications align with SEC 10-K Safe Harbor disclosure rules.
          </div>
        </div>

        {/* Multi-Dossier Tone Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-primary" />
              Dossier Tone Trajectory
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {analyses.length} Available Dossiers
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {analyses.map((a) => {
              const res = a.sentimentResult;
              const score = res?.score ?? 0;
              const isPositive = score > 0.15;
              const isNegative = score < -0.15;
              const badgeColor = isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isNegative
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200';

              return (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-brand-navy truncate">
                        {a.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeColor}`}
                      >
                        {res?.overall || 'Analyzed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                      {res?.summary || a.inputText.substring(0, 100)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Tone Score</span>
                      <span
                        className={`text-sm font-bold tabular-nums font-mono ${
                          isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/analyze/${a.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-200/60 transition-colors"
                      title="Open full dossier"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {analyses.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                No analyzed dossiers found. Upload or ingest a filing to generate tone metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aspect-Based Sentiment & Customer Themes Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aspect-Based Sentiment Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-primary" />
                Aspect-Based Sentiment Distribution (ABSA)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Multi-aspect sentiment classification across commercial operations, pricing, and service.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {Object.keys(aspectStats).length} Topics Detected
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(aspectStats).map(([topic, data]) => {
              const net = data.pos - data.neg;
              const isFavorable = net > 0;
              const isUnfavorable = net < 0;
              return (
                <div key={topic} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-navy">{data.label}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] text-slate-400">{data.count} mentions</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isFavorable
                            ? 'bg-emerald-100 text-emerald-800'
                            : isUnfavorable
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isFavorable ? 'Favorable' : isUnfavorable ? 'Adverse' : 'Neutral'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${data.count > 0 ? (data.pos / data.count) * 100 : 0}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${data.count > 0 ? (data.neg / data.count) * 100 : 0}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(aspectStats).length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs">
                No aspect sentiment topics extracted in current analysis batch.
              </p>
            )}
          </div>
        </div>

        {/* Customer Text Issue Clusters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Customer Text & Complaint Clusters
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deduplicated issue clusters from reviews, tickets, and customer commentary.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {customerIssueClusters.length} Clusters Logged
            </span>
          </div>

          <div className="space-y-3">
            {customerIssueClusters.slice(0, 4).map((cluster: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-navy">{cluster.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {cluster.frequency} Reports ({cluster.distinctSourcesCount} Unique)
                  </span>
                </div>
                {cluster.representativeExcerpts?.[0] && (
                  <p className="text-[11px] text-slate-500 italic line-clamp-1">
                    &quot;{cluster.representativeExcerpts[0]}&quot;
                  </p>
                )}
              </div>
            ))}

            {customerIssueClusters.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs">
                No customer complaint clusters detected in ingested customer records.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Signal Explorer & Excerpts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Verified Tone Signals & Excerpt Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Source-anchored narrative passages categorized by directional tone and audit evidence classification.
            </p>
          </div>

          {/* Search & Dossier Selector */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search signal excerpts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary w-48 sm:w-60"
              />
            </div>

            <select
              value={selectedDossier}
              onChange={(e) => setSelectedDossier(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary max-w-[160px]"
            >
              <option value="all">All Dossiers</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedTab === 'all'
                ? 'bg-brand-navy text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Signals ({allSignals.length})
          </button>
          <button
            onClick={() => setSelectedTab('positive')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedTab === 'positive'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            Positive ({positiveCount})
          </button>
          <button
            onClick={() => setSelectedTab('negative')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedTab === 'negative'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            Adverse ({negativeCount})
          </button>
          <button
            onClick={() => setSelectedTab('hedged')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedTab === 'hedged'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            Hedged & Speculative ({hedgedCount})
          </button>
        </div>

        {/* Signal Cards Feed */}
        <div className="p-5 space-y-3.5">
          {filteredSignals.map((item, idx) => {
            const isPos = item.type === 'positive';
            const isNeg = item.type === 'negative';
            const isHedge = item.type === 'hedged';

            return (
              <div
                key={`${item.signal.id || idx}-${idx}`}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/40 transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isPos
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isNeg
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isHedge
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-brand-navy">
                      {item.signal.label || 'Verbatim Tone Excerpt'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {item.signal.epistemicCertainty && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                        {item.signal.epistemicCertainty.replace('_', ' ')}
                      </span>
                    )}
                    <Link
                      href={`/dashboard/analyze/${item.analysisId}`}
                      className="text-[11px] text-brand-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <span>{item.analysisTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Excerpt Body */}
                <div className="p-3 rounded-lg bg-slate-50 border-l-4 border-slate-300 text-xs text-slate-700 leading-relaxed font-sans">
                  &ldquo;{item.signal.excerpt}&rdquo;
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    {item.signal.sourceLocation?.line && (
                      <span className="font-mono text-[10px] text-slate-400">
                        Line {item.signal.sourceLocation.line}
                      </span>
                    )}
                    {item.signal.hedgingTerms && item.signal.hedgingTerms.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-amber-700 font-semibold">Hedging markers:</span>
                        {item.signal.hedgingTerms.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded bg-amber-100/70 text-amber-800 text-[10px] font-mono italic"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Score: {item.signal.score > 0 ? `+${item.signal.score.toFixed(2)}` : item.signal.score.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredSignals.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No sentiment signals match the specified filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
