'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Send,
  Sparkles,
  Info,
  FileSearch,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  AnalysisRecord,
  CrossDocumentComparison,
  RiskFinding,
  ReviewStatus,
  RiskSeverity,
} from '@/lib/types';

interface FlattenedFinding extends RiskFinding {
  analysisId: string;
  analysisTitle: string;
  sourceCategory: string;
  createdAt: string;
}

export const InvestigationsWorkspace: React.FC = () => {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') as ReviewStatus | null;

  const [activeTab, setActiveTab] = useState<'triage' | 'matrix'>('triage');
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [comparisons, setComparisons] = useState<CrossDocumentComparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Triage state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>(
    initialStatusParam && ['open', 'under_review', 'resolved', 'dismissed'].includes(initialStatusParam)
      ? initialStatusParam
      : 'all'
  );
  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | 'all'>('all');
  const [selectedFinding, setSelectedFinding] = useState<FlattenedFinding | null>(null);

  useEffect(() => {
    const p = searchParams.get('status') as ReviewStatus | null;
    if (p && ['open', 'under_review', 'resolved', 'dismissed'].includes(p)) {
      setStatusFilter(p);
    }
  }, [searchParams]);

  // Triage modal form state
  const [modalStatus, setModalStatus] = useState<ReviewStatus>('open');
  const [dismissalReason, setDismissalReason] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  const handleCopyInquiry = (q: string) => {
    navigator.clipboard.writeText(q);
    setCopiedQuestion(q);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  // Cross-doc matrix state
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [compTitle, setCompTitle] = useState('');
  const [runningComp, setRunningComp] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [activeComparisonId, setActiveComparisonId] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAnalyses, resComps] = await Promise.all([
        fetch('/api/analyses'),
        fetch('/api/investigations'),
      ]);

      if (resAnalyses.ok) {
        const dataA = await resAnalyses.json();
        setAnalyses(dataA.analyses || []);
      }

      if (resComps.ok) {
        const dataC = await resComps.json();
        const compList = dataC.comparisons || [];
        setComparisons(compList);
        if (compList.length > 0 && !activeComparisonId) {
          setActiveComparisonId(compList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load investigation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Flatten all findings across all analyses
  const flattenedFindings: FlattenedFinding[] = useMemo(() => {
    const list: FlattenedFinding[] = [];
    analyses.forEach((a) => {
      (a.findings || []).forEach((f) => {
        list.push({
          ...f,
          analysisId: a.id,
          analysisTitle: a.title,
          sourceCategory: a.sourceCategory,
          createdAt: a.createdAt,
        });
      });
    });
    return list;
  }, [analyses]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return flattenedFindings.filter((f) => {
      const currentStatus = f.reviewStatus || 'open';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesExcerpt = f.excerpt.toLowerCase().includes(q);
        const matchesDoc = f.analysisTitle.toLowerCase().includes(q);
        const matchesCategory = f.categoryLabel.toLowerCase().includes(q);
        return matchesTitle || matchesExcerpt || matchesDoc || matchesCategory;
      }
      return true;
    });
  }, [flattenedFindings, statusFilter, severityFilter, searchQuery]);

  // Counts for triage KPI badges
  const triageCounts = useMemo(() => {
    const counts = { open: 0, under_review: 0, resolved: 0, dismissed: 0, total: 0 };
    flattenedFindings.forEach((f) => {
      const st = f.reviewStatus || 'open';
      if ((counts as Record<string, number>)[st] !== undefined) (counts as Record<string, number>)[st]++;
    });
    counts.total = flattenedFindings.length;
    return counts;
  }, [flattenedFindings]);

  // Open modal handler
  const handleOpenTriageModal = (finding: FlattenedFinding) => {
    setSelectedFinding(finding);
    setModalStatus(finding.reviewStatus || 'open');
    setDismissalReason(finding.resolutionReason || '');
    setNewNoteText('');
    setModalError(null);
    setModalSuccess(null);
  };

  // Submit triage update
  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    if (modalStatus === 'dismissed' && !dismissalReason.trim()) {
      setModalError('Mandatory justification note is required when dismissing a risk finding.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/findings/${selectedFinding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: selectedFinding.analysisId,
          reviewStatus: modalStatus,
          resolutionReason: modalStatus === 'dismissed' || modalStatus === 'resolved' ? dismissalReason : undefined,
          noteText: newNoteText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update finding status');
      }

      setModalSuccess('Finding audit record updated successfully.');
      setNewNoteText('');

      // Refresh data
      await fetchData();

      // Update selected finding locally
      if (data.finding) {
        setSelectedFinding({
          ...selectedFinding,
          ...data.finding,
        });
      }
    } catch (err: any) {
      setModalError(err.message || 'Error updating finding review');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Run new Cross-Document Comparison
  const handleRunComparison = async () => {
    if (selectedDocIds.length < 2) {
      setCompError('Please select at least 2 analyses to run a comparative audit.');
      return;
    }

    setRunningComp(true);
    setCompError(null);

    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisIds: selectedDocIds,
          title: compTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute comparative audit');
      }

      setComparisons((prev) => [data.comparison, ...prev]);
      setActiveComparisonId(data.comparison.id);
      setSelectedDocIds([]);
      setCompTitle('');
    } catch (err: any) {
      setCompError(err.message || 'Comparison failed');
    } finally {
      setRunningComp(false);
    }
  };

  // Delete comparison
  const handleDeleteComparison = async (id: string) => {
    if (!confirm('Are you sure you want to remove this comparative audit from your investigations?')) return;
    try {
      const res = await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComparisons((prev) => prev.filter((c) => c.id !== id));
        if (activeComparisonId === id) {
          const remaining = comparisons.filter((c) => c.id !== id);
          setActiveComparisonId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete comparison', err);
    }
  };

  const activeComparison = comparisons.find((c) => c.id === activeComparisonId);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
            Investigations & Governance Workspace
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Audit risk findings across corporate disclosures, manage review status lifecycles, and analyze cross-period comparative trajectories.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-brand-border">
          <button
            onClick={() => setActiveTab('triage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triage'
                ? 'bg-white text-brand-navy shadow-xs'
                : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Finding Triage Board</span>
            {triageCounts.open > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                {triageCounts.open}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-white text-brand-navy shadow-xs'
                : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-brand-accent" />
            <span>Cross-Document Matrix</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {comparisons.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: FINDING TRIAGE & AUDIT GOVERNANCE */}
      {activeTab === 'triage' && (
        <div className="space-y-6">
          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                statusFilter === 'open'
                  ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/20'
                  : 'bg-white border-brand-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Open Findings</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">{triageCounts.open}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Require audit examination</p>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'under_review' ? 'all' : 'under_review')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                statusFilter === 'under_review'
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20'
                  : 'bg-white border-brand-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Under Review</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{triageCounts.under_review}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active analyst triage</p>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20'
                  : 'bg-white border-brand-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{triageCounts.resolved}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mitigated or audited</p>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'dismissed' ? 'all' : 'dismissed')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                statusFilter === 'dismissed'
                  ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
                  : 'bg-white border-brand-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dismissed</span>
                <XCircle className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-slate-700 mt-2">{triageCounts.dismissed}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Audited as immaterial</p>
            </div>
          </div>

          {/* Audit Resolution Progress Meter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-navy flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Audit Triage Resolution Progress
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">
                {triageCounts.total > 0
                  ? Math.round(((triageCounts.resolved + triageCounts.dismissed) / triageCounts.total) * 100)
                  : 0}
                % Cleared ({triageCounts.resolved + triageCounts.dismissed}/{triageCounts.total})
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${triageCounts.total > 0 ? (triageCounts.resolved / triageCounts.total) * 100 : 0}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`Resolved: ${triageCounts.resolved}`}
              />
              <div
                style={{
                  width: `${triageCounts.total > 0 ? (triageCounts.under_review / triageCounts.total) * 100 : 0}%`,
                }}
                className="bg-blue-500 h-full transition-all"
                title={`Under Review: ${triageCounts.under_review}`}
              />
              <div
                style={{
                  width: `${triageCounts.total > 0 ? (triageCounts.open / triageCounts.total) * 100 : 0}%`,
                }}
                className="bg-red-500 h-full transition-all"
                title={`Open: ${triageCounts.open}`}
              />
              <div
                style={{
                  width: `${triageCounts.total > 0 ? (triageCounts.dismissed / triageCounts.total) * 100 : 0}%`,
                }}
                className="bg-slate-400 h-full transition-all"
                title={`Dismissed: ${triageCounts.dismissed}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved ({triageCounts.resolved})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Under Review ({triageCounts.under_review})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Open ({triageCounts.open})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Dismissed ({triageCounts.dismissed})
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-brand-border">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search findings, keywords, or excerpts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent text-brand-text-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-border bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-accent"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-border bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-accent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              {(statusFilter !== 'all' || severityFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSeverityFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-brand-accent hover:underline px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-brand-border p-6">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-brand-text-primary">No risk findings match your filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {flattenedFindings.length === 0
                  ? 'Run an analysis on financial disclosures to detect and triage risk patterns.'
                  : 'Try adjusting your search criteria or resetting the status/severity filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((finding) => {
                const currentStatus = finding.reviewStatus || 'open';
                return (
                  <div
                    key={`${finding.analysisId}-${finding.id}`}
                    className="p-4 bg-white rounded-xl border border-brand-border hover:shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="severity" severity={finding.severity} size="sm">
                          {finding.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {finding.categoryLabel}
                        </Badge>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            finding.epistemicCertainty === 'hedged_projection'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {finding.epistemicCertainty === 'hedged_projection' ? 'Hedged' : 'Fact'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            currentStatus === 'open'
                              ? 'bg-red-100 text-red-700'
                              : currentStatus === 'under_review'
                              ? 'bg-blue-100 text-blue-700'
                              : currentStatus === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {currentStatus.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          in <span className="font-medium text-slate-600">{finding.analysisTitle}</span>
                        </span>
                      </div>

                      {/* Finding Title & Rationale */}
                      <div>
                        <h4 className="text-sm font-semibold text-brand-text-primary">{finding.title}</h4>
                        <p className="text-xs text-brand-text-secondary mt-1">{finding.explanation}</p>
                      </div>

                      {/* Excerpt Quote */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border-l-2 border-brand-accent text-xs font-mono text-slate-700 italic">
                        "{finding.excerpt}"
                      </div>

                      {/* Notes indicator or dismissal rationale */}
                      {finding.resolutionReason && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-200/60">
                          <span className="font-semibold text-amber-800">Resolution Justification:</span> {finding.resolutionReason}
                        </div>
                      )}

                      {finding.reviewNotes && finding.reviewNotes.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-brand-accent">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{finding.reviewNotes.length} investigation note(s) logged</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex items-center md:flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenTriageModal(finding)}
                        className="w-full md:w-auto"
                      >
                        Triage & Notes
                      </Button>
                      <Link
                        href={`/dashboard/reports/${finding.analysisId}`}
                        className="text-[11px] text-brand-accent hover:underline flex items-center gap-1"
                      >
                        <span>Inspect in Report</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CROSS-DOCUMENT COMPARATIVE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Comparison Builder Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-brand-accent" />
                <span>Initiate Cross-Document Comparative Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-600">
                Select 2 or more analyzed reports to compare multi-period trajectories, detect recurring risk themes, identify newly emerged threats, and reveal narrative-vs-metric contradictions.
              </p>

              {/* Title input */}
              <div className="max-w-md">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Investigation Audit Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 vs Q4 Solvency & Covenant Audit"
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent text-brand-text-primary"
                />
              </div>

              {/* Document selection checklist */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Select Completed Reports to Compare ({selectedDocIds.length} selected)
                </label>
                {analyses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No analyzed reports available yet. Run an analysis first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {analyses.map((a) => {
                      const isSelected = selectedDocIds.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDocIds(selectedDocIds.filter((id) => id !== a.id));
                            } else {
                              setSelectedDocIds([...selectedDocIds, a.id]);
                            }
                          }}
                          className={`cursor-pointer p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-brand-accent/10 border-brand-accent text-brand-navy font-medium'
                              : 'bg-white border-brand-border text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-brand-accent"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{a.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {a.sourceCategory.replace('_', ' ')} • {new Date(a.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {compError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {compError}
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunComparison}
                disabled={runningComp || selectedDocIds.length < 2}
                isLoading={runningComp}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Execute Cross-Document Audit
              </Button>
            </CardContent>
          </Card>

          {/* Saved Investigations List & Active Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar: Saved Comparisons */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Saved Comparative Audits ({comparisons.length})
              </h3>

              {comparisons.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-brand-border text-center text-xs text-slate-400">
                  No multi-document investigations created yet.
                </div>
              ) : (
                comparisons.map((c) => {
                  const isActive = c.id === activeComparisonId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveComparisonId(c.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-white border-brand-accent shadow-xs ring-1 ring-brand-accent'
                          : 'bg-white border-brand-border hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-brand-text-primary truncate">{c.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {c.documentTitles?.length || c.documentIds.length} filings • {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComparison(c.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                          {c.recurringRiskThemes?.length || 0} recurring risks
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                          {c.contradictionsBetweenDocuments?.length || 0} contradictions
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Main Area: Active Investigation Matrix */}
            <div className="lg:col-span-2 space-y-5">
              {!activeComparison ? (
                <div className="p-8 bg-white rounded-xl border border-brand-border text-center">
                  <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-brand-text-primary">Select an investigation audit</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a comparative audit from the left column or initiate a new one above.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Executive Summary Card */}
                  <Card className="border-l-4 border-l-brand-accent">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-brand-text-primary">{activeComparison.title}</CardTitle>
                        <span className="text-[11px] text-slate-400">
                          {new Date(activeComparison.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                        {activeComparison.investigationSummary}
                      </p>

                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Compared Filings: </span>
                        {activeComparison.documentTitles?.join('  →  ')}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 1. Sentiment Trajectory Flow */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-brand-accent" />
                        <span>Sentiment Trajectory Across Periods</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {activeComparison.sentimentTrajectory?.map((t, idx) => {
                          const isPos = t.overall === 'positive';
                          const isNeg = t.overall === 'negative';
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border flex flex-col justify-between ${
                                isPos
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : isNeg
                                  ? 'bg-red-50/50 border-red-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Period {idx + 1}
                                </span>
                                <h5 className="text-xs font-semibold text-brand-text-primary truncate mt-0.5">
                                  {t.documentTitle}
                                </h5>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold uppercase ${
                                    isPos
                                      ? 'text-emerald-700'
                                      : isNeg
                                      ? 'text-red-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {t.overall}
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-700">
                                  {t.score > 0 ? `+${t.score}` : t.score}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2. Recurring Risk Themes */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>Recurring Multi-Period Risk Themes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(!activeComparison.recurringRiskThemes || activeComparison.recurringRiskThemes.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No persistent risk categories detected across multiple periods.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {activeComparison.recurringRiskThemes.map((r, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="severity" severity="medium" size="sm">
                                    {r.categoryLabel}
                                  </Badge>
                                  <span className="text-xs font-semibold text-slate-800">
                                    {r.occurrencesCount} total finding(s)
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Persisted across: {r.documentMentions?.join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 3. Newly Emerged Threats */}
                  {activeComparison.newlyObservedRisks && activeComparison.newlyObservedRisks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Newly Emerged Risk Categories</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeComparison.newlyObservedRisks.map((n, idx) => (
                            <div key={idx} className="p-3 bg-red-50/40 rounded-lg border border-red-200 space-y-1">
                              <Badge variant="severity" severity="critical" size="sm">
                                {n.categoryLabel}
                              </Badge>
                              <h5 className="text-xs font-semibold text-red-950 mt-1">{n.findingTitle}</h5>
                              <p className="text-[11px] text-red-700/80">
                                First disclosed in: <span className="font-semibold">{n.firstObservedIn}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 4. Cross-Period Contradictions */}
                  {activeComparison.contradictionsBetweenDocuments && activeComparison.contradictionsBetweenDocuments.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-amber-500" />
                          <span>Inter-Document Discrepancies & Contradictions</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {activeComparison.contradictionsBetweenDocuments.map((c, idx) => (
                          <div key={idx} className="p-3.5 bg-amber-50/30 rounded-xl border border-amber-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-amber-950">{c.title}</h5>
                              <Badge variant="severity" severity={c.severity} size="sm">{c.severity.toUpperCase()}</Badge>
                            </div>
                            <p className="text-xs text-slate-700">{c.description}</p>

                            {/* Side-by-side excerpts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {c.comparedExcerpts?.map((ex, exIdx) => (
                                <div key={exIdx} className="p-2.5 rounded-lg bg-white border border-amber-200/60 text-xs">
                                  <span className="font-semibold text-slate-700 block text-[11px]">{ex.label}</span>
                                  <p className="font-mono text-slate-600 italic text-[11px] mt-1">"{ex.text}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRIAGE MODAL */}
      {selectedFinding && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFinding(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-brand-border space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-brand-border pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Risk Finding Governance
                </span>
                <h3 className="text-base font-bold text-brand-text-primary mt-0.5">
                  {selectedFinding.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Context & Verified Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="severity" severity={selectedFinding.severity} size="sm">
                  {selectedFinding.severity.toUpperCase()}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {selectedFinding.categoryLabel}
                </Badge>
                <span className="text-xs text-slate-500">Doc: {selectedFinding.analysisTitle}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border-l-2 border-brand-accent text-xs font-mono text-slate-700 italic">
                "{selectedFinding.excerpt}"
              </div>
              <p className="text-xs text-slate-600">{selectedFinding.explanation}</p>

              {/* Signal Certainty & Epistemic Grounding */}
              <div className="p-2.5 rounded-lg border bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Signal Certainty Level
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedFinding.epistemicCertainty === 'hedged_projection'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedFinding.epistemicCertainty === 'ambiguous_disclosure'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedFinding.epistemicCertainty
                      ? selectedFinding.epistemicCertainty.replace(/_/g, ' ')
                      : 'Documented Fact'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {selectedFinding.uncertaintyRationale ||
                    'Direct disclosure grounded in contractual representations.'}
                </p>
              </div>

              {/* Targeted Management Diligence Questions */}
              {selectedFinding.investigationDiligence && (
                <div className="space-y-2.5 p-3 rounded-xl bg-blue-50/40 border border-blue-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                    <FileSearch className="w-4 h-4 text-brand-accent" />
                    <span>Targeted Diligence Inquiries for Management</span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedFinding.investigationDiligence.questionsForManagement.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2 rounded bg-white border border-blue-100 text-xs"
                      >
                        <p className="font-medium text-slate-800 leading-relaxed">"{q}"</p>
                        <button
                          type="button"
                          onClick={() => handleCopyInquiry(q)}
                          className="p-1 text-slate-400 hover:text-brand-navy shrink-0"
                          title="Copy question"
                        >
                          {copiedQuestion === q ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedFinding.investigationDiligence.identifiedInformationGap && (
                    <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200/70">
                      <span className="font-semibold text-amber-800">Information Gap: </span>
                      {selectedFinding.investigationDiligence.identifiedInformationGap}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Triage Update Form */}
            <form onSubmit={handleSubmitTriage} className="space-y-4 pt-2 border-t border-brand-border">
              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Audit Review Lifecycle Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['open', 'under_review', 'resolved', 'dismissed'] as ReviewStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        modalStatus === st
                          ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification if Dismissed or Resolved */}
              {(modalStatus === 'dismissed' || modalStatus === 'resolved') && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {modalStatus === 'dismissed' ? 'Mandatory Audit Dismissal Reason *' : 'Resolution Rationale'}
                  </label>
                  <input
                    type="text"
                    required={modalStatus === 'dismissed'}
                    placeholder="e.g. Audited as immaterial; offset by revolving credit facility"
                    value={dismissalReason}
                    onChange={(e) => setDismissalReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                  {modalStatus === 'dismissed' && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      * Dismissing a risk finding requires documented analyst justification for compliance records.
                    </p>
                  )}
                </div>
              )}

              {/* Add Note Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Log Investigation Note
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder="Add working notes, findings from management inquiries, or audit memos..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                  />
                </div>
              </div>

              {/* Feedback messages */}
              {modalError && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                  {modalSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFinding(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={modalSubmitting}
                >
                  Save Triage Record
                </Button>
              </div>
            </form>

            {/* Historical Notes Thread */}
            {selectedFinding.reviewNotes && selectedFinding.reviewNotes.length > 0 && (
              <div className="pt-3 border-t border-brand-border space-y-2">
                <h4 className="text-xs font-semibold text-slate-700">Audit Notes History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFinding.reviewNotes.map((note) => (
                    <div key={note.id} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-700">{note.author}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
