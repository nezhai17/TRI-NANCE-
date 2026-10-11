'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { RiskFinding, RiskCategory } from '@/lib/types';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { ChartDataTable } from './ChartDataTable';
import { CHART_THEME, SEVERITY_COLORS } from './chart-tokens';

interface FindingWithMeta {
  finding: RiskFinding;
  analysisId: string;
  analysisTitle: string;
}

interface CategoryStackedBarProps {
  findings: FindingWithMeta[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  liquidity_cash_flow: 'Liquidity & Cash Flow',
  debt_leverage: 'Debt & Leverage',
  revenue_earnings_pressure: 'Revenue Pressure',
  expense_margin_deterioration: 'Margin Drag',
  customer_churn_confidence: 'Customer Churn',
  late_payments_collections: 'Collections & Aging',
  operational_disruption: 'Operational Disruption',
  supply_chain_dependency: 'Supply Chain',
  regulatory_compliance: 'Regulatory & Legal',
  fraud_inconsistencies: 'Fraud & Inconsistencies',
  reputational_risk: 'Reputational Risk',
  business_continuity: 'Business Continuity',
};

export const CategoryStackedBar: React.FC<CategoryStackedBarProps> = ({
  findings,
  selectedCategory,
  onSelectCategory,
}) => {
  const chartData = useMemo(() => {
    const map: Record<
      string,
      { categoryKey: string; name: string; critical: number; high: number; medium: number; low: number; total: number }
    > = {};

    // Initialize all 12 categories
    Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
      map[key] = {
        categoryKey: key,
        name: label,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
      };
    });

    findings.forEach((f) => {
      const cat = f.finding.category;
      if (!map[cat]) {
        map[cat] = {
          categoryKey: cat,
          name: CATEGORY_LABELS[cat] || cat,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      }
      const sev = f.finding.severity;
      if (sev === 'critical') map[cat].critical++;
      else if (sev === 'high') map[cat].high++;
      else if (sev === 'medium') map[cat].medium++;
      else if (sev === 'low') map[cat].low++;
      map[cat].total++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [findings]);

  const tableColumns = [
    { key: 'name', header: 'Commercial Category' },
    { key: 'critical', header: 'Critical', align: 'right' as const },
    { key: 'high', header: 'High', align: 'right' as const },
    { key: 'medium', header: 'Medium', align: 'right' as const },
    { key: 'low', header: 'Low', align: 'right' as const },
    { key: 'total', header: 'Total Findings', align: 'right' as const },
  ];

  return (
    <VisualizationShell
      title="12-Category Severity Decomposition"
      subtitle="Click any category bar to filter the active findings list below"
      badge="Stacked Bar"
      hasActiveFilter={selectedCategory !== 'all'}
      activeFilterLabel={selectedCategory !== 'all' ? (CATEGORY_LABELS[selectedCategory] || selectedCategory) : undefined}
      onResetFilter={() => onSelectCategory('all')}
      data={chartData}
      dataTableContent={<ChartDataTable columns={tableColumns} data={chartData} />}
      sourceContext="Cross-filtering enabled: updates findings triage"
    >
      <div className="h-72 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.slice(0, 8)}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedKey = state.activePayload[0].payload.categoryKey;
                onSelectCategory(selectedCategory === clickedKey ? 'all' : clickedKey);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_THEME.gridLine} />
            <XAxis type="number" stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_THEME.axisText}
              fontSize={10}
              tickLine={false}
              width={110}
            />
            <Tooltip content={<InteractiveTooltip />} />
            <Legend
              verticalAlign="top"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />
            <Bar dataKey="critical" name="Critical" stackId="a" fill={SEVERITY_COLORS.critical} cursor="pointer" />
            <Bar dataKey="high" name="High" stackId="a" fill={SEVERITY_COLORS.high} cursor="pointer" />
            <Bar dataKey="medium" name="Medium" stackId="a" fill={SEVERITY_COLORS.medium} cursor="pointer" />
            <Bar dataKey="low" name="Low" stackId="a" fill={SEVERITY_COLORS.low} radius={[0, 4, 4, 0]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </VisualizationShell>
  );
};
