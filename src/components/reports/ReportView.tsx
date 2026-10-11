'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronRight,
  Shield,
  Layers,
  ArrowLeft,
  Search,
  CheckCircle2,
  DollarSign,
  AlertOctagon,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Copy,
  Check,
  Compass,
  FileSearch,
  Info,
  Sparkles,
  LayoutTemplate,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AnalysisRecord,
  RiskFinding,
  SentimentSignal,
  RiskSeverity,
  ReviewStatus,
  EpistemicCertainty,
} from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ReportViewProps {
  analysis: AnalysisRecord;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysis }) => {
  const [activeViewTab, setActiveViewTab] = useState<'tripartite' | 'executive'>('tripartite');
  const [findings, setFindings] = useState<RiskFinding[]>(analysis.findings || []);
  const [selectedFinding, setSelectedFinding] = useState<RiskFinding | null>(
    analysis.findings?.[0] || null
  );
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('all');
  const [certaintyFilter, setCertaintyFilter] = useState<string>('all');
  const [findingSearch, setFindingSearch] = useState('');
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);
  const documentViewerRef = useRef<HTMLDivElement>(null);
  const sourceViewerRef = useRef<HTMLDivElement>(null);

  // Drawer triage form state
  const [triageStatus, setTriageStatus] = useState<ReviewStatus>(
    (analysis.findings?.[0]?.reviewStatus as ReviewStatus) || 'open'
  );
  const [triageReason, setTriageReason] = useState(
    analysis.findings?.[0]?.resolutionReason || ''
  );
  const [triageNote, setTriageNote] = useState('');
  const [triageSaving, setTriageSaving] = useState(false);
  const [triageMsg, setTriageMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectFinding = (finding: RiskFinding) => {
    setSelectedFinding(finding);
    setTriageStatus(finding.reviewStatus || 'open');
    setTriageReason(finding.resolutionReason || '');
    setTriageNote('');
    setTriageMsg(null);

    // Smooth scroll to highlighted evidence anchor
    const el = document.getElementById(`evidence-anchor-${finding.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInquiry = (question: string) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestion(question);
    setTimeout(() => {
      setCopiedQuestion(null);
    }, 2000);
  };

  // Triage update submission
  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    if (triageStatus === 'dismissed' && !triageReason.trim()) {
      setTriageMsg({
        type: 'error',
        text: 'Mandatory audit justification is required when dismissing a finding.',
      });
      return;
    }

    setTriageSaving(true);
    setTriageMsg(null);

    try {
      const res = await fetch(`/api/findings/${selectedFinding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysis.id,
          reviewStatus: triageStatus,
          resolutionReason:
            triageStatus === 'dismissed' || triageStatus === 'resolved'
              ? triageReason.trim()
              : undefined,
          noteText: triageNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update finding status');

      const updated = data.finding;
      setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSelectedFinding(updated);
      setTriageNote('');
      setTriageMsg({ type: 'success', text: 'Audit record updated successfully.' });
    } catch (err: unknown) {
      setTriageMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating status',
      });
    } finally {
      setTriageSaving(false);
    }
  };

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    const matchesSev =
      findingSeverityFilter === 'all' || f.severity === findingSeverityFilter;
    const matchesCertainty =
      certaintyFilter === 'all' ||
      (certaintyFilter === 'facts' && (f.epistemicCertainty === 'documented_fact' || !f.epistemicCertainty)) ||
      (certaintyFilter === 'hedged' && f.epistemicCertainty === 'hedged_projection') ||
      (certaintyFilter === 'ambiguous' && f.epistemicCertainty === 'ambiguous_disclosure');
    const matchesSearch =
      !findingSearch ||
      f.title.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.categoryLabel.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.excerpt.toLowerCase().includes(findingSearch.toLowerCase());
    return matchesSev && matchesCertainty && matchesSearch;
  });

  // Render highlighted text inside document viewer
  const renderAnnotatedDocumentText = (prefix = 'evidence-anchor-') => {
    const text = analysis.inputText;
    if (!findings || findings.length === 0) {
      return text;
    }

    const sortedFindings = [...findings].sort(
      (a, b) => (a.sourceLocation?.startOffset || 0) - (b.sourceLocation?.startOffset || 0)
    );

    let lastIdx = 0;
    const elements: React.ReactNode[] = [];

    sortedFindings.forEach((finding, idx) => {
      const start = finding.sourceLocation?.startOffset;
      const end = finding.sourceLocation?.endOffset;

      if (start !== undefined && end !== undefined && start >= lastIdx && end <= text.length) {
        if (start > lastIdx) {
          elements.push(
            <span key={`text-${idx}`}>{text.substring(lastIdx, start)}</span>
          );
        }

        const isCurrent = selectedFinding?.id === finding.id;
        elements.push(
          <mark
            key={`mark-${finding.id}`}
            id={`${prefix}${finding.id}`}
            onClick={() => handleSelectFinding(finding)}
            title={`Finding: ${finding.title} (${finding.severity.toUpperCase()})`}
            className={`cursor-pointer rounded px-1 py-0.5 transition-all duration-200 ${
              isCurrent
                ? 'bg-amber-300 text-amber-950 font-bold ring-2 ring-brand-accent shadow-sm'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-b border-amber-400'
            }`}
          >
            {text.substring(start, end)}
          </mark>
        );

        lastIdx = end;
      }
    });

    if (lastIdx < text.length) {
      elements.push(<span key="text-end">{text.substring(lastIdx)}</span>);
    }

    return elements;
  };

  const uncertaintyScore = analysis.sentimentResult?.uncertaintyScore ?? 0;
  const factsCount = findings.filter(
    (f) => f.epistemicCertainty === 'documented_fact' || !f.epistemicCertainty
  ).length;
  const hedgedCount = findings.filter((f) => f.epistemicCertainty === 'hedged_projection').length;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 print:hidden">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports Hub</span>
        </Link>

        {/* View Switcher Tabs & Export buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-brand-border text-xs font-semibold">
            <button
              onClick={() => setActiveViewTab('tripartite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeViewTab === 'tripartite'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Investigation Studio (Source ↔ Signal ↔ Action)</span>
            </button>
            <button
              onClick={() => setActiveViewTab('executive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeViewTab === 'executive'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Executive Briefing</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print / PDF
            </Button>

            <a href={`/api/export/${analysis.id}?format=csv`} download>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              >
                CSV
              </Button>
            </a>

            <a href={`/api/export/${analysis.id}?format=json`} download>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FileCode className="w-4 h-4 text-blue-600" />}
              >
                JSON
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Report Header Card */}
      <Card className="p-6 bg-white border border-brand-border shadow-xs print:border-none print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{analysis.sourceCategory.replace(/_/g, ' ')}</Badge>
              <Badge variant="outline">{analysis.sourceType.replace(/_/g, ' ')}</Badge>
              <span className="text-xs text-slate-400 font-mono">Dossier ID: {analysis.id.substring(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">{analysis.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(analysis.createdAt)}
              </span>
              <span className="tabular-nums font-mono">Words: {analysis.wordCount}</span>
              <span className="tabular-nums font-mono">Findings: {findings.length}</span>
              <span className="text-amber-700 font-medium tabular-nums font-mono">Uncertainty Index: {uncertaintyScore}%</span>
            </div>
          </div>

          {/* Overall Health Score Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {analysis.sentimentResult && (
              <div className="text-center pr-4 border-r border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Sentiment
                </span>
                <Badge
                  variant="sentiment"
                  sentiment={analysis.sentimentResult.overall}
                  className="mt-1 font-semibold"
                >
                  {analysis.sentimentResult.overall}
                </Badge>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5 tabular-nums">
                  Score: {analysis.sentimentResult.score > 0 ? `+${analysis.sentimentResult.score}` : analysis.sentimentResult.score}
                </span>
              </div>
            )}

            {analysis.riskResult && (
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Risk Level
                </span>
                <Badge
                  variant="severity"
                  severity={analysis.riskResult.highestSeverity}
                  className="mt-1 font-semibold"
                >
                  {analysis.riskResult.highestSeverity}
                </Badge>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5 tabular-nums">
                  Risk Score: {analysis.riskResult.overallRiskScore}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODE 1: TRIPARTITE INVESTIGATION STUDIO (SOURCE ↔ SIGNAL ↔ INVESTIGATION) */}
      {/* ========================================================================= */}
      {activeViewTab === 'tripartite' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-brand-navy flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>Tripartite Intelligence Protocol: Select any source passage, signal, or inquiry to synchronize all three dimensions.</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              {filteredFindings.length} of {findings.length} findings visible
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* COLUMN 1: SOURCE PANEL (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <Card className="border-brand-border">
                <CardHeader className="bg-slate-50/80 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-wider font-bold text-brand-navy flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-accent" />
                      <span>01. Source & Evidence Anchor</span>
                    </CardTitle>
                    <span className="text-[11px] font-mono text-slate-500">{analysis.sourceCategory}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Verbatim extracted text. Highlighted passages indicate flagged contractual, financial, or narrative risk patterns.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Selected passage citation indicator */}
                  {selectedFinding ? (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-900">Active Passage Anchor</span>
                        <span className="font-mono text-[10px] text-amber-700">
                          Line {selectedFinding.sourceLocation?.line || '1'} • Paragraph {selectedFinding.sourceLocation?.paragraph || '1'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-800 italic leading-relaxed">
                        "{selectedFinding.excerpt}"
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No passage currently selected.
                    </div>
                  )}

                  {/* Full Annotated Source Viewer */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Full Filing Text (Interactive)
                    </span>
                    <div
                      ref={sourceViewerRef}
                      className="p-3.5 bg-slate-50 rounded-xl border border-brand-border font-mono text-xs text-slate-800 leading-relaxed max-h-[520px] overflow-y-auto whitespace-pre-wrap select-text"
                    >
                      {renderAnnotatedDocumentText('studio-anchor-')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 2: SIGNAL PANEL (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <Card className="border-brand-border">
                <CardHeader className="bg-slate-50/80 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-wider font-bold text-brand-navy flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand-accent" />
                      <span>02. Detected Signal & Severity</span>
                    </CardTitle>
                    {selectedFinding && (
                      <Badge variant="severity" severity={selectedFinding.severity} size="sm">
                        {selectedFinding.severity.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {/* Signal selector switcher dropdown */}
                  <div className="pt-2">
                    <select
                      value={selectedFinding?.id || ''}
                      onChange={(e) => {
                        const target = findings.find((f) => f.id === e.target.value);
                        if (target) handleSelectFinding(target);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
                    >
                      {findings.map((f) => (
                        <option key={f.id} value={f.id}>
                          [{f.severity.toUpperCase()}] {f.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {selectedFinding ? (
                    <>
                      {/* Category & Title */}
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent">
                          {selectedFinding.categoryLabel}
                        </span>
                        <h3 className="text-base font-bold text-brand-text-primary mt-0.5">
                          {selectedFinding.title}
                        </h3>
                      </div>

                      {/* Epistemic Certainty Indicator */}
                      <div className="p-3 rounded-xl border bg-slate-50/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Signal Certainty
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
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {selectedFinding.uncertaintyRationale ||
                            'Historical occurrence verified directly against disclosed representations.'}
                        </p>
                      </div>

                      {/* Algorithmic Confidence & Severity Rationale */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">Institutional Severity Rationale</span>
                          <span className="font-mono text-slate-500 tabular-nums">
                            Confidence: {Math.round(selectedFinding.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {selectedFinding.severityRationale}
                        </p>
                      </div>

                      {/* Explanation & Impact */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Analytical Explanation
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {selectedFinding.explanation}
                        </p>
                      </div>

                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                          Potential Balance Sheet / Operational Impact
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {selectedFinding.potentialImpact}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      Select a finding to examine intelligence signals.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 3: INVESTIGATION PANEL (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <Card className="border-brand-border">
                <CardHeader className="bg-slate-50/80 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-wider font-bold text-brand-navy flex items-center gap-2">
                      <Compass className="w-4 h-4 text-brand-accent" />
                      <span>03. Investigation & Governance</span>
                    </CardTitle>
                    {selectedFinding && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedFinding.reviewStatus === 'dismissed'
                            ? 'bg-slate-200 text-slate-700'
                            : selectedFinding.reviewStatus === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedFinding.reviewStatus === 'under_review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(selectedFinding.reviewStatus || 'open').replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Specific management diligence questions, audit cross-references, and governance triage.
                  </p>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {selectedFinding ? (
                    <>
                      {/* Diligence Questions for Management */}
                      {selectedFinding.investigationDiligence && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                            <FileSearch className="w-4 h-4 text-brand-accent" />
                            <span>Targeted Management Inquiries (1-Click Copy)</span>
                          </div>

                          <div className="space-y-2">
                            {selectedFinding.investigationDiligence.questionsForManagement.map((q, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/70 text-slate-800 space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs leading-relaxed font-medium">"{q}"</p>
                                  <button
                                    onClick={() => handleCopyInquiry(q)}
                                    className="p-1 rounded text-slate-400 hover:text-brand-navy hover:bg-white shrink-0 transition-colors"
                                    title="Copy question to clipboard"
                                  >
                                    {copiedQuestion === q ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-500 block">
                                  Suggested inquiry for earnings conference call
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Records to Cross-Examine */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                              Footnotes & Exhibits to Cross-Examine
                            </span>
                            <ul className="space-y-1">
                              {selectedFinding.investigationDiligence.recordsToCrossExamine.map((rec, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="text-[11px] text-slate-700 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80"
                                >
                                  <span className="font-bold text-brand-accent mt-0.5">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* In-Place Triage & Governance Form */}
                      <div className="pt-3 border-t border-brand-border space-y-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                          Triage Status & Audit Trail
                        </span>

                        <form onSubmit={handleUpdateReview} className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['open', 'under_review', 'resolved', 'dismissed'] as ReviewStatus[]).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setTriageStatus(st)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold capitalize border transition-all ${
                                  triageStatus === st
                                    ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            ))}
                          </div>

                          {(triageStatus === 'dismissed' || triageStatus === 'resolved') && (
                            <div>
                              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                {triageStatus === 'dismissed'
                                  ? 'Mandatory Dismissal Justification *'
                                  : 'Resolution Rationale'}
                              </label>
                              <input
                                type="text"
                                value={triageReason}
                                onChange={(e) => setTriageReason(e.target.value)}
                                placeholder="Document compliance justification..."
                                className="w-full px-2.5 py-1.5 text-xs border border-brand-border rounded-lg bg-white focus:outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Log Working Audit Memo
                            </label>
                            <input
                              type="text"
                              value={triageNote}
                              onChange={(e) => setTriageNote(e.target.value)}
                              placeholder="Add analyst investigation note..."
                              className="w-full px-2.5 py-1.5 text-xs border border-brand-border rounded-lg bg-white focus:outline-none"
                            />
                          </div>

                          {triageMsg && (
                            <div
                              className={`p-2 rounded text-[11px] ${
                                triageMsg.type === 'success'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {triageMsg.text}
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="primary"
                            type="submit"
                            isLoading={triageSaving}
                            className="w-full text-xs"
                          >
                            Save Audit Status
                          </Button>
                        </form>

                        {/* Historical Notes Thread */}
                        {selectedFinding.reviewNotes && selectedFinding.reviewNotes.length > 0 && (
                          <div className="pt-2 space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Audit Notes History ({selectedFinding.reviewNotes.length})
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                              {selectedFinding.reviewNotes.map((n) => (
                                <div
                                  key={n.id}
                                  className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px]"
                                >
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-700">{n.author}</span>
                                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-700 mt-0.5">{n.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      Select a finding to triage.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: EXECUTIVE SUMMARY BRIEFING (FULL 5 DIMENSIONS)                     */}
      {/* ========================================================================= */}
      {activeViewTab === 'executive' && (
        <div className="space-y-6">
          {/* Uncertainty & Epistemic Certainty Barometer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-brand-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Documented Facts</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-slate-800 tabular-nums">{factsCount} findings</p>
              <p className="text-[11px] text-slate-400">Explicit historical disclosures & executed agreements</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-brand-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Hedged Projections</span>
                <Compass className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold text-amber-700 tabular-nums">{hedgedCount} warnings</p>
              <p className="text-[11px] text-slate-400">Forward statements conditioned on future events</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-brand-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Divergent Signals</span>
                <AlertOctagon className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl font-bold text-rose-700 tabular-nums">
                {analysis.sentimentResult?.contradictions?.length || 0} contradictions
              </p>
              <p className="text-[11px] text-slate-400">Contextual friction between optimism and footnote risks</p>
            </div>
          </div>

          {/* Dimension 1: Executive Sentiment Summary & Signal Analysis */}
          {analysis.sentimentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-accent" />
                    <span>Dimension 1: Sentiment Profile & Divergent Signals</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    Score: {analysis.sentimentResult.score > 0 ? `+${analysis.sentimentResult.score.toFixed(2)}` : analysis.sentimentResult.score.toFixed(2)} | Confidence:{' '}
                    {Math.round(analysis.sentimentResult.confidence * 100)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {analysis.sentimentResult.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Positive Signals */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Key Optimistic Signals ({analysis.sentimentResult.positiveSignals.length})
                    </span>
                    {analysis.sentimentResult.positiveSignals.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No significant positive signals observed.</p>
                    ) : (
                      <div className="space-y-2">
                        {analysis.sentimentResult.positiveSignals.map((sig) => (
                          <div
                            key={sig.id}
                            className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-emerald-900">{sig.label}</p>
                              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                {sig.epistemicCertainty === 'hedged_projection' ? 'Hedged' : 'Documented'}
                              </span>
                            </div>
                            <p className="text-emerald-800 italic">"{sig.excerpt}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Negative Signals */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Adverse Disclosures & Headwinds ({analysis.sentimentResult.negativeSignals.length})
                    </span>
                    {analysis.sentimentResult.negativeSignals.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No adverse disclosures detected.</p>
                    ) : (
                      <div className="space-y-2">
                        {analysis.sentimentResult.negativeSignals.map((sig) => (
                          <div
                            key={sig.id}
                            className="p-3 rounded-lg bg-red-50/60 border border-red-100 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-red-900">{sig.label}</p>
                              <span className="text-[10px] font-mono text-red-700 font-bold">
                                {sig.epistemicCertainty === 'hedged_projection' ? 'Hedged' : 'Documented'}
                              </span>
                            </div>
                            <p className="text-red-800 italic">"{sig.excerpt}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Information Gaps & Omissions */}
                {analysis.sentimentResult.informationGaps && analysis.sentimentResult.informationGaps.length > 0 && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Diligence Blind Spots & Information Gaps (What the Source Leaves Unsaid)</span>
                    </div>
                    <div className="space-y-1.5">
                      {analysis.sentimentResult.informationGaps.map((gap, gIdx) => (
                        <div key={gIdx} className="flex items-start gap-2 text-xs text-amber-950">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dimension 4: Extracted Financial Metrics */}
          {analysis.numericalSignals && analysis.numericalSignals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Dimension 4: Extracted Numerical Metrics & Signals ({analysis.numericalSignals.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {analysis.numericalSignals.map((metric) => (
                    <div key={metric.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {metric.name}
                      </span>
                      <p className="text-lg font-bold text-brand-navy font-mono tabular-nums">
                        {metric.rawValue} <span className="text-xs font-normal text-slate-500">{metric.unit}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-200/60 font-mono">
                        "{metric.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dimension 5: Detected Anomalies */}
          {analysis.anomalies && analysis.anomalies.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Dimension 5: Detected Narrative Dissonance & Anomalies ({analysis.anomalies.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.anomalies.map((anom) => (
                  <div key={anom.id} className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-950">{anom.title}</h4>
                      <Badge variant="severity" severity={anom.severity} size="sm">{anom.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-slate-700">{anom.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dimension 2 & 3: Grounded Findings Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Dimension 2: Grounded Risk Findings</span>
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={findingSearch}
                      onChange={(e) => setFindingSearch(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-brand-border rounded-lg bg-white"
                    />
                    <select
                      value={findingSeverityFilter}
                      onChange={(e) => setFindingSeverityFilter(e.target.value)}
                      className="px-2 py-1 text-xs border border-brand-border rounded-lg bg-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y divide-brand-border max-h-[500px] overflow-y-auto">
                    {filteredFindings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => handleSelectFinding(finding)}
                        className={`p-4 cursor-pointer text-xs space-y-1.5 transition-colors ${
                          selectedFinding?.id === finding.id ? 'bg-blue-50/80 border-l-4 border-l-brand-accent' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-brand-navy">{finding.title}</span>
                          <Badge variant="severity" severity={finding.severity} size="sm">
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-600 italic">"{finding.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dimension 3: Active Finding Inspection</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  {selectedFinding ? (
                    <>
                      <h4 className="font-bold text-sm text-brand-navy">{selectedFinding.title}</h4>
                      <p className="text-slate-700">{selectedFinding.explanation}</p>
                      <div className="p-2.5 bg-amber-50 rounded border border-amber-200 font-mono text-[11px]">
                        "{selectedFinding.excerpt}"
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">Select a finding.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Full Source Document Card */}
          <Card ref={documentViewerRef}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Full Ingested Source Document</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap select-text">
                {renderAnnotatedDocumentText('exec-anchor-')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
