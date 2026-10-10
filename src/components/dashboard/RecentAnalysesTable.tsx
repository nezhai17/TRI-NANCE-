'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ExternalLink,
  Download,
  Trash2,
  Filter,
  FileSpreadsheet,
  FileCode,
  Calendar,
  AlertCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { AnalysisRecord, SentimentClass, RiskSeverity } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RecentAnalysesTableProps {
  initialAnalyses: AnalysisRecord[];
  title?: string;
  description?: string;
}

export const RecentAnalysesTable: React.FC<RecentAnalysesTableProps> = ({
  initialAnalyses,
  title = 'Recent Financial Analyses',
  description = 'Real-time audit history of inspected financial reports, earnings commentary, and disclosures.',
}) => {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(initialAnalyses);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Rename modal
  const [editingItem, setEditingItem] = useState<AnalysisRecord | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter items in real-time
  const now = Date.now();
  const filtered = analyses.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceCategory.toLowerCase().includes(search.toLowerCase());

    const matchesSentiment =
      sentimentFilter === 'all' || item.sentimentResult?.overall === sentimentFilter;

    const matchesSeverity =
      severityFilter === 'all' || item.riskResult?.highestSeverity === severityFilter;

    const matchesSourceType =
      sourceTypeFilter === 'all' || item.sourceType === sourceTypeFilter;

    let matchesDate = true;
    if (dateRangeFilter === '7d') {
      matchesDate = now - new Date(item.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateRangeFilter === '30d') {
      matchesDate = now - new Date(item.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
    } else if (dateRangeFilter === '90d') {
      matchesDate = now - new Date(item.createdAt).getTime() <= 90 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesSentiment && matchesSeverity && matchesSourceType && matchesDate;
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStartRename = (item: AnalysisRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setRenameTitle(item.title);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !renameTitle.trim()) return;

    setIsRenaming(true);
    try {
      const res = await fetch(`/api/analyses/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameTitle.trim() }),
      });
      if (res.ok) {
        setAnalyses((prev) =>
          prev.map((a) => (a.id === editingItem.id ? { ...a, title: renameTitle.trim() } : a))
        );
        setEditingItem(null);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis report and associated findings?')) {
      return;
    }

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
      alert('Error connecting to server.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Search & Comprehensive Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title/category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => {
              setSentimentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="mixed">Mixed</option>
            <option value="neutral">Neutral</option>
          </select>

          {/* Risk Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Source Type Filter */}
          <select
            value={sourceTypeFilter}
            onChange={(e) => {
              setSourceTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="pasted_text">Pasted Text</option>
            <option value="document_upload">Document Upload</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Dates</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-600">No matching analyses found</p>
            <p className="text-xs text-slate-400">
              {search || sentimentFilter !== 'all' || severityFilter !== 'all' || sourceTypeFilter !== 'all' || dateRangeFilter !== 'all'
                ? 'Try adjusting your search query or reset filter settings.'
                : 'Run an analysis to generate persistent risk intelligence reports.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Report Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Highest Risk</th>
                    <th className="py-3 px-4">Findings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60 text-xs">
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/reports/${item.id}`)}
                    >
                      {/* Title */}
                      <td className="py-3.5 px-4 font-medium text-brand-text-primary">
                        <span className="truncate max-w-xs block font-semibold">{item.title}</span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-500 capitalize">
                        {item.sourceCategory.replace(/_/g, ' ')}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Sentiment */}
                      <td className="py-3.5 px-4">
                        {item.sentimentResult ? (
                          <Badge variant="sentiment" sentiment={item.sentimentResult.overall}>
                            {item.sentimentResult.overall}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Risk Severity */}
                      <td className="py-3.5 px-4">
                        {item.riskResult ? (
                          <Badge variant="severity" severity={item.riskResult.highestSeverity}>
                            {item.riskResult.highestSeverity}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Findings Count */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {item.findings?.length || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open Report */}
                          <Link
                            href={`/dashboard/reports/${item.id}`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-colors"
                            title="View Intelligence Report"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Rename */}
                          <button
                            onClick={(e) => handleStartRename(item, e)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Rename Report"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Export CSV */}
                          <a
                            href={`/api/export/${item.id}?format=csv`}
                            download
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Export CSV (formula-injection protected)"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Analysis"
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

            {/* Real Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-brand-border flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                  {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} analyses
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-brand-border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-mono font-medium text-slate-700">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-brand-border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Rename Dialog Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-brand-navy">Rename Analysis Dossier</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <Input
                label="Updated Report Title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                required
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
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
    </Card>
  );
};
