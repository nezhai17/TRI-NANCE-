'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Network,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Landmark,
  BadgeAlert,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Users,
} from 'lucide-react';
import { AnalysisRecord, DocumentRecord, RiskFinding, RiskSeverity } from '@/lib/types';
import { EntityRelationshipNetwork } from '@/components/visualization/EntityRelationshipNetwork';

interface EntityClientProps {
  analyses: AnalysisRecord[];
  documents: DocumentRecord[];
}

interface EntityProfile {
  id: string;
  name: string;
  role: 'Issuer / Subject' | 'Auditor / Assurance' | 'Lender / Creditor' | 'Regulatory Authority' | 'Counterparty';
  mentionCount: number;
  dossiers: Array<{ id: string; title: string }>;
  riskFindings: RiskFinding[];
  highestSeverity: RiskSeverity;
  toneScore: number;
}

const KNOWN_AUDITORS = ['pwc', 'pricewaterhousecoopers', 'deloitte', 'ernst & young', 'ey', 'kpmg', 'bdo', 'grant thornton'];
const KNOWN_LENDERS = ['jpmorgan', 'goldman sachs', 'morgan stanley', 'bank of america', 'citigroup', 'wells fargo', 'barclays', 'silicon valley bank', 'svb', 'ubs', 'credit suisse', 'hsbc'];
const KNOWN_REGULATORS = ['sec', 'securities and exchange commission', 'finra', 'federal reserve', 'the fed', 'fdic', 'cfpb', 'doj', 'cftc', 'ecb'];

export const EntityClient: React.FC<EntityClientProps> = ({ analyses, documents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);

  // Deterministically aggregate entities across analyses and documents
  const entities = useMemo(() => {
    const map = new Map<string, EntityProfile>();

    const getOrCreate = (
      name: string,
      role: EntityProfile['role'],
      dossier: { id: string; title: string }
    ): EntityProfile => {
      const key = name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: name.trim(),
          role,
          mentionCount: 0,
          dossiers: [],
          riskFindings: [],
          highestSeverity: 'low',
          toneScore: 0,
        });
      }
      const existing = map.get(key)!;
      existing.mentionCount++;
      if (!existing.dossiers.some((d) => d.id === dossier.id)) {
        existing.dossiers.push(dossier);
      }
      return existing;
    };

    // 1. Extract subject issuers from analysis titles and document titles
    analyses.forEach((a) => {
      let subjectName = a.title
        .replace(/(\b10-K\b|\b10-Q\b|\b8-K\b|\bEarnings Call\b|\bAnnual Report\b|\bQ[1-4]\b|\bFY\d{2,4}\b|\bFinancials\b|\bAudit\b)/gi, '')
        .replace(/[-_–—:]/g, ' ')
        .trim();

      if (!subjectName || subjectName.length < 3) {
        subjectName = a.title.split(/[-–—:]/)[0].trim();
      }
      if (!subjectName) subjectName = 'Commercial Subject Organization';

      const subject = getOrCreate(subjectName, 'Issuer / Subject', { id: a.id, title: a.title });
      
      // Attach findings
      (a.findings || []).forEach((f) => {
        subject.riskFindings.push(f);
        if (f.severity === 'critical') subject.highestSeverity = 'critical';
        else if (f.severity === 'high' && subject.highestSeverity !== 'critical') subject.highestSeverity = 'high';
        else if (f.severity === 'medium' && subject.highestSeverity === 'low') subject.highestSeverity = 'medium';
      });

      if (a.sentimentResult) {
        subject.toneScore = a.sentimentResult.score;
      }

      // 2. Scan text and findings for known institutional counterparties
      const fullText = (a.inputText + ' ' + (a.findings || []).map((f) => f.excerpt + ' ' + f.explanation).join(' ')).toLowerCase();

      KNOWN_AUDITORS.forEach((auditor) => {
        if (fullText.includes(auditor)) {
          const formatted = auditor.toUpperCase() === 'PWC' || auditor.toUpperCase() === 'EY' || auditor.toUpperCase() === 'KPMG'
            ? auditor.toUpperCase()
            : auditor.charAt(0).toUpperCase() + auditor.slice(1);
          const p = getOrCreate(formatted, 'Auditor / Assurance', { id: a.id, title: a.title });
          // Link relevant audit findings
          (a.findings || []).forEach((f) => {
            if (f.category === 'fraud_inconsistencies' || f.excerpt.toLowerCase().includes(auditor)) {
              p.riskFindings.push(f);
              if (f.severity === 'critical') p.highestSeverity = 'critical';
              else if (f.severity === 'high' && p.highestSeverity !== 'critical') p.highestSeverity = 'high';
            }
          });
        }
      });

      KNOWN_LENDERS.forEach((lender) => {
        if (fullText.includes(lender)) {
          const formatted = lender.charAt(0).toUpperCase() + lender.slice(1);
          const p = getOrCreate(formatted, 'Lender / Creditor', { id: a.id, title: a.title });
          (a.findings || []).forEach((f) => {
            if (f.category === 'liquidity_cash_flow' || f.category === 'debt_leverage' || f.excerpt.toLowerCase().includes(lender)) {
              p.riskFindings.push(f);
              if (f.severity === 'critical') p.highestSeverity = 'critical';
            }
          });
        }
      });

      KNOWN_REGULATORS.forEach((reg) => {
        if (fullText.includes(reg)) {
          const formatted = reg.toUpperCase();
          const p = getOrCreate(formatted, 'Regulatory Authority', { id: a.id, title: a.title });
          (a.findings || []).forEach((f) => {
            if (f.category === 'regulatory_compliance' || f.excerpt.toLowerCase().includes(reg)) {
              p.riskFindings.push(f);
              if (f.severity === 'critical') p.highestSeverity = 'critical';
            }
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.mentionCount - a.mentionCount);
  }, [analyses, documents]);

  // Filter entities
  const filteredEntities = useMemo(() => {
    return entities.filter((ent) => {
      if (selectedRole !== 'all' && !ent.role.toLowerCase().includes(selectedRole.toLowerCase())) {
        return false;
      }
      if (selectedSeverity !== 'all' && ent.highestSeverity !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ent.name.toLowerCase().includes(q);
        const matchRole = ent.role.toLowerCase().includes(q);
        const matchDossier = ent.dossiers.some((d) => d.title.toLowerCase().includes(q));
        return matchName || matchRole || matchDossier;
      }
      return true;
    });
  }, [entities, selectedRole, selectedSeverity, searchQuery]);

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === activeEntityId) || null;
  }, [entities, activeEntityId]);

  const criticalEntitiesCount = entities.filter((e) => e.highestSeverity === 'critical').length;
  const highEntitiesCount = entities.filter((e) => e.highestSeverity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified Entities</span>
          <p className="text-2xl font-bold text-brand-navy mt-1 tabular-nums">{entities.length}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Mapped across repository</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-red-200/80 bg-red-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Critical Exposure</span>
          <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{criticalEntitiesCount}</p>
          <span className="text-[10px] text-red-600 mt-0.5 block">Severe commercial or regulatory risk</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200/80 bg-amber-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">High Risk Exposure</span>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{highEntitiesCount}</p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Material covenant or audit risk</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-blue-200/80 bg-blue-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Multi-Dossier Ties</span>
          <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">
            {entities.filter((e) => e.dossiers.length > 1).length}
          </p>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Entities linked across &gt;1 filing</span>
        </div>
      </div>

      {/* Interactive Entity Topology Visualization */}
      <EntityRelationshipNetwork
        entities={entities}
        onSelectEntity={(id) => setActiveEntityId(id)}
        selectedEntityId={activeEntityId}
      />

      {/* Main Grid: Entity Directory & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity Directory List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Commercial Entity Directory
              </h2>
              <span className="text-[11px] text-slate-500">
                Click any profile to inspect dossier connections & risk findings.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-36 sm:w-48"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="issuer">Issuers</option>
                <option value="auditor">Auditors</option>
                <option value="lender">Lenders</option>
                <option value="regulatory">Regulators</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Entity Cards */}
          <div className="p-4 sm:p-5 space-y-3 max-h-[620px] overflow-y-auto">
            {filteredEntities.map((ent) => {
              const isSelected = activeEntityId === ent.id;
              const isCrit = ent.highestSeverity === 'critical';
              const isHigh = ent.highestSeverity === 'high';

              return (
                <div
                  key={ent.id}
                  onClick={() => setActiveEntityId(ent.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-brand-navy truncate">
                        {ent.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {ent.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isCrit
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isHigh
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {ent.highestSeverity} Risk
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span>{ent.dossiers.length} Linked Filing{ent.dossiers.length === 1 ? '' : 's'}</span>
                      <span>•</span>
                      <span>{ent.riskFindings.length} Risk Finding{ent.riskFindings.length === 1 ? '' : 's'}</span>
                      {ent.toneScore !== 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            Tone: {ent.toneScore > 0 ? `+${ent.toneScore.toFixed(2)}` : ent.toneScore.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/dashboard/copilot?query=Analyze commercial risks and exposures for ${encodeURIComponent(
                        ent.name
                      )}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Audit with Copilot</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {filteredEntities.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No entities found matching the specified filters.
              </div>
            )}
          </div>
        </div>

        {/* Selected Entity Inspection Panel (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          {selectedEntity ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Entity Profile
                </span>
                <h3 className="text-lg font-bold text-brand-navy mt-1">
                  {selectedEntity.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedEntity.role}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border ${
                      selectedEntity.highestSeverity === 'critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : selectedEntity.highestSeverity === 'high'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {selectedEntity.highestSeverity} Exposure
                  </span>
                </div>
              </div>

              {/* Linked Filings */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Associated Repository Filings ({selectedEntity.dossiers.length}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedEntity.dossiers.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dashboard/analyze/${d.id}`}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{d.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-navy shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Key Associated Findings */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Flagged Exposure Findings ({selectedEntity.riskFindings.length}):
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEntity.riskFindings.slice(0, 5).map((f, fIdx) => (
                    <div
                      key={f.id || fIdx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-navy truncate max-w-[180px]">{f.title}</span>
                        <span className="text-[10px] font-bold uppercase text-rose-600">{f.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic">&ldquo;{f.excerpt}&rdquo;</p>
                    </div>
                  ))}

                  {selectedEntity.riskFindings.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No adverse risk findings logged for this entity.</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/dashboard/copilot?query=Provide a comprehensive counterparty diligence briefing on ${encodeURIComponent(
                    selectedEntity.name
                  )}`}
                  className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Launch Deep Diligence in Copilot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-300" />
              <span>Select an entity from the directory to inspect its dossier connections and risk exposure profile.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
