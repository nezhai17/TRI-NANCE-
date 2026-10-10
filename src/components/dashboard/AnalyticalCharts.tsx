'use client';

import React from 'react';
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
} from 'recharts';
import { DashboardMetrics } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface AnalyticalChartsProps {
  metrics: DashboardMetrics;
}

const SENTIMENT_COLORS = {
  Positive: '#12B76A',
  Negative: '#F04438',
  Neutral: '#667085',
  Mixed: '#F79009',
};

const SEVERITY_COLORS = {
  Critical: '#991B1B',
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#059669',
};

export const AnalyticalCharts: React.FC<AnalyticalChartsProps> = ({ metrics }) => {
  const sentimentData = [
    { name: 'Positive', count: metrics.sentimentCounts.positive, color: SENTIMENT_COLORS.Positive },
    { name: 'Negative', count: metrics.sentimentCounts.negative, color: SENTIMENT_COLORS.Negative },
    { name: 'Neutral', count: metrics.sentimentCounts.neutral, color: SENTIMENT_COLORS.Neutral },
    { name: 'Mixed', count: metrics.sentimentCounts.mixed, color: SENTIMENT_COLORS.Mixed },
  ].filter((d) => d.count > 0);

  const severityData = [
    { name: 'Critical', count: metrics.severityCounts.critical, color: SEVERITY_COLORS.Critical },
    { name: 'High', count: metrics.severityCounts.high, color: SEVERITY_COLORS.High },
    { name: 'Medium', count: metrics.severityCounts.medium, color: SEVERITY_COLORS.Medium },
    { name: 'Low', count: metrics.severityCounts.low, color: SEVERITY_COLORS.Low },
  ];

  const totalSentimentItems = sentimentData.reduce((acc, curr) => acc + curr.count, 0);
  const totalSeverityItems = severityData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* 1. Sentiment Intelligence Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Sentiment Classification Distribution</span>
            <span className="text-xs font-normal text-slate-500">
              {totalSentimentItems} classified reports
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          {totalSentimentItems === 0 ? (
            <div className="text-center text-xs text-slate-400">
              No sentiment data available. Run an analysis to populate.
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
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {sentimentData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [`${value} report(s)`, 'Frequency']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. Risk Severity Pattern Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Identified Risk Severity Profile</span>
            <span className="text-xs font-normal text-slate-500">
              {totalSeverityItems} evaluated documents
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          {totalSeverityItems === 0 ? (
            <div className="text-center text-xs text-slate-400">
              No risk findings data available. Run an analysis to populate.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value} analysis result(s)`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={`bar-${entry.name}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
