'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Edit2,
  Printer,
  FileSpreadsheet,
  FileCode,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AnalysisRecord, RiskSeverity, SentimentClass } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ReportsHubProps {
  initialAnalyses: AnalysisRecord[];
}

export const ReportsHub: React.FC<ReportsHubProps> = ({ initialAnalyses }) => {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(initialAnalyses);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Rename Dialog state
  const [editingReport, setEditingReport] = useState<AnalysisRecord | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute portfolio stats
  const totalReports = analyses.length;
  const criticalReports = analyses.filter((a) => a.riskResult?.highestSeverity === 'critical').length;
  const highRiskReports = analyses.filter((a) => a.riskResult?.highestSeverity === 'high').length;
  const avgRiskScore = totalReports > 0
    ? Math.round(analyses.reduce((sum, a) => sum + (a.riskResult?.overallRiskScore || 0), 0) / totalReports)
    : 0;

  // Filter analyses
  const filtered = analyses.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceCategory.toLowerCase().includes(search.toLowerCase()) ||
      (item.findings || []).some((f) => f.title.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity =
      severityFilter === 'all' || item.riskResult?.highestSeverity === severityFilter;

    const matchesSentiment =
      sentimentFilter === 'all' || item.sentimentResult?.overall === sentimentFilter;

    return matchesSearch && matchesSeverity && matchesSentiment;
  });

  const handleStartRename = (item: AnalysisRecord) => {
    setEditingReport(item);
    setNewTitle(item.title);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !newTitle.trim()) return;

    setIsRenaming(true);
    try {
      const res = await fetch(`/api/analyses/${editingReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setAnalyses((prev) =>
          prev.map((a) => (a.id === editingReport.id ? { ...a, title: newTitle.trim() } : a))
        );
        setEditingReport(null);
        router.refresh();
      } else {
        alert('Failed to rename report.');
      }
    } catch {
      alert('Error updating report title.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this intelligence dossier?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      } else {
        alert('Failed to delete report.');
      }
    } catch {
      alert('Network error while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-slate-50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Dossier Archive
          </span>
          <p className="text-2xl font-bold text-brand-navy mt-1 font-mono">{totalReports}</p>
          <p className="text-xs text-slate-500 mt-0.5">Persisted intelligence audits</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-red-50/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
            Critical Concern Flags
          </span>
          <p className="text-2xl font-bold text-red-700 mt-1 font-mono">{criticalReports}</p>
          <p className="text-xs text-slate-500 mt-0.5">Urgent covenant or solvency items</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-amber-50/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            High Severity Items
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">{highRiskReports}</p>
          <p className="text-xs text-slate-500 mt-0.5">Material risks under surveillance</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-blue-50/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent">
            Average Portfolio Risk
          </span>
          <p className="text-2xl font-bold text-brand-text-primary mt-1 font-mono">{avgRiskScore}/100</p>
          <p className="text-xs text-slate-500 mt-0.5">Weighted risk severity index</p>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Reports Repository</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, compare, export, and inspect persisted multi-dimensional financial intelligence reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search dossiers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
              <option value="neutral">Neutral</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-brand-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-brand-navy shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-brand-navy shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No matching reports found</p>
              <p className="text-xs text-slate-400">
                {search || severityFilter !== 'all' || sentimentFilter !== 'all'
                  ? 'Try broadening your search or resetting filters.'
                  : 'Run your first analysis to generate comprehensive financial intelligence reports.'}
              </p>
              <Link href="/dashboard/analyze" className="inline-block pt-2">
                <Button variant="primary" size="sm">
                  Run New Analysis
                </Button>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs hover:shadow-sm"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.sourceCategory.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.riskResult && (
                          <Badge variant="severity" severity={item.riskResult.highestSeverity}>
                            {item.riskResult.highestSeverity}
                          </Badge>
                        )}
                        {item.sentimentResult && (
                          <Badge variant="sentiment" sentiment={item.sentimentResult.overall}>
                            {item.sentimentResult.overall}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Link href={`/dashboard/reports/${item.id}`}>
                      <h4 className="font-bold text-sm text-brand-text-primary hover:text-brand-accent transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {item.riskResult?.summary || item.sentimentResult?.summary || item.inputText.substring(0, 160)}
                    </p>

                    <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>{item.findings?.length || 0} findings | {item.wordCount} words</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50/70 border-t border-brand-border flex items-center justify-between">
                    <Link
                      href={`/dashboard/reports/${item.id}`}
                      className="text-xs font-semibold text-brand-accent hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Deep Dive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1">
                      {/* Rename */}
                      <button
                        onClick={() => handleStartRename(item)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Rename Dossier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Export CSV */}
                      <a
                        href={`/api/export/${item.id}?format=csv`}
                        download
                        className="p-1 text-slate-400 hover:text-emerald-600"
                        title="Export CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </a>

                      {/* Export JSON */}
                      <a
                        href={`/api/export/${item.id}?format=json`}
                        download
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Export JSON"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </a>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete Report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Risk Severity</th>
                    <th className="py-3 px-4">Findings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-text-primary">
                        <Link href={`/dashboard/reports/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 capitalize">
                        {item.sourceCategory.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        {item.sentimentResult && (
                          <Badge variant="sentiment" sentiment={item.sentimentResult.overall}>
                            {item.sentimentResult.overall}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.riskResult && (
                          <Badge variant="severity" severity={item.riskResult.highestSeverity}>
                            {item.riskResult.highestSeverity}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{item.findings?.length || 0}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/reports/${item.id}`}
                            className="p-1 rounded text-slate-400 hover:text-brand-navy"
                            title="Open Dossier"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleStartRename(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/export/${item.id}?format=csv`}
                            download
                            className="p-1 rounded text-slate-400 hover:text-emerald-600"
                            title="Export CSV"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-brand-navy">Rename Report Dossier</h3>
              <button
                onClick={() => setEditingReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <Input
                label="New Report Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isRenaming}
                >
                  Save Title
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
