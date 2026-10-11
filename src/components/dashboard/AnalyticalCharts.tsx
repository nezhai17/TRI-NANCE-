'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { DashboardMetrics, AnalysisRecord } from '@/lib/types';
import { VisualizationShell } from '../visualization/VisualizationShell';
import { InteractiveTooltip } from '../visualization/InteractiveTooltip';
import { ChartDataTable } from '../visualization/ChartDataTable';
import {
  CHART_THEME,
  SEVERITY_COLORS,
  SENTIMENT_COLORS,
  formatMetricNumber,
} from '../visualization/chart-tokens';
import { ArrowRight, ExternalLink, Filter } from 'lucide-react';

interface AnalyticalChartsProps {
  metrics: DashboardMetrics;
  analyses?: AnalysisRecord[];
}

export const AnalyticalCharts: React.FC<AnalyticalChartsProps> = ({
  metrics,
  analyses = [],
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // 1. Sentiment Composition Data
  const sentimentData = useMemo(() => {
    return [
      { name: 'Positive', count: metrics.sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
      { name: 'Negative', count: metrics.sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
      { name: 'Neutral', count: metrics.sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral },
      { name: 'Mixed', count: metrics.sentimentCounts.mixed, color: SENTIMENT_COLORS.mixed },
    ].filter((d) => d.count > 0);
  }, [metrics]);

  const totalSentimentItems = sentimentData.reduce((acc, curr) => acc + curr.count, 0);

  // 2. Severity Distribution Data
  const severityData = useMemo(() => {
    return [
      { name: 'Critical', count: metrics.severityCounts.critical, color: SEVERITY_COLORS.critical },
      { name: 'High', count: metrics.severityCounts.high, color: SEVERITY_COLORS.high },
      { name: 'Medium', count: metrics.severityCounts.medium, color: SEVERITY_COLORS.medium },
      { name: 'Low', count: metrics.severityCounts.low, color: SEVERITY_COLORS.low },
    ];
  }, [metrics]);

  // 3. 12-Category Commercial Risk Distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, { label: string; count: number; critical: number; high: number }> = {};
    const labels: Record<string, string> = {
      liquidity_cash_flow: 'Liquidity & Cash Flow',
      debt_leverage: 'Debt & Leverage',
      revenue_earnings_pressure: 'Revenue Pressure',
      expense_margin_deterioration: 'Margin Drag',
      customer_churn_confidence: 'Customer Churn',
      late_payments_collections: 'Collections & Aging',
      operational_disruption: 'Operations',
      supply_chain_dependency: 'Supply Chain',
      regulatory_compliance: 'Regulatory',
      fraud_inconsistencies: 'Fraud & Audit',
      reputational_risk: 'Reputational',
      business_continuity: 'Continuity',
    };

    analyses.forEach((a) => {
      (a.findings || []).forEach((f) => {
        if (!counts[f.category]) {
          counts[f.category] = {
            label: labels[f.category] || f.categoryLabel || f.category,
            count: 0,
            critical: 0,
            high: 0,
          };
        }
        counts[f.category].count++;
        if (f.severity === 'critical') counts[f.category].critical++;
        if (f.severity === 'high') counts[f.category].high++;
      });
    });

    return Object.entries(counts)
      .map(([catKey, item]) => ({
        categoryKey: catKey,
        name: item.label,
        total: item.count,
        critical: item.critical,
        high: item.high,
      }))
      .sort((a, b) => b.total - a.total);
  }, [analyses]);

  // 4. Chronological Ingestion & Finding Activity Timeline
  const timelineData = useMemo(() => {
    if (!analyses || analyses.length === 0) return [];

    // Group analyses by creation date (YYYY-MM-DD)
    const dateMap = new Map<string, { date: string; analysesCount: number; findingsCount: number; criticalCount: number }>();

    [...analyses]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((a) => {
        const d = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dateMap.has(d)) {
          dateMap.set(d, { date: d, analysesCount: 0, findingsCount: 0, criticalCount: 0 });
        }
        const entry = dateMap.get(d)!;
        entry.analysesCount++;
        entry.findingsCount += (a.findings || []).length;
        entry.criticalCount += (a.findings || []).filter((f) => f.severity === 'critical').length;
      });

    return Array.from(dateMap.values());
  }, [analyses]);

  // Table columns for accessibility views
  const sentimentTableColumns = [
    { key: 'name', header: 'Classification' },
    { key: 'count', header: 'Filing Count', align: 'right' as const, format: (val: unknown) => Number(val).toLocaleString() },
    {
      key: 'share',
      header: 'Share (%)',
      align: 'right' as const,
      format: (_: unknown, row: Record<string, unknown>) => {
        const share = totalSentimentItems > 0 ? ((Number(row.count) / totalSentimentItems) * 100).toFixed(1) : '0';
        return `${share}%`;
      },
    },
  ];

  const categoryTableColumns = [
    { key: 'name', header: 'Commercial Category' },
    { key: 'total', header: 'Total Findings', align: 'right' as const },
    { key: 'critical', header: 'Critical Urgency', align: 'right' as const },
    { key: 'high', header: 'High Severity', align: 'right' as const },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Row 1: Sentiment Composition & Risk Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Sentiment Intelligence Distribution */}
        <VisualizationShell
          title="Sentiment Classification Distribution"
          subtitle="Multi-dossier narrative tone proportions across all analyzed filings"
          badge="NLP Tone Engine"
          infoExplanation="Displays the aggregate share of positive, negative, neutral, and mixed statements classified using the Tri-nance financial sentiment dictionary and epistemic hedging detection."
          data={sentimentData}
          dataTableContent={
            <ChartDataTable columns={sentimentTableColumns} data={sentimentData} />
          }
          sourceContext={`Aggregated across ${totalSentimentItems} evaluated reports`}
        >
          <div className="h-64 w-full flex items-center justify-center">
            {totalSentimentItems === 0 ? (
              <div className="text-center text-xs text-slate-400">
                No sentiment data available. Ingest a document to populate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {sentimentData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <InteractiveTooltip
                        formatter={(val) => `${val} report${Number(val) === 1 ? '' : 's'}`}
                      />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </VisualizationShell>

        {/* 2. Risk Severity Breakdown */}
        <VisualizationShell
          title="Risk Severity Distribution"
          subtitle="Triage breakdown across critical, high, medium, and low urgency findings"
          badge="4-Tier Severity"
          infoExplanation="Stratification of commercial risk findings according to required response urgency. Critical findings demand immediate committee review."
          data={severityData}
          sourceContext={`Open High-Severity Findings: ${metrics.openHighSeverityFindings}`}
        >
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLine} />
                <XAxis
                  dataKey="name"
                  stroke={CHART_THEME.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke={CHART_THEME.axisText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={
                    <InteractiveTooltip
                      formatter={(val) => `${val} open finding${Number(val) === 1 ? '' : 's'}`}
                    />
                  }
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {severityData.map((entry) => (
                    <Cell key={`cell-sev-${entry.name}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VisualizationShell>
      </div>

      {/* Row 2: Ingestion & Risk Timeline + 12-Category Commercial Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Ingestion & Finding Activity Timeline */}
        <VisualizationShell
          title="Operational Finding & Ingestion Pulse"
          subtitle="Chronological volume of filings ingested and findings detected"
          badge="Temporal Stream"
          infoExplanation="Tracks the operational cadence of uploaded financial documents alongside newly identified risk findings."
          data={timelineData}
          sourceContext={`${timelineData.length} active observation epochs`}
        >
          <div className="h-64 w-full flex items-center justify-center">
            {timelineData.length === 0 ? (
              <div className="text-center text-xs text-slate-400">
                Timeline activity will render as filings are uploaded and analyzed.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="findingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLine} />
                  <XAxis dataKey="date" stroke={CHART_THEME.axisText} fontSize={11} tickLine={false} />
                  <YAxis stroke={CHART_THEME.axisText} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<InteractiveTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="findingsCount"
                    name="Total Findings"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#findingsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="criticalCount"
                    name="Critical Findings"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#criticalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </VisualizationShell>

        {/* 4. 12-Category Commercial Risk Distribution */}
        <VisualizationShell
          title="12-Category Commercial Risk Exposure"
          subtitle="Finding density by commercial domain with 1-click drill-down to Risk Center"
          badge="Discipline Matrix"
          infoExplanation="Exposes concentration of risk across 12 institutional commercial categories. Click any bar to investigate findings in the Risk Center."
          data={categoryData}
          dataTableContent={<ChartDataTable columns={categoryTableColumns} data={categoryData} />}
          sourceContext="Click any category to filter Risk Center"
        >
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-center text-xs text-slate-400">
                No risk findings categorized yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_THEME.gridLine} />
                  <XAxis type="number" stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={CHART_THEME.axisText}
                    fontSize={10}
                    tickLine={false}
                    width={95}
                  />
                  <Tooltip
                    content={
                      <InteractiveTooltip
                        formatter={(val) => `${val} finding${Number(val) === 1 ? '' : 's'}`}
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    name="Total Findings"
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                    onClick={(entry) => {
                      if (entry && entry.categoryKey) {
                        window.location.href = `/dashboard/risk?category=${entry.categoryKey}`;
                      }
                    }}
                    cursor="pointer"
                  >
                    {categoryData.slice(0, 7).map((entry, idx) => (
                      <Cell
                        key={`cell-cat-${idx}`}
                        fill={entry.critical > 0 ? '#DC2626' : entry.high > 0 ? '#EA580C' : '#3B82F6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </VisualizationShell>
      </div>
    </div>
  );
};
