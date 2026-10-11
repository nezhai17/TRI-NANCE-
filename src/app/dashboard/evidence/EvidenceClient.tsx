'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  SearchCheck,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Split,
} from 'lucide-react';
import { AnalysisRecord, RiskFinding, EvidenceClassification, EpistemicCertainty } from '@/lib/types';
import { EvidenceProvenanceGraph } from '@/components/visualization/EvidenceProvenanceGraph';

interface EvidenceClientProps {
  analyses: AnalysisRecord[];
}

interface EvidenceItem {
  id: string;
  sourceType: 'risk_finding' | 'numerical_metric' | 'tone_signal' | 'anomaly';
  title: string;
  excerpt: string;
  explanation?: string;
  classification?: EvidenceClassification;
  epistemicCertainty?: EpistemicCertainty;
  sourceLocation?: {
    line?: number;
    startOffset?: number;
    endOffset?: number;
  };
  analysisId: string;
  analysisTitle: string;
}

export const EvidenceClient: React.FC<EvidenceClientProps> = ({ analyses }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [selectedEpistemic, setSelectedEpistemic] = useState<string>('all');
  const [selectedDossier, setSelectedDossier] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compile all evidence items across analyses
  const { allEvidence, contradictionPairs } = useMemo(() => {
    const items: EvidenceItem[] = [];
    const contradictions: Array<{
      title: string;
      description: string;
      analysisTitle: string;
      analysisId: string;
      excerpts: Array<{ label: string; text: string }>;
    }> = [];

    analyses.forEach((a) => {
      // Risk findings evidence
      (a.findings || []).forEach((f) => {
        items.push({
          id: f.id,
          sourceType: 'risk_finding',
          title: f.title,
          excerpt: f.excerpt,
          explanation: f.explanation,
          classification: f.classification,
          epistemicCertainty: f.epistemicCertainty,
          sourceLocation: f.sourceLocation,
          analysisId: a.id,
          analysisTitle: a.title,
        });
      });

      // Numerical metrics evidence
      (a.numericalSignals || []).forEach((m) => {
        items.push({
          id: m.id,
          sourceType: 'numerical_metric',
          title: `${m.name}: ${m.rawValue} ${m.unit || ''}`.trim(),
          excerpt: m.excerpt,
          explanation: `Reported financial metric ${m.name} for period ${m.period || 'disclosed period'}.`,
          classification: 'explicitly_stated',
          epistemicCertainty: 'documented_fact',
          sourceLocation: m.sourceLocation,
          analysisId: a.id,
          analysisTitle: a.title,
        });
      });

      // Tone signals evidence
      const sent = a.sentimentResult;
      if (sent) {
        const allSig = [
          ...(sent.positiveSignals || []),
          ...(sent.negativeSignals || []),
          ...(sent.hedgedSignals || []),
        ];
        allSig.forEach((s) => {
          items.push({
            id: s.id,
            sourceType: 'tone_signal',
            title: s.label || 'Tone Indicator',
            excerpt: s.excerpt,
            explanation: s.context || 'Audited narrative sentiment disclosure.',
            classification: 'explicitly_stated',
            epistemicCertainty: s.epistemicCertainty || 'hedged_projection',
            sourceLocation: s.sourceLocation,
            analysisId: a.id,
            analysisTitle: a.title,
          });
        });
      }

      // Anomalies contradictions
      (a.anomalies || []).forEach((anom) => {
        if (anom.comparedExcerpts && anom.comparedExcerpts.length >= 2) {
          contradictions.push({
            title: anom.title,
            description: anom.description,
            analysisTitle: a.title,
            analysisId: a.id,
            excerpts: anom.comparedExcerpts,
          });
        }
      });
    });

    return { allEvidence: items, contradictionPairs: contradictions };
  }, [analyses]);

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    return allEvidence.filter((item) => {
      if (selectedClassification !== 'all' && item.classification !== selectedClassification) {
        return false;
      }
      if (selectedEpistemic !== 'all' && item.epistemicCertainty !== selectedEpistemic) {
        return false;
      }
      if (selectedDossier !== 'all' && item.analysisId !== selectedDossier) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchExcerpt = item.excerpt.toLowerCase().includes(q);
        const matchExpl = (item.explanation || '').toLowerCase().includes(q);
        const matchDossier = item.analysisTitle.toLowerCase().includes(q);
        return matchTitle || matchExcerpt || matchExpl || matchDossier;
      }
      return true;
    });
  }, [allEvidence, selectedClassification, selectedEpistemic, selectedDossier, searchQuery]);

  const handleCopyCitation = (item: EvidenceItem) => {
    const lineStr = item.sourceLocation?.line ? `, Line ${item.sourceLocation.line}` : '';
    const text = `[Source: ${item.analysisTitle}${lineStr}] "${item.excerpt}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const explicitlyStatedCount = allEvidence.filter((e) => e.classification === 'explicitly_stated').length;
  const inferredCount = allEvidence.filter((e) => e.classification === 'inferred').length;
  const requiringVerificationCount = allEvidence.filter((e) => e.classification === 'requiring_verification').length;
  const anchoredCount = allEvidence.filter((e) => e.sourceLocation?.line).length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Audited Excerpts</span>
          <p className="text-2xl font-bold text-brand-navy mt-1 tabular-nums">{allEvidence.length}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Cataloged verbatim from documents</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200/80 bg-emerald-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Explicitly Stated Ratio</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {allEvidence.length > 0 ? Math.round((explicitlyStatedCount / allEvidence.length) * 100) : 0}%
          </p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">{explicitlyStatedCount} verified statements</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200/80 bg-purple-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Coordinate Anchors</span>
          <p className="text-2xl font-bold text-purple-600 mt-1 tabular-nums">{anchoredCount}</p>
          <span className="text-[10px] text-purple-600 mt-0.5 block">With exact line/offset references</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200/80 bg-amber-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Contradiction Pairs</span>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{contradictionPairs.length}</p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Discrepant statement pairs</span>
        </div>
      </div>

      {/* Visual Provenance & Verification Lineage Row */}
      <EvidenceProvenanceGraph
        totalExcerpts={allEvidence.length}
        explicitlyStatedCount={explicitlyStatedCount}
        inferredCount={inferredCount}
        requiringVerificationCount={requiringVerificationCount}
        anchoredLineCount={anchoredCount}
        totalDossiers={analyses.length}
        selectedClassification={selectedClassification}
        onSelectClassification={(cls) => setSelectedClassification(cls)}
      />

      {/* Contradiction & Claim Conflict Canvas */}
      {contradictionPairs.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Split className="w-4 h-4 text-amber-600" />
              Contradiction & Claim Conflict Canvas ({contradictionPairs.length})
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
              Forensic Comparison
            </span>
          </div>

          <div className="p-5 space-y-4">
            {contradictionPairs.map((cp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-amber-200/80 bg-white hover:bg-amber-50/20 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-brand-navy">{cp.title}</h3>
                  <Link
                    href={`/dashboard/analyze/${cp.analysisId}`}
                    className="text-[11px] text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>{cp.analysisTitle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{cp.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {cp.excerpts.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          {ex.label || `Claim ${exIdx === 0 ? 'A (Primary)' : 'B (Counter)'}`}
                        </span>
                        <p className="text-xs text-slate-800 italic leading-relaxed">
                          &ldquo;{ex.text}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Evidence Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Source Excerpts & Provenance Feed
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable excerpts linked directly to filing line coordinates and epistemic evidence tiers.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search citations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">All Classifications</option>
              <option value="explicitly_stated">Explicitly Stated</option>
              <option value="inferred">Inferred</option>
              <option value="requiring_verification">Requiring Verification</option>
            </select>

            <select
              value={selectedEpistemic}
              onChange={(e) => setSelectedEpistemic(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">All Epistemic Tiers</option>
              <option value="documented_fact">Documented Fact</option>
              <option value="hedged_projection">Hedged Projection</option>
              <option value="ambiguous_disclosure">Ambiguous Disclosure</option>
            </select>

            <select
              value={selectedDossier}
              onChange={(e) => setSelectedDossier(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 max-w-[140px]"
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

        {/* Evidence List */}
        <div className="p-5 space-y-3.5">
          {filteredEvidence.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/30 transition-all space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      item.sourceType === 'risk_finding'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : item.sourceType === 'numerical_metric'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {item.sourceType.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-brand-navy">{item.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.classification && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                      {item.classification.replace('_', ' ')}
                    </span>
                  )}
                  {item.epistemicCertainty && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-200">
                      {item.epistemicCertainty.replace('_', ' ')}
                    </span>
                  )}
                  <Link
                    href={`/dashboard/analyze/${item.analysisId}`}
                    className="text-[11px] text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>{item.analysisTitle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Verbatim Excerpt */}
              <div className="p-3.5 rounded-lg bg-slate-50 border-l-4 border-purple-400 text-xs text-slate-800 leading-relaxed font-sans">
                &ldquo;{item.excerpt}&rdquo;
              </div>

              {item.explanation && (
                <p className="text-xs text-slate-500 leading-relaxed pl-1">
                  {item.explanation}
                </p>
              )}

              {/* Footer: Coordinate and Copy Citation */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  {item.sourceLocation?.line ? (
                    <span className="font-mono text-[10px] text-slate-500 font-semibold">
                      Line coordinate: {item.sourceLocation.line}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Location indexed</span>
                  )}
                </div>

                <button
                  onClick={() => handleCopyCitation(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition-colors text-xs font-medium"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied Citation!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredEvidence.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No evidence excerpts match the specified filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
