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
  X,
  ExternalLink,
  Shield,
  Layers,
  ArrowLeft,
  Sparkles,
  Info,
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { AnalysisRecord, RiskFinding, SentimentSignal, RiskSeverity } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ReportViewProps {
  analysis: AnalysisRecord;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysis }) => {
  const [selectedFinding, setSelectedFinding] = useState<RiskFinding | null>(
    analysis.findings?.[0] || null
  );
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('all');
  const [findingSearch, setFindingSearch] = useState('');
  const documentViewerRef = useRef<HTMLDivElement>(null);

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
    // Smooth scroll to document viewer if on desktop
    if (documentViewerRef.current) {
      const el = document.getElementById(`evidence-anchor-${finding.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter findings in table
  const filteredFindings = (analysis.findings || []).filter((f) => {
    const matchesSev = findingSeverityFilter === 'all' || f.severity === findingSeverityFilter;
    const matchesSearch =
      !findingSearch ||
      f.title.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.categoryLabel.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.excerpt.toLowerCase().includes(findingSearch.toLowerCase());
    return matchesSev && matchesSearch;
  });

  // Render highlighted text inside document viewer
  const renderAnnotatedDocumentText = () => {
    const text = analysis.inputText;
    if (!analysis.findings || analysis.findings.length === 0) {
      return text;
    }

    // Sort findings by start offset if available
    const sortedFindings = [...analysis.findings].sort(
      (a, b) => (a.sourceLocation?.startOffset || 0) - (b.sourceLocation?.startOffset || 0)
    );

    let lastIdx = 0;
    const elements: React.ReactNode[] = [];

    sortedFindings.forEach((finding, idx) => {
      const start = finding.sourceLocation?.startOffset;
      const end = finding.sourceLocation?.endOffset;

      if (start !== undefined && end !== undefined && start >= lastIdx && end <= text.length) {
        // Text before match
        if (start > lastIdx) {
          elements.push(
            <span key={`text-${idx}`}>{text.substring(lastIdx, start)}</span>
          );
        }

        const isCurrent = selectedFinding?.id === finding.id;
        elements.push(
          <mark
            key={`mark-${finding.id}`}
            id={`evidence-anchor-${finding.id}`}
            onClick={() => setSelectedFinding(finding)}
            title={`Finding: ${finding.title} (${finding.severity.toUpperCase()})`}
            className={`cursor-pointer rounded px-1 py-0.5 transition-all duration-200 ${
              isCurrent
                ? 'bg-amber-300 text-amber-950 font-bold ring-2 ring-amber-500 shadow-xs'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-b-2 border-amber-400'
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

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Breadcrumb & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 print:hidden">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports Hub</span>
        </Link>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          {/* Print / Save to PDF */}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print / PDF
          </Button>

          {/* Export CSV (formula safe) */}
          <a href={`/api/export/${analysis.id}?format=csv`} download>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            >
              Export CSV
            </Button>
          </a>

          {/* Export JSON */}
          <a href={`/api/export/${analysis.id}?format=json`} download>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileCode className="w-4 h-4 text-blue-600" />}
            >
              Export JSON
            </Button>
          </a>
        </div>
      </div>

      {/* Report Header Card */}
      <Card className="p-6 bg-gradient-to-r from-white via-white to-slate-50/60 print:border-none print:shadow-none">
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
              <span>Words: {analysis.wordCount}</span>
              <span>Findings Count: {analysis.findings?.length || 0}</span>
            </div>
          </div>

          {/* Primary Severity & Sentiment Badges */}
          <div className="flex items-center gap-3">
            {analysis.sentimentResult && (
              <div className="p-3 bg-white border border-brand-border rounded-xl shadow-2xs text-center min-w-[120px]">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Sentiment</span>
                <Badge variant="sentiment" sentiment={analysis.sentimentResult.overall} className="mt-1">
                  {analysis.sentimentResult.overall}
                </Badge>
                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                  Score: {analysis.sentimentResult.score > 0 ? '+' : ''}{analysis.sentimentResult.score}
                </span>
              </div>
            )}

            {analysis.riskResult && (
              <div className="p-3 bg-white border border-brand-border rounded-xl shadow-2xs text-center min-w-[120px]">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Risk Profile</span>
                <Badge variant="severity" severity={analysis.riskResult.highestSeverity} className="mt-1">
                  {analysis.riskResult.highestSeverity}
                </Badge>
                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                  Risk: {analysis.riskResult.overallRiskScore}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Intelligence Section 1: Sentiment Intelligence */}
      {analysis.sentimentResult && (
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-accent" />
              <span>Dimension 1: Financial Sentiment Intelligence</span>
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
                        <p className="font-semibold text-emerald-900">{sig.label}</p>
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
                        <p className="font-semibold text-red-900">{sig.label}</p>
                        <p className="text-red-800 italic">"{sig.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contradictions & Disclaimers */}
            {analysis.sentimentResult.contradictions.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1 mt-3">
                <span className="font-semibold uppercase tracking-wider text-[11px] block">
                  Identified Contextual Contradictions:
                </span>
                {analysis.sentimentResult.contradictions.map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Intelligence Section 2 & 3: Multi-Category Risk Findings & Evidence Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* Left Table: Risk Findings List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Dimension 2: Financial & Business Risk Matrix</span>
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any finding to inspect verified source evidence and mitigation next steps.
                </p>
              </div>

              {/* In-table filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-40">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search findings..."
                    value={findingSearch}
                    onChange={(e) => setFindingSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-brand-border rounded-lg focus:outline-none"
                  />
                </div>

                <select
                  value={findingSeverityFilter}
                  onChange={(e) => setFindingSeverityFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
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
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No risk findings matched your criteria.
                </div>
              ) : (
                <div className="divide-y divide-brand-border max-h-[560px] overflow-y-auto">
                  {filteredFindings.map((finding) => {
                    const isSelected = selectedFinding?.id === finding.id;
                    return (
                      <div
                        key={finding.id}
                        onClick={() => handleSelectFinding(finding)}
                        className={`p-4 transition-colors cursor-pointer text-xs space-y-2 ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-brand-accent'
                            : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              {finding.categoryLabel}
                            </span>
                            <h4 className="font-semibold text-brand-text-primary text-sm mt-0.5">
                              {finding.title}
                            </h4>
                          </div>
                          <Badge variant="severity" severity={finding.severity}>
                            {finding.severity}
                          </Badge>
                        </div>

                        {/* Evidence quote snippet */}
                        <p className="text-slate-600 line-clamp-2 italic bg-white/80 p-2 rounded border border-slate-200/80">
                          "{finding.excerpt}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>
                            Confidence: {Math.round(finding.confidence * 100)}% | Line:{' '}
                            {finding.sourceLocation?.line || 'N/A'}
                          </span>
                          <span className="text-brand-accent font-medium flex items-center gap-1">
                            Inspect Evidence <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Drawer / Panel: Contextual Evidence Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4 print:mt-6">
          <Card className="sticky top-20 border-brand-accent/40 shadow-sm print:static">
            <CardHeader className="bg-slate-50/70">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-navy" />
                  <span>Dimension 3: Evidence Explorer & Deep Rationale</span>
                </span>
                {selectedFinding && (
                  <Badge variant="classification" classification={selectedFinding.classification}>
                    {selectedFinding.classification.replace(/_/g, ' ')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              {selectedFinding ? (
                <>
                  {/* Category & Title */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent">
                      {selectedFinding.categoryLabel}
                    </span>
                    <h3 className="text-base font-bold text-brand-text-primary mt-1">
                      {selectedFinding.title}
                    </h3>
                  </div>

                  {/* Verbatim Supporting Passage */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Verbatim Grounded Passage (Source Evidence)
                    </span>
                    <div className="p-3 bg-amber-50/80 border-l-4 border-l-amber-500 rounded-r-lg text-slate-900 font-mono text-[11px] leading-relaxed">
                      "{selectedFinding.excerpt}"
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Anchored at line {selectedFinding.sourceLocation?.line || '1'}, paragraph{' '}
                      {selectedFinding.sourceLocation?.paragraph || '1'}, offsets [
                      {selectedFinding.sourceLocation?.startOffset || 0} -{' '}
                      {selectedFinding.sourceLocation?.endOffset || selectedFinding.excerpt.length}]{' '}
                      {selectedFinding.isApproximateMatch ? '(Normalized match)' : '(Exact byte match)'}
                    </p>
                  </div>

                  {/* Severity Rationale */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Severity Rationale ({selectedFinding.severity.toUpperCase()})
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                      {selectedFinding.severityRationale}
                    </p>
                  </div>

                  {/* Potential Financial Impact */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Potential Business & Enterprise Impact
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                      {selectedFinding.potentialImpact}
                    </p>
                  </div>

                  {/* Suggested Next Steps */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Actionable Mitigation Recommendations
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      {selectedFinding.suggestedNextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-emerald-50/40 p-2 rounded border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Select a risk finding from the matrix to inspect exact evidentiary anchors.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Synchronized Source Text Viewer with Interactive Highlighting */}
      <Card ref={documentViewerRef}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Full Ingested Source Document (Synchronized Evidence Highlighter)</span>
            </span>
            <span className="text-xs font-normal text-slate-500">
              Click any highlighted passage to inspect its finding
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap select-text">
            {renderAnnotatedDocumentText()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
