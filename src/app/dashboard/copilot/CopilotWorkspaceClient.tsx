'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calculator,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ListTodo,
  Layers,
  ArrowRight,
  Split,
  Building2,
  HelpCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  CopilotMessage,
  CopilotCitation,
  CalculationResult,
  CopilotActionProposal,
  CopilotIntent,
  CopilotChartPayload,
} from '@/lib/intelligence/copilot-engine';
import { CopilotVisualChart } from '@/components/visualization/CopilotVisualChart';
import { AnalysisRecord, DocumentRecord, InvestigationChecklistItem } from '@/lib/types';

interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: CopilotIntent;
  citations?: CopilotCitation[];
  calculationResult?: CalculationResult;
  chartPayload?: CopilotChartPayload;
  checklist?: InvestigationChecklistItem[];
  informationGaps?: string[];
  pendingAction?: CopilotActionProposal;
  actionExecutedResult?: { success: boolean; resultSummary: string };
  suggestedFollowUps?: string[];
  timestamp: string;
}

interface CopilotWorkspaceClientProps {
  analyses: AnalysisRecord[];
  documents: DocumentRecord[];
}

const PRESET_INVESTIGATIONS = [
  {
    title: 'Counter-Evidence & Mitigations',
    prompt: 'Identify all mitigating factors, management explanations, and counter-evidence for high-severity findings in this filing.',
    icon: ShieldCheck,
  },
  {
    title: 'Forensic Cash Runway Model',
    prompt: 'Estimate cash runway in months using disclosed cash equivalents and burn rate, plus stress scenario.',
    icon: Clock,
  },
  {
    title: 'Contradiction & Dissonance Scan',
    prompt: 'Find any contradictions between optimistic narrative remarks and worsening financial or balance sheet metrics.',
    icon: Split,
  },
  {
    title: 'Commercial Multi-Period Variance',
    prompt: 'Calculate exact dollar and percentage variance between reported revenue and prior period reference.',
    icon: Calculator,
  },
  {
    title: 'Executive Investment Committee Brief',
    prompt: 'Synthesize an executive briefing with commercial risks, financial signals, and key verification questions.',
    icon: FileText,
  },
  {
    title: 'Epistemic Hedging Analysis',
    prompt: 'Analyze conditional language, hedging terms, and epistemic uncertainty markers in disclosures.',
    icon: HelpCircle,
  },
];

export const CopilotWorkspaceClient: React.FC<CopilotWorkspaceClientProps> = ({
  analyses,
  documents,
}) => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialAnalysisId = searchParams.get('analysisId') || 'all';

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(initialAnalysisId);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<CopilotCitation | null>(null);
  const [checklist, setChecklist] = useState<InvestigationChecklistItem[]>([]);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, { rating: 'positive' | 'negative'; reason?: string }>
  >({});

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat on updates
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, loading]);

  // Execute initial query from URL search param if present
  useEffect(() => {
    if (initialQuery && turns.length === 0) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const activeAnalysis = analyses.find((a) => a.id === selectedAnalysisId);

  const handleSend = async (textOverride?: string) => {
    const messageText = (textOverride || query).trim();
    if (!messageText || loading) return;

    const userTurn: ConversationTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const newTurns = [...turns, userTurn];
    setTurns(newTurns);
    if (!textOverride) setQuery('');
    setLoading(true);

    try {
      const historyPayload = newTurns.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          analysisId: selectedAnalysisId === 'all' ? undefined : selectedAnalysisId,
          history: historyPayload,
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Copilot request returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      const assistantTurn: ConversationTurn = {
        id: data.id || `asst-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        intent: data.intent,
        citations: data.citations || [],
        calculationResult: data.calculationResult,
        chartPayload: data.chartPayload,
        checklist: data.checklist || [],
        informationGaps: data.informationGaps || [],
        pendingAction: data.pendingAction,
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setTurns([...newTurns, assistantTurn]);

      if (data.checklist && data.checklist.length > 0) {
        setChecklist((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const additions = data.checklist.filter(
            (i: InvestigationChecklistItem) => !existingIds.has(i.id)
          );
          return [...prev, ...additions];
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown network failure';
      const errorTurn: ConversationTurn = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error contacting Tri-nance Intelligence Engine: ${errMsg}. Please ensure database connection is healthy and retry.`,
        timestamp: new Date().toISOString(),
      };
      setTurns([...newTurns, errorTurn]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleExecuteAction = async (proposal: CopilotActionProposal) => {
    setExecutingActionId(proposal.id);
    try {
      const res = await fetch('/api/assistant/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: proposal,
          confirmed: true,
        }),
      });

      const data = await res.json();
      setTurns((prev) =>
        prev.map((turn) => {
          if (turn.pendingAction?.id === proposal.id) {
            return {
              ...turn,
              pendingAction: undefined,
              actionExecutedResult: {
                success: res.ok,
                resultSummary: data.message || 'Action executed successfully.',
              },
            };
          }
          return turn;
        })
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to execute action';
      alert(`Action execution failed: ${errMsg}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleRejectAction = (proposalId: string) => {
    setTurns((prev) =>
      prev.map((turn) => {
        if (turn.pendingAction?.id === proposalId) {
          return {
            ...turn,
            pendingAction: undefined,
            actionExecutedResult: {
              success: false,
              resultSummary: 'Action execution declined by investigator.',
            },
          };
        }
        return turn;
      })
    );
  };

  const handleFeedback = async (
    turnId: string,
    rating: 'positive' | 'negative',
    reason?: string
  ) => {
    setFeedbackMap((prev) => ({ ...prev, [turnId]: { rating, reason } }));
    try {
      await fetch('/api/assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: turnId,
          rating,
          reason,
        }),
      });
    } catch {
      // Feedback non-blocking
    }
  };

  const handleCopyTurn = (turn: ConversationTurn) => {
    navigator.clipboard.writeText(turn.content);
    setCopiedTurnId(turn.id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleExportMarkdown = () => {
    let md = `# Tri-nance Forensic Copilot Investigation Transcript\n`;
    md += `Exported: ${new Date().toLocaleString()}\n`;
    md += `Scope: ${activeAnalysis ? activeAnalysis.title : 'Global Filing Repository'}\n\n---\n\n`;

    turns.forEach((t) => {
      md += `### ${t.role === 'user' ? 'Analyst' : 'Tri-nance Intelligence Copilot'} (${new Date(
        t.timestamp
      ).toLocaleTimeString()})\n\n`;
      md += `${t.content}\n\n`;
      if (t.citations && t.citations.length > 0) {
        md += `**Citations:**\n`;
        t.citations.forEach((c) => {
          md += `- [${c.analysisTitle}, Line ${c.sourceLocation?.line || 'N/A'}] "${c.excerpt}"\n`;
        });
        md += `\n`;
      }
      if (t.calculationResult) {
        const delta = (t.calculationResult.current - t.calculationResult.prior).toFixed(2);
        const pct = t.calculationResult.percentChange !== null ? `${t.calculationResult.percentChange.toFixed(1)}%` : 'N/A';
        md += `**Deterministic Calculation (${t.calculationResult.metricName || 'Metric'}):** Delta ${delta} (${pct}) — ${t.calculationResult.explanation}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trinance-investigation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleChecklist = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: i.status === 'completed' ? 'pending' : 'completed' }
          : i
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-200 shadow-2xs">
      {/* Left Panel: Scope, Presets, and Checklist */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        {/* Scope Selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/40">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Investigation Scope
          </label>
          <select
            value={selectedAnalysisId}
            onChange={(e) => setSelectedAnalysisId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-brand-navy focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Vault-Wide (All Available Filings)</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          {activeAnalysis && (
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>{activeAnalysis.wordCount.toLocaleString()} words</span>
              <Link
                href={`/dashboard/analyze/${activeAnalysis.id}`}
                className="text-brand-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>View dossier</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          )}
        </div>

        {/* Scrollable Content: Presets & Checklist */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Presets */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Investigation Presets
            </span>
            <div className="space-y-1.5">
              {PRESET_INVESTIGATIONS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(preset.prompt)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-navy">
                      {preset.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Investigation Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Investigation Checklist
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {checklist.filter((i) => i.status === 'completed').length}/{checklist.length}
              </span>
            </div>

            {checklist.length > 0 ? (
              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.status === 'completed'}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${
                          item.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Checklist items will populate dynamically as Copilot identifies investigation tracks.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTurns([]);
              setChecklist([]);
            }}
            disabled={turns.length === 0}
            className="text-xs text-slate-500 hover:text-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            disabled={turns.length === 0}
            className="text-xs text-slate-700"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export Brief
          </Button>
        </div>
      </div>

      {/* Center Main Panel: Conversation Stream & Composer */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Workstation Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-brand-navy">
                  Tri-nance Intelligence Copilot
                </h1>
                <span className="px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80">
                  Evidence-Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calm, precise financial investigation partner with deterministic calculation engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Ctrl+J opens quick drawer anywhere
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {turns.length === 0 && (
            <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-navy">
                  Autonomous Financial Investigation Partner
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ask nuanced questions regarding financial risks, cash runway, covenant compliance, verbatim evidence citations, or select a preset investigation from the left sidebar.
                </p>
              </div>

              {/* Sample Starters */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  'What are the strongest liquidity concerns?',
                  'Calculate revenue delta vs previous filings',
                  'Find mitigating management disclosures',
                ].map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(starter)}
                    className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-all"
                  >
                    &ldquo;{starter}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => {
            const isUser = turn.role === 'user';
            const feedback = feedbackMap[turn.id];

            return (
              <div
                key={turn.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-2xl p-4.5 space-y-3.5 text-xs shadow-2xs ${
                    isUser
                      ? 'bg-brand-navy text-white'
                      : 'bg-white border border-slate-200/90 text-slate-800'
                  }`}
                >
                  {/* Content body */}
                  <div className="whitespace-pre-line leading-relaxed font-sans">
                    {turn.content}
                  </div>

                  {/* Deterministic Calculation Card */}
                  {turn.calculationResult && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] flex items-center gap-1.5 text-emerald-800">
                          <Calculator className="w-3.5 h-3.5" />
                          Deterministic Calculation: {turn.calculationResult.metricName || 'Metric Analysis'}
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-200/70 px-2 py-0.5 rounded font-bold">
                          Formula Audited
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                        <div>
                          <span className="text-emerald-700 block text-[10px]">Absolute Shift:</span>
                          <span className="font-bold text-sm text-emerald-900">
                            {(turn.calculationResult.current - turn.calculationResult.prior).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block text-[10px]">Percentage Shift:</span>
                          <span className="font-bold text-sm text-emerald-900">
                            {turn.calculationResult.percentChange !== null
                              ? `${turn.calculationResult.percentChange > 0 ? '+' : ''}${turn.calculationResult.percentChange.toFixed(1)}%`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-emerald-800 pt-1 leading-normal font-sans">
                        {turn.calculationResult.explanation}
                      </p>
                    </div>
                  )}

                  {/* Dynamic Visual Chart Card */}
                  {turn.chartPayload && (
                    <CopilotVisualChart payload={turn.chartPayload} />
                  )}

                  {/* Citation Chips */}
                  {turn.citations && turn.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Source Citations ({turn.citations.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {turn.citations.map((c, cIdx) => {
                          const citeKey = c.findingId || `${c.analysisId}-${cIdx}`;
                          return (
                            <button
                              key={citeKey}
                              onClick={() => setSelectedCitation(c)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
                                selectedCitation === c
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border-slate-200 text-slate-700'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[140px]">{c.analysisTitle}</span>
                              {c.sourceLocation?.line && (
                                <span className="font-mono text-[9px] opacity-75">
                                  :L{c.sourceLocation.line}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Consequential Action Card */}
                  {turn.pendingAction && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Consequential Action Proposed
                        </span>
                        <span className="text-[10px] font-mono text-amber-800 uppercase px-2 py-0.5 rounded bg-amber-200/60 font-bold">
                          Requires Approval
                        </span>
                      </div>
                      <p className="text-xs text-amber-800">{turn.pendingAction.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleExecuteAction(turn.pendingAction!)}
                          disabled={executingActionId === turn.pendingAction.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approve Action
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectAction(turn.pendingAction!.id)}
                          className="border-slate-300 text-slate-700 text-xs h-8 px-3"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {turn.actionExecutedResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        turn.actionExecutedResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {turn.actionExecutedResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{turn.actionExecutedResult.resultSummary}</span>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {turn.suggestedFollowUps && turn.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Suggested Follow-Up Investigations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {turn.suggestedFollowUps.map((fu, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(fu)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium text-left transition-colors"
                          >
                            &ldquo;{fu}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assistant Footer: Copy & Feedback */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-mono text-[10px]">
                        {new Date(turn.timestamp).toLocaleTimeString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyTurn(turn)}
                          className="hover:text-slate-600 p-1 rounded"
                          title="Copy response"
                        >
                          {copiedTurnId === turn.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleFeedback(turn.id, 'positive')}
                          className={`p-1 rounded hover:text-emerald-600 ${
                            feedback?.rating === 'positive' ? 'text-emerald-600' : ''
                          }`}
                          title="Helpful and accurate"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleFeedback(turn.id, 'negative', 'incorrect')}
                          className={`p-1 rounded hover:text-rose-600 ${
                            feedback?.rating === 'negative' ? 'text-rose-600' : ''
                          }`}
                          title="Incorrect or ungrounded"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-brand-navy">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Retrieving authorized evidence & executing verification...</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cross-referencing filing excerpts, verifying mathematical formulas, and evaluating uncertainty.
                </p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Message Composer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="space-y-2.5"
          >
            <div className="relative flex items-end bg-white rounded-2xl border border-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <textarea
                ref={inputRef}
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Tri-nance Copilot (e.g., 'What are the main liquidity drag factors in this filing?')"
                className="w-full text-xs p-3.5 bg-transparent resize-none focus:outline-none text-slate-800 placeholder-slate-400 max-h-32"
              />

              <div className="p-2 shrink-0">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!query.trim() || loading}
                  className="bg-brand-navy hover:bg-slate-900 text-white rounded-xl h-8 px-3 transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className="font-mono">Tri-nance Intelligence Copilot v2.4</span>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel: Selected Citation Inspector (collapsible / contextual) */}
      {selectedCitation && (
        <div className="w-full md:w-72 lg:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Verbatim Evidence Inspector
              </span>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Close
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Source Document
              </span>
              <p className="text-xs font-bold text-brand-navy mt-1">
                {selectedCitation.analysisTitle}
              </p>
              {selectedCitation.sourceLocation?.line && (
                <span className="text-[11px] font-mono text-indigo-600 mt-0.5 block">
                  Line {selectedCitation.sourceLocation.line}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Exact Quoted Excerpt
              </span>
              <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-500 text-xs text-slate-800 italic leading-relaxed">
                &ldquo;{selectedCitation.excerpt}&rdquo;
              </div>
            </div>

            {selectedCitation.epistemicCertainty && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Epistemic Grounding
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {selectedCitation.epistemicCertainty.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href={`/dashboard/analyze/${selectedCitation.analysisId}`}
              className="w-full py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Complete Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
