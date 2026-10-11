'use client';

import React, { useState } from 'react';
import {
  Download,
  Table as TableIcon,
  BarChart2,
  Info,
  Maximize2,
  RefreshCw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { exportChartDataToCSV } from './chart-tokens';

export interface TimeframeOption {
  label: string;
  value: string;
}

interface VisualizationShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  infoExplanation?: string;
  data?: Record<string, unknown>[];
  timeframeOptions?: TimeframeOption[];
  selectedTimeframe?: string;
  onTimeframeChange?: (value: string) => void;
  onResetFilter?: () => void;
  hasActiveFilter?: boolean;
  activeFilterLabel?: string;
  sourceContext?: string;
  className?: string;
  children: React.ReactNode;
  dataTableContent?: React.ReactNode;
  actions?: React.ReactNode;
}

export const VisualizationShell: React.FC<VisualizationShellProps> = ({
  title,
  subtitle,
  badge,
  infoExplanation,
  data,
  timeframeOptions,
  selectedTimeframe,
  onTimeframeChange,
  onResetFilter,
  hasActiveFilter,
  activeFilterLabel,
  sourceContext,
  className = '',
  children,
  dataTableContent,
  actions,
}) => {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleExportCSV = () => {
    if (data && data.length > 0) {
      exportChartDataToCSV(title, data);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col transition-all duration-200 ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-navy tracking-tight truncate">
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 uppercase tracking-wider shrink-0">
                {badge}
              </span>
            )}
            {infoExplanation && (
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-slate-400 hover:text-brand-navy transition-colors p-0.5 rounded"
                title="View metric definition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
          )}
        </div>

        {/* Controls & Tools */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Active Filter Pill */}
          {hasActiveFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[11px] font-semibold text-indigo-700">
              <span>{activeFilterLabel || 'Filtered'}</span>
              {onResetFilter && (
                <button
                  type="button"
                  onClick={onResetFilter}
                  className="hover:text-indigo-950 font-bold ml-1 text-xs"
                  title="Clear filter"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Timeframe Selector */}
          {timeframeOptions && timeframeOptions.length > 0 && onTimeframeChange && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              {timeframeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onTimeframeChange(opt.value)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedTimeframe === opt.value
                      ? 'bg-brand-navy text-white shadow-2xs'
                      : 'text-slate-600 hover:text-brand-navy'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Toggle Data Table / Chart */}
          {dataTableContent && (
            <button
              type="button"
              onClick={() => setShowDataTable(!showDataTable)}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                showDataTable
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={showDataTable ? 'Show Chart View' : 'Show Data Table (Accessibility)'}
            >
              {showDataTable ? <BarChart2 className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* CSV Export */}
          {data && data.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-navy text-xs transition-colors"
              title="Export Chart Data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Optional Info Dropdown */}
      {showInfo && infoExplanation && (
        <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 text-xs text-indigo-950 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{infoExplanation}</div>
        </div>
      )}

      {/* Main Chart or Data Table Body */}
      <div className="p-4 sm:p-5 flex-1 min-h-0 flex flex-col">
        {showDataTable && dataTableContent ? (
          <div className="overflow-x-auto flex-1">{dataTableContent}</div>
        ) : (
          <div className="flex-1 w-full flex flex-col">{children}</div>
        )}
      </div>

      {/* Optional Footer: Source Context & Data Freshness */}
      {sourceContext && (
        <div className="px-5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{sourceContext}</span>
          <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-slate-400">
            Real-Time Verified
          </span>
        </div>
      )}
    </div>
  );
};
