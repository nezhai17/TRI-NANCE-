'use client';

import React from 'react';

interface ChartDataTableProps {
  columns: Array<{
    key: string;
    header: string;
    align?: 'left' | 'right' | 'center';
    format?: (val: unknown, row: Record<string, unknown>) => React.ReactNode;
  }>;
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

export const ChartDataTable: React.FC<ChartDataTableProps> = ({
  columns,
  data,
  emptyMessage = 'No chart records available.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full border border-slate-100 rounded-xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2.5 text-slate-700 ${
                    col.align === 'right'
                      ? 'text-right font-mono tabular-nums'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.format ? col.format(row[col.key], row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
