'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calculator,
  RefreshCw,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CopilotMessage,
  CopilotCitation,
  CalculationResult,
  CopilotActionProposal,
  CopilotIntent,
} from '@/lib/intelligence/copilot-engine';

interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: CopilotIntent;
  citations?: CopilotCitation[];
  calculationResult?: CalculationResult;
  informationGaps?: string[];
  pendingAction?: CopilotActionProposal;
  actionExecutedResult?: { success: boolean; resultSummary: string };
  suggestedFollowUps?: string[];
  timestamp: string;
}

const SUGGESTED_QUERIES = [
  'What are the strongest unresolved debt covenant risks?',
  'Calculate variance from $45M to $72M operating cash flow',
  'Draft an investigation on liquidity discrepancies across dossiers',
  'What questions for management and information gaps exist?',
  'Calculate variance from -$20M to +$10M net income',
];

export const InvestigationAssistant: React.FC<{ contextAnalysisId?: string }> = ({
  contextAnalysisId,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, loading]);

  const handleAsk = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    // Add user turn immediately
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
            content: `Copilot Request Notice: ${errData.error || 'Unable to execute intelligence query.'}`,
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
          content: 'Network communication failure. Please verify active server connection.',
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
        alert(`Action failed: ${err.error || 'Server rejected authorization.'}`);
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

  const handleClear = () => {
    if (confirm('Clear the current Copilot investigation thread?')) {
      setTurns([]);
      setSessionId(null);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(turns, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `copilot-diligence-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Card
      className={`border border-slate-200 shadow-sm transition-all duration-300 ${
        expanded ? 'fixed inset-4 z-50 flex flex-col bg-white shadow-2xl overflow-hidden' : 'mt-6'
      }`}
    >
      {/* Header */}
      <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-navy/10 text-brand-navy">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-brand-navy">
                Tri-nance Intelligence Copilot
              </CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Evidence Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Deterministic calculations, multi-period reconciliation & authorized dossier diligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {turns.length > 0 && (
            <>
              <button
                onClick={handleExport}
                title="Export Conversation"
                className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                title="Clear Conversation"
                className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse to standard view' : 'Expand full screen'}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className={`p-5 flex flex-col ${expanded ? 'flex-1 overflow-hidden' : ''} space-y-4`}>
        {/* Suggested Quick Inquiries (Shown when conversation is empty) */}
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Suggested Diligence Prompts:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(sq)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-left border border-slate-200/60"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{sq}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Thread */}
        {turns.length > 0 && (
          <div
            className={`space-y-4 overflow-y-auto pr-1 ${
              expanded ? 'flex-1 min-h-[300px]' : 'max-h-[500px]'
            }`}
          >
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col space-y-2.5 ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">
                    {turn.role === 'user' ? 'Analyst' : 'Tri-nance Copilot'}
                  </span>
                  <span>•</span>
                  <span>{turn.timestamp}</span>
                  {turn.intent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                      {turn.intent}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-xl text-xs max-w-[90%] md:max-w-[80%] leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-brand-navy text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs space-y-3'
                  }`}
                >
                  {/* Markdown or plain content */}
                  <div className="whitespace-pre-wrap">{turn.content}</div>

                  {/* Deterministic Variance Callout */}
                  {turn.calculationResult && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 space-y-1">
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

                  {/* Evidence Citations */}
                  {turn.citations && turn.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Grounded Disclosures & Citations ({turn.citations.length}):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {turn.citations.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded bg-white border border-slate-200 space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-brand-navy truncate max-w-[170px]">
                                {c.title}
                              </span>
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
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-3 italic">
                              &ldquo;{c.excerpt}&rdquo;
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[130px]">{c.analysisTitle}</span>
                              {c.epistemicCertainty && (
                                <span className="font-mono">{c.epistemicCertainty}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Information Gaps Callout */}
                  {turn.informationGaps && turn.informationGaps.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                        <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Unverified Information Gaps in Disclosure:
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                          {turn.informationGaps.map((gap, gIdx) => (
                            <li key={gIdx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Consequential Action Proposal Card */}
                  {turn.pendingAction && (
                    <div className="mt-3 p-3.5 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-indigo-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-indigo-600" />
                          Action Proposal Staged (Requires Analyst Approval)
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
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-navy" />
                  <span>Scanning authorized records, calculating variances, and synthesizing evidence...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2 pt-2 border-t border-slate-100"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask diligence questions, calculate variance (e.g. from $45M to $70M), or draft investigations..."
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
            className="h-9 px-4"
          >
            {loading ? 'Evaluating...' : 'Query Copilot'}
            <Send className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
