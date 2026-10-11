'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  X,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ListTodo,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  CopilotMessage,
  CopilotCitation,
  CalculationResult,
  CopilotActionProposal,
  CopilotIntent,
  CopilotChartPayload,
} from '@/lib/intelligence/copilot-engine';
import { CopilotVisualChart } from '@/components/visualization/CopilotVisualChart';
import { InvestigationChecklistItem } from '@/lib/types';

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

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextAnalysisId?: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  contextAnalysisId,
}) => {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<CopilotCitation | null>(null);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { rating: 'positive' | 'negative'; reason?: string }>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, loading]);

  const getContextualPrompts = () => {
    if (pathname.includes('/analyze')) {
      return [
        'What are the strongest detected liquidity concerns?',
        'Calculate variance between disclosed revenue and cash burn',
        'Find counter-evidence or mitigating disclosures in filing',
      ];
    }
    if (pathname.includes('/investigations')) {
      return [
        'Prepare a structured forensic investigation plan and checklist',
        'Draft an investigation on debt covenant ceiling risks',
        'Compare recurring risk patterns across all loaded dossiers',
      ];
    }
    if (pathname.includes('/reports')) {
      return [
        'Synthesize an executive risk briefing for the investment committee',
        'What questions should we prepare for management?',
        'Highlight all unverified information gaps across filings',
      ];
    }
    if (pathname.includes('/documents')) {
      return [
        'Calculate cash runway based on disclosed reserves and burn rate',
        'Summarize key financial signals extracted from uploaded documents',
        'Which document contains the highest risk severity?',
      ];
    }
    return [
      'What are our highest unresolved debt covenant risks?',
      'Calculate variance from -$20M to +$15M net income',
      'Synthesize an executive risk briefing across active dossiers',
      'Prepare a structured forensic investigation plan',
    ];
  };

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userTurn: ConversationTurn = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns((prev) => [...prev, userTurn]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          contextAnalysisId,
          sessionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sessionId) setSessionId(data.sessionId);

        const assistantTurn: ConversationTurn = {
          id: data.id || crypto.randomUUID(),
          role: 'assistant',
          content: data.content || data.answer,
          intent: data.intent,
          citations: data.citations || (data.relevantFindings?.map((rf: any) => ({
            title: rf.title,
            categoryLabel: rf.categoryLabel,
            severity: rf.severity,
            excerpt: rf.excerpt,
            analysisTitle: rf.analysisTitle,
            epistemicCertainty: rf.epistemicCertainty,
          })) || []),
          calculationResult: data.calculationResult,
          chartPayload: data.chartPayload,
          checklist: data.checklist,
          informationGaps: data.informationGaps || [],
          pendingAction: data.pendingAction,
          suggestedFollowUps: data.suggestedFollowUps || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setTurns((prev) => [...prev, assistantTurn]);
      } else {
        const errData = await res.json().catch(() => ({}));
        setTurns((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Notice: ${errData.error || 'Failed to process inquiry.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Network connection interrupted. Please verify server connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (turnId: string, action: CopilotActionProposal) => {
    setExecutingActionId(action.id);
    try {
      const res = await fetch('/api/assistant/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          confirmed: true,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  pendingAction: undefined,
                  actionExecutedResult: {
                    success: true,
                    resultSummary: result.resultSummary || 'Action approved and committed to repository.',
                  },
                }
              : t
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Action failed: ${err.error || 'Authorization error.'}`);
      }
    } catch {
      alert('Network error executing consequential action.');
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleDismissAction = (turnId: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, pendingAction: undefined } : t))
    );
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative', reason?: string) => {
    setFeedbackMap((prev) => ({ ...prev, [messageId]: { rating, reason } }));
    try {
      await fetch('/api/assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating, reason }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleCopy = (turnId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTurnId(turnId);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear active Copilot conversation?')) {
      setTurns([]);
      setSessionId(null);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(turns, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trinance-copilot-brief-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div
        className={`relative z-50 bg-white h-full shadow-2xl flex flex-col transition-all duration-300 border-l border-slate-200 ${
          expanded ? 'w-full md:w-3/4 lg:w-2/3' : 'w-full sm:w-[500px] lg:w-[560px]'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center text-white shadow-2xs">
              <Bot className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-brand-navy">Tri-nance Intelligence Copilot</h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Live Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                Active Context: {pathname.replace('/dashboard', '') || 'Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {turns.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  title="Export Brief"
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClear}
                  title="Clear Thread"
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Standard View' : 'Expand Width'}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors hidden sm:block"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Copilot"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {turns.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center text-brand-navy">
                <Sparkles className="w-6 h-6 text-brand-navy" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-brand-navy">
                  Evidence-Grounded Financial Intelligence
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Compute validated metric variances, calculate cash runway, extract counter-evidence, or generate structured forensic investigation plans.
                </p>
              </div>

              {/* Contextual Suggested Chips */}
              <div className="w-full space-y-2 pt-2 text-left">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suggested Inquiries for this Workspace:
                </p>
                <div className="space-y-2">
                  {getContextualPrompts().map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(p)}
                      className="w-full text-xs text-left p-2.5 rounded-xl border border-slate-200 hover:border-brand-accent/50 hover:bg-slate-50 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span className="text-slate-700 font-medium group-hover:text-brand-navy">{p}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-navy shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col space-y-2 ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">
                    {turn.role === 'user' ? 'Analyst' : 'Tri-nance Copilot'}
                  </span>
                  <span>•</span>
                  <span>{turn.timestamp}</span>
                  {turn.intent && (
                    <span className="px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600 border border-slate-200">
                      {turn.intent}
                    </span>
                  )}
                </div>

                <div
                  className={`p-4 rounded-xl text-xs max-w-[95%] leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-brand-navy text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{turn.content}</div>

                  {/* Deterministic Financial Arithmetic Callout */}
                  {turn.calculationResult && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Deterministic Mathematical Precision</span>
                      </div>
                      <p className="font-mono text-[11px] text-emerald-800">
                        {turn.calculationResult.formula}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        {turn.calculationResult.explanation}
                      </p>
                    </div>
                  )}

                  {/* Dynamic Visual Chart Card */}
                  {turn.chartPayload && (
                    <CopilotVisualChart payload={turn.chartPayload} />
                  )}

                  {/* Structured Investigation Checklist */}
                  {turn.checklist && turn.checklist.length > 0 && (
                    <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Actionable Diligence Tasks ({turn.checklist.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {turn.checklist.map((chk) => (
                          <div
                            key={chk.id}
                            className="p-2 rounded bg-white border border-indigo-100 flex items-start justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-medium text-slate-800 text-[11px]">{chk.title}</p>
                              {chk.notes && <p className="text-[10px] text-slate-500 italic">{chk.notes}</p>}
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                chk.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : chk.status === 'blocked'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {chk.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded Evidence Citations */}
                  {turn.citations && turn.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Grounded Disclosures & Citations ({turn.citations.length}):
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {turn.citations.map((c, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedCitation(c)}
                            className="p-2.5 rounded bg-white border border-slate-200 hover:border-brand-accent/50 hover:bg-slate-50/80 transition-all cursor-pointer space-y-1 shadow-2xs group"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-brand-navy group-hover:text-brand-accent transition-colors truncate max-w-[260px]">
                                {c.title}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    c.severity === 'critical'
                                      ? 'bg-red-100 text-red-800'
                                      : c.severity === 'high'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {c.severity}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brand-navy" />
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                              &ldquo;{c.excerpt}&rdquo;
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[200px]">{c.analysisTitle}</span>
                              {c.epistemicCertainty && (
                                <span className="font-mono">{c.epistemicCertainty}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Information Gaps Notice */}
                  {turn.informationGaps && turn.informationGaps.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                        <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Unverified Information Gaps in Filing:
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                          {turn.informationGaps.map((gap, gIdx) => (
                            <li key={gIdx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Staged Consequential Action Proposal Card */}
                  {turn.pendingAction && (
                    <div className="mt-3 p-3.5 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-indigo-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-indigo-600" />
                          Staged Action Proposal (Requires Confirmation)
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-200 text-indigo-800">
                          {turn.pendingAction.actionType}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-indigo-950">
                        {turn.pendingAction.title}
                      </p>
                      <p className="text-[11px] text-indigo-800">
                        {turn.pendingAction.description}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-indigo-200">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApproveAction(turn.id, turn.pendingAction!)}
                          disabled={executingActionId === turn.pendingAction.id}
                          className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs h-7 px-3"
                        >
                          {executingActionId === turn.pendingAction.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                              Committing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-300" />
                              Approve & Execute
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDismissAction(turn.id)}
                          className="text-xs h-7 px-2.5 text-slate-600 bg-white"
                        >
                          <XCircle className="w-3 h-3 mr-1 text-slate-400" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Confirmed Action Result */}
                  {turn.actionExecutedResult && (
                    <div className="mt-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{turn.actionExecutedResult.resultSummary}</span>
                    </div>
                  )}

                  {/* Actions & Feedback Row for Assistant Responses */}
                  {turn.role === 'assistant' && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(turn.id, turn.content)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
                          title="Copy message"
                        >
                          {copiedTurnId === turn.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Evaluation Rating Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFeedback(turn.id, 'positive')}
                          className={`p-1 rounded transition-colors ${
                            feedbackMap[turn.id]?.rating === 'positive'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title="Accurate and grounded"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(turn.id, 'negative', 'missing_evidence')}
                          className={`p-1 rounded transition-colors ${
                            feedbackMap[turn.id]?.rating === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title="Report inaccuracy or missing evidence"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {turn.suggestedFollowUps && turn.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {turn.suggestedFollowUps.map((sfu, sfuIdx) => (
                        <button
                          key={sfuIdx}
                          onClick={() => handleAsk(sfu)}
                          className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors flex items-center gap-1 text-left"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          <span>{sfu}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-navy" />
              <span>Scanning authorized records, calculating variances, and synthesizing evidence...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask financial inquiries, calculate runway, or plan investigations..."
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all pl-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={loading || !query.trim()}
              className="h-9 px-4 shrink-0"
            >
              {loading ? 'Evaluating...' : 'Query'}
              <Send className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>
          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-mono">
            <span>Deterministic Math & Citations</span>
            <span>Shortcut: Ctrl+J</span>
          </div>
        </div>
      </div>

      {/* Contextual Evidence Preview Inspector (Part 3.3) */}
      {selectedCitation && (
        <div className="fixed inset-0 z-60 overflow-hidden flex justify-center items-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedCitation(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-navy/10 text-brand-navy">
                  {selectedCitation.categoryLabel}
                </span>
                <h3 className="text-sm font-bold text-brand-navy mt-1">
                  {selectedCitation.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Dossier: {selectedCitation.analysisTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Verbatim Disclosure Excerpt:
              </p>
              <p className="text-xs text-slate-800 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                &ldquo;{selectedCitation.excerpt}&rdquo;
              </p>
              {selectedCitation.sourceLocation && (
                <p className="text-[10px] font-mono text-slate-400">
                  Location: Line {selectedCitation.sourceLocation.line || 1}
                  {selectedCitation.sourceLocation.page ? ` • Page ${selectedCitation.sourceLocation.page}` : ''}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Severity:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedCitation.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : selectedCitation.severity === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedCitation.severity}
                </span>
              </div>
              {selectedCitation.epistemicCertainty && (
                <span className="font-mono text-[10px] text-slate-500">
                  Certainty: {selectedCitation.epistemicCertainty}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
