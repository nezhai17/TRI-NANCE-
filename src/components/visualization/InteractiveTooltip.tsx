'use client';

import React from 'react';

export interface TooltipItem {
  name: string;
  value: number | string;
  color?: string;
  unit?: string;
  percentage?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  formatter?: (val: number | string) => string;
  sourceLabel?: string;
}

export const InteractiveTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  sourceLabel,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-white text-xs max-w-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100 z-50">
      {label && (
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {sourceLabel && (
            <span className="text-[10px] text-slate-400 font-mono font-normal truncate max-w-[120px]">
              {sourceLabel}
            </span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const displayVal = formatter ? formatter(item.value) : item.value;
          return (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <span className="text-slate-300 truncate">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-white tabular-nums shrink-0">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
