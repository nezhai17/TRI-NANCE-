'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FilePlus,
  History,
  ShieldAlert,
  SearchCheck,
  FolderArchive,
  Settings,
  ArrowRight,
  FileText,
  AlertTriangle,
  Sparkles,
  Command,
  X,
} from 'lucide-react';
import { AnalysisRecord } from '@/lib/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Workspaces' | 'Analyses' | 'Quick Actions';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
  badgeColor?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch recent analyses when opened
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    fetch('/api/analyses?limit=10')
      .then((res) => (res.ok ? res.json() : { analyses: [] }))
      .then((data) => {
        if (mounted && data.analyses) {
          setAnalyses(data.analyses);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list
  const items: PaletteItem[] = useMemo(() => {
    const staticWorkspaces: PaletteItem[] = [
      {
        id: 'nav-overview',
        category: 'Workspaces',
        title: 'Intelligence Overview',
        subtitle: 'Executive metrics, sentiment distribution, and emerging risk themes',
        icon: LayoutDashboard,
        action: () => {
          router.push('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav-analyze',
        category: 'Workspaces',
        title: 'New Financial Analysis',
        subtitle: 'Run 3-layer sentiment, risk, and evidence verification on text or filings',
        icon: FilePlus,
        action: () => {
          router.push('/dashboard/analyze');
          onClose();
        },
        badge: 'Engine',
      },
      {
        id: 'nav-history',
        category: 'Workspaces',
        title: 'Analysis History',
        subtitle: 'Audit trail of all processed documents, metrics, and risk classifications',
        icon: History,
        action: () => {
          router.push('/dashboard/history');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        category: 'Workspaces',
        title: 'Executive Reports Hub',
        subtitle: 'Browse all structured financial dossiers, findings, and evidence quotes',
        icon: ShieldAlert,
        action: () => {
          router.push('/dashboard/reports');
          onClose();
        },
      },
      {
        id: 'nav-investigations',
        category: 'Workspaces',
        title: 'Investigations Workspace',
        subtitle: 'Triage board and multi-period comparative matrix for findings review',
        icon: SearchCheck,
        action: () => {
          router.push('/dashboard/investigations');
          onClose();
        },
        badge: 'Triage',
      },
      {
        id: 'nav-documents',
        category: 'Workspaces',
        title: 'Document Library',
        subtitle: 'Vault of ingested 10-K, 10-Q, earnings transcripts, and commercial write-ups',
        icon: FolderArchive,
        action: () => {
          router.push('/dashboard/documents');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        category: 'Workspaces',
        title: 'Platform Settings',
        subtitle: 'Configure analysis strictness, risk thresholds, and API keys',
        icon: Settings,
        action: () => {
          router.push('/dashboard/settings');
          onClose();
        },
      },
    ];

    const actions: PaletteItem[] = [
      {
        id: 'act-sample-filing',
        category: 'Quick Actions',
        title: 'Load Meridian Tech Sample 10-K',
        subtitle: 'Inspect authentic hedged disclosures, liquidity ratios, and debt covenants',
        icon: Sparkles,
        action: () => {
          router.push('/dashboard/analyze?sample=meridian');
          onClose();
        },
        badge: 'Demo',
      },
      {
        id: 'act-review-open-risks',
        category: 'Quick Actions',
        title: 'Filter Open High-Severity Risks',
        subtitle: 'Immediately isolate critical and high risk items needing analyst justification',
        icon: AlertTriangle,
        action: () => {
          router.push('/dashboard/investigations?status=open');
          onClose();
        },
        badge: 'Priority',
      },
    ];

    const dynamicAnalyses: PaletteItem[] = analyses.map((a) => {
      const highestSev = a.riskResult?.highestSeverity || 'low';
      const sevColor =
        highestSev === 'critical' || highestSev === 'high'
          ? 'bg-rose-100 text-rose-800'
          : highestSev === 'medium'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800';

      return {
        id: `analysis-${a.id}`,
        category: 'Analyses',
        title: a.title || 'Untitled Dossier',
        subtitle: `${a.sentimentResult?.overall?.toUpperCase() || 'ANALYZED'} • ${
          a.findings?.length || 0
        } risks flagged • ${new Date(a.createdAt).toLocaleDateString()}`,
        icon: FileText,
        action: () => {
          router.push(`/dashboard/reports/${a.id}`);
          onClose();
        },
        badge: highestSev.toUpperCase(),
        badgeColor: sevColor,
      };
    });

    const combined = [...staticWorkspaces, ...actions, ...dynamicAnalyses];

    if (!query.trim()) {
      return combined;
    }

    const q = query.toLowerCase().trim();
    return combined.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [analyses, query, router, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, items.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Keep selected index in bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-scroll selected element into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group items by category for rendering
  const groupedCategories = ['Workspaces', 'Quick Actions', 'Analyses'] as const;

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search dossiers, or jump to workspace..."
            className="flex-1 bg-transparent text-sm text-brand-text-primary placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-200/60 border border-slate-300 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[55vh]">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No matching commands or dossiers found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by company, risk severity, or keyword</p>
            </div>
          ) : (
            groupedCategories.map((category) => {
              const categoryItems = items.filter((item) => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {category}
                  </div>
                  {categoryItems.map((item) => {
                    const currentIndex = flatIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        data-index={currentIndex}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-deep text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-white/10 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isSelected ? 'text-white' : 'text-brand-text-primary'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.badge && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : item.badgeColor || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p
                                className={`text-xs truncate ${
                                  isSelected ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-slate-300 pl-2 shrink-0">
                            <span className="text-[11px] font-medium hidden sm:inline">Select</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-brand-border flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded shadow-2xs">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded shadow-2xs">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Command className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Tri-nance Intelligence Command</span>
          </div>
        </div>
      </div>
    </div>
  );
};
