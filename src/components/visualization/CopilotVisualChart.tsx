'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { InteractiveTooltip } from './InteractiveTooltip';
import { CHART_THEME, SERIES_PALETTE, exportChartDataToCSV } from './chart-tokens';
import { BarChart3, Download, Info } from 'lucide-react';

export interface CopilotChartPayload {
  type: 'bar' | 'line' | 'pie' | 'waterfall';
  title: string;
  subtitle?: string;
  data: Array<Record<string, unknown>>;
  xAxisKey?: string;
  yAxisKey?: string;
  series?: Array<{ key: string; name: string; color?: string }>;
  assumptions?: string;
  limitations?: string;
}

interface CopilotVisualChartProps {
  payload: CopilotChartPayload;
}

export const CopilotVisualChart: React.FC<CopilotVisualChartProps> = ({ payload }) => {
  const { type, title, subtitle, data, xAxisKey = 'name', series = [], assumptions, limitations } = payload;

  if (!data || data.length === 0) return null;

  const handleExportCSV = () => {
    exportChartDataToCSV(title, data);
  };

  return (
    <div className="my-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
            <h4 className="text-xs font-bold text-white tracking-tight truncate">{title}</h4>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono uppercase font-bold">
              {type}
            </span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Render based on chart type */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' || type === 'waterfall' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
              <XAxis dataKey={xAxisKey} stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<InteractiveTooltip />} />
              {series.length > 0 ? (
                series.map((s, idx) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                ))
              ) : (
                <Bar
                  dataKey="value"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={`cell-cop-${idx}`}
                      fill={String(entry.color || SERIES_PALETTE[idx % SERIES_PALETTE.length])}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey={xAxisKey} stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<InteractiveTooltip />} />
              {series.length > 0 ? (
                series.map((s, idx) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={65}
                paddingAngle={3}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-cop-pie-${idx}`}
                    fill={String(entry.color || SERIES_PALETTE[idx % SERIES_PALETTE.length])}
                    stroke="#0F172A"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<InteractiveTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Assumptions & Limitations Notes */}
      {(assumptions || limitations) && (
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5 font-mono">
          {assumptions && <p>• Assumptions: {assumptions}</p>}
          {limitations && <p className="text-amber-400/90">• Limitations: {limitations}</p>}
        </div>
      )}
    </div>
  );
};
