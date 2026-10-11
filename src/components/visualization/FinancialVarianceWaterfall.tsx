'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { CHART_THEME } from './chart-tokens';

interface FinancialVarianceWaterfallProps {
  metricName: string;
  prior: number;
  current: number;
}

export const FinancialVarianceWaterfall: React.FC<FinancialVarianceWaterfallProps> = ({
  metricName,
  prior,
  current,
}) => {
  const chartData = useMemo(() => {
    if (isNaN(prior) || isNaN(current)) return [];
    const delta = current - prior;
    const pct = prior !== 0 ? ((delta / Math.abs(prior)) * 100).toFixed(1) : '0';

    return [
      {
        name: 'Prior Reference',
        value: prior,
        color: '#64748B',
        type: 'baseline',
      },
      {
        name: 'Calculated Shift',
        value: delta,
        color: delta >= 0 ? '#10B981' : '#EF4444',
        type: 'delta',
        pctText: `${Number(pct) > 0 ? '+' : ''}${pct}%`,
      },
      {
        name: 'Current Actual',
        value: current,
        color: '#2563EB',
        type: 'current',
      },
    ];
  }, [prior, current]);

  return (
    <VisualizationShell
      title={`Deterministic Delta: ${metricName || 'Financial Metric'}`}
      subtitle="Variance bridge between prior baseline and current reporting period"
      badge="Waterfall Bridge"
      infoExplanation="Decomposes the metric transition. The green/red shift bar indicates the exact directional variance measured against the baseline."
      data={chartData}
      sourceContext={`Baseline: ${prior} → Actual: ${current}`}
    >
      <div className="h-64 w-full flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-xs text-slate-400">
            Enter valid baseline and actual numbers to generate variance bridge.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.gridLine} />
              <XAxis dataKey="name" stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} />
              <YAxis stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} axisLine={false} />
              <ReferenceLine y={0} stroke="#CBD5E1" />
              <Tooltip
                content={
                  <InteractiveTooltip
                    formatter={(val) => Number(val).toLocaleString()}
                  />
                }
              />
              <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-bridge-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </VisualizationShell>
  );
};
