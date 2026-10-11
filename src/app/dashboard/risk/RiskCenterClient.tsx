'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskFinding, RiskSeverity, ReviewStatus } from '@/lib/types';
import { CategoryStackedBar } from '@/components/visualization/CategoryStackedBar';
import { RiskPriorityMatrix } from '@/components/visualization/RiskPriorityMatrix';

interface FindingItem {
  finding: RiskFinding;
  analysisId: string;
  analysisTitle: string;
}

export const RiskCenterClient: React.FC<{ initialFindings: FindingItem[] }> = ({ initialFindings }) => {
  const [findings, setFindings] = useState<FindingItem[]>(initialFindings);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(findings.map((f) => f.finding.categoryLabel))).sort();

  // Filter findings
  const filtered = findings.filter((item) => {
    const f = item.finding;
    const matchesSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      item.analysisTitle.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesCategory =
      selectedCategory === 'all' ||
      f.categoryLabel === selectedCategory ||
      f.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      (f.reviewStatus || 'open') === selectedStatus;

    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  const handleUpdateStatus = async (item: FindingItem, newStatus: ReviewStatus) => {
    setUpdatingId(item.finding.id);
    try {
      const res = await fetch(`/api/findings/${item.finding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: newStatus,
          analysisId: item.analysisId,
          resolutionReason: newStatus === 'resolved' ? 'Resolved via Risk Center triage.' : undefined,
        }),
      });

      if (res.ok) {
        setFindings((prev) =>
          prev.map((f) =>
            f.finding.id === item.finding.id
              ? { ...f, finding: { ...f.finding, reviewStatus: newStatus } }
              : f
          )
        );
      }
    } catch {
      // Non-blocking
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryStackedBar
          findings={findings}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
        <RiskPriorityMatrix
          findings={findings}
          onSelectFinding={(id) => {
            setSelectedFindingId(id);
            const el = document.getElementById(`finding-${id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          selectedFindingId={selectedFindingId}
        />
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search risk findings, covenants, debt, operational disruptions..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none max-w-[160px]"
          >
            <option value="all">All 12 Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Review Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Findings Results List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No risk findings match the selected filters.
          </div>
        ) : (
          filtered.map((item) => {
            const f = item.finding;
            const status = f.reviewStatus || 'open';

            return (
              <div
                key={f.id}
                id={`finding-${f.id}`}
                className={`p-4 rounded-xl bg-white border transition-all shadow-2xs space-y-3 ${
                  selectedFindingId === f.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        f.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : f.severity === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : f.severity === 'medium'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-xs font-bold text-brand-navy">
                      {f.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {f.categoryLabel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'under_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 italic">
                  &ldquo;{f.excerpt}&rdquo;
                </div>

                {/* Explanation & Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">Explanation:</span>
                    <p className="text-[11px] mt-0.5">{f.explanation}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Potential Commercial Impact:</span>
                    <p className="text-[11px] mt-0.5">{f.potentialImpact || 'Requires investigative cross-examination.'}</p>
                  </div>
                </div>

                {/* Footer Controls & Triage Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <Link
                    href={`/dashboard/reports/${item.analysisId}`}
                    className="text-brand-navy hover:text-brand-accent font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Source: {item.analysisTitle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {status !== 'resolved' ? (
                      <button
                        onClick={() => handleUpdateStatus(item, 'resolved')}
                        disabled={updatingId === f.id}
                        className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors flex items-center gap-1"
                      >
                        {updatingId === f.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(item, 'open')}
                        disabled={updatingId === f.id}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                      >
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
