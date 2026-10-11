'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { ChartDataTable } from './ChartDataTable';
import { EPISTEMIC_COLORS } from './chart-tokens';

interface EpistemicRadarDonutProps {
  epistemicStats: Record<string, number>;
}

export const EpistemicRadarDonut: React.FC<EpistemicRadarDonutProps> = ({ epistemicStats }) => {
  const chartData = useMemo(() => {
    const labels: Record<string, string> = {
      documented_fact: 'Documented Fact',
      hedged_projection: 'Hedged Projection',
      ambiguous_disclosure: 'Ambiguous / Speculative',
    };

    return Object.entries(epistemicStats).map(([key, count]) => ({
      key,
      name: labels[key] || key.replace('_', ' '),
      count,
      color: EPISTEMIC_COLORS[key] || '#64748B',
    })).filter((d) => d.count > 0);
  }, [epistemicStats]);

  const total = chartData.reduce((acc, curr) => acc + curr.count, 0);

  const tableColumns = [
    { key: 'name', header: 'Grounding Tier' },
    { key: 'count', header: 'Statement Count', align: 'right' as const },
    {
      key: 'share',
      header: 'Share (%)',
      align: 'right' as const,
      format: (_: unknown, row: Record<string, unknown>) => {
        const share = total > 0 ? ((Number(row.count) / total) * 100).toFixed(1) : '0';
        return `${share}%`;
      },
    },
  ];

  return (
    <VisualizationShell
      title="Epistemic Grounding Decomposition"
      subtitle="Statement stratification across factual disclosures vs. conditional projections"
      badge="Safe Harbor Tier"
      infoExplanation="Evaluates the epistemic validity of disclosure language. Documented Facts have verifiable historical citations, Hedged Projections include safe-harbor qualifiers, and Ambiguous Disclosures lack concrete metrics."
      data={chartData}
      dataTableContent={<ChartDataTable columns={tableColumns} data={chartData} />}
      sourceContext={`${total} verified disclosure statements`}
    >
      <div className="h-64 w-full flex items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-xs text-slate-400">
            No epistemic statements indexed yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-epi-${entry.key}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <InteractiveTooltip
                    formatter={(val) => `${val} statement${Number(val) === 1 ? '' : 's'}`}
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
  );
};
