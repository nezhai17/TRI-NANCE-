/**
 * Tri-nance Visual Design System — Analytical Chart Tokens & Helpers
 */

export const CHART_THEME = {
  inkNavy: '#0A0F1D',
  cardBg: '#FFFFFF',
  subtleBg: '#F8FAFC',
  border: '#E2E8F0',
  gridLine: '#F1F5F9',
  axisText: '#64748B',
  tooltipBg: '#0F172A',
  tooltipBorder: '#1E293B',
  tooltipText: '#F8FAFC',
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#059669',
};

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#64748B',
  mixed: '#F59E0B',
};

export const EPISTEMIC_COLORS: Record<string, string> = {
  documented_fact: '#059669',
  hedged_projection: '#D97706',
  ambiguous_disclosure: '#8B5CF6',
};

export const SERIES_PALETTE = [
  '#2563EB', // Brand Royal Blue
  '#4F46E5', // Indigo
  '#0EA5E9', // Sky Teal
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#64748B', // Slate
];

export function formatMetricNumber(val: number, options?: { decimals?: number; prefix?: string; suffix?: string }): string {
  if (isNaN(val)) return '—';
  const dec = options?.decimals ?? (Number.isInteger(val) ? 0 : 2);
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`;
}

export function formatCurrencyM(val: number): string {
  if (isNaN(val)) return '—';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return '—';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}

export function exportChartDataToCSV(title: string, data: Record<string, unknown>[]) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const cell = row[h];
      const escaped = String(cell ?? '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-data.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
