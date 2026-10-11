'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { AnalysisRecord } from '@/lib/types';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { ChartDataTable } from './ChartDataTable';
import { CHART_THEME } from './chart-tokens';

interface SentimentTrajectoryChartProps {
  analyses: AnalysisRecord[];
  onSelectDossier?: (analysisId: string) => void;
}

export const SentimentTrajectoryChart: React.FC<SentimentTrajectoryChartProps> = ({
  analyses,
  onSelectDossier,
}) => {
  const chartData = useMemo(() => {
    return [...analyses]
      .filter((a) => Boolean(a.sentimentResult))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((a, idx) => {
        const score = a.sentimentResult?.score ?? 0;
        const d = new Date(a.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        return {
          id: a.id,
          name: a.title,
          shortTitle: a.title.length > 20 ? a.title.slice(0, 18) + '...' : a.title,
          date: d,
          score: Number(score.toFixed(2)),
          overall: a.sentimentResult?.overall || 'neutral',
          summary: a.sentimentResult?.summary || '',
          index: idx + 1,
        };
      });
  }, [analyses]);

  const tableColumns = [
    { key: 'date', header: 'Filing Date' },
    { key: 'name', header: 'Dossier Title' },
    { key: 'overall', header: 'Sentiment Class' },
    {
      key: 'score',
      header: 'Score (-1.0 to +1.0)',
      align: 'right' as const,
      format: (val: unknown) => {
        const num = Number(val);
        return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
      },
    },
  ];

  return (
    <VisualizationShell
      title="Dossier Tone Trajectory & Volatility Timeline"
      subtitle="Chronological narrative tone progression mapped across filing releases"
      badge="Trajectory Line"
      infoExplanation="Plots sentiment scores on a normalized -1.0 to +1.0 scale. The shaded green area represents positive commercial optimism (>+0.15), grey represents neutral/hedged disclosure, and red represents adverse sentiment (<-0.15)."
      data={chartData}
      dataTableContent={<ChartDataTable columns={tableColumns} data={chartData} />}
      sourceContext={`${chartData.length} analyzed observation epochs`}
    >
      <div className="h-64 w-full flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-xs text-slate-400">
            No sentiment trajectory data available. Ingest filings to plot timeline.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
              {/* Positive Bullish Zone */}
              <ReferenceArea y1={0.15} y2={1.0} fill="#ECFDF5" fillOpacity={0.6} />
              {/* Neutral Band */}
              <ReferenceArea y1={-0.15} y2={0.15} fill="#F8FAFC" fillOpacity={0.6} />
              {/* Adverse Caution Zone */}
              <ReferenceArea y1={-1.0} y2={-0.15} fill="#FEF2F2" fillOpacity={0.6} />

              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} />

              <XAxis dataKey="date" stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                stroke={CHART_THEME.axisText}
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-white text-xs max-w-xs space-y-1.5 z-50">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-2">
                        <span className="font-bold text-white truncate">{item.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                            item.score > 0.15
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.score < -0.15
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}
                        >
                          {item.overall}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <p>Score: <span className="font-mono font-bold text-white tabular-nums">{item.score > 0 ? `+${item.score}` : item.score}</span></p>
                        <p>Release: <span className="text-white">{item.date}</span></p>
                        {item.summary && (
                          <p className="text-slate-400 line-clamp-2 mt-1 italic">&ldquo;{item.summary}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              <Line
                type="monotone"
                dataKey="score"
                name="Tone Score"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
                cursor="pointer"
                onClick={(e: unknown) => {
                  const event = e as { payload?: { id?: string } };
                  if (event && event.payload?.id && onSelectDossier) {
                    onSelectDossier(event.payload.id);
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </VisualizationShell>
  );
};
