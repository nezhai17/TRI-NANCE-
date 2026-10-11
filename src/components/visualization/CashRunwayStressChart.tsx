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
  Legend,
} from 'recharts';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { CHART_THEME } from './chart-tokens';

interface CashRunwayStressChartProps {
  cashBalance: number;
  monthlyBurn: number;
}

export const CashRunwayStressChart: React.FC<CashRunwayStressChartProps> = ({
  cashBalance,
  monthlyBurn,
}) => {
  const chartData = useMemo(() => {
    if (isNaN(cashBalance) || isNaN(monthlyBurn) || monthlyBurn <= 0) {
      return [];
    }

    const baselineMonths = Math.ceil(cashBalance / monthlyBurn);
    const stressMonths = Math.ceil(cashBalance / (monthlyBurn * 1.25));
    const horizon = Math.min(24, Math.max(baselineMonths, stressMonths, 6));

    const points = [];
    for (let m = 0; m <= horizon; m++) {
      const baseRemaining = Math.max(0, Number((cashBalance - monthlyBurn * m).toFixed(1)));
      const stressRemaining = Math.max(0, Number((cashBalance - monthlyBurn * 1.25 * m).toFixed(1)));
      points.push({
        month: `M${m}`,
        monthNum: m,
        baseline: baseRemaining,
        stress: stressRemaining,
      });
    }
    return points;
  }, [cashBalance, monthlyBurn]);

  return (
    <VisualizationShell
      title="Liquidity Depletion & Stress Runway Curve"
      subtitle="Cash balance trajectory under baseline burn vs. +25% stress scenario"
      badge="Runway Model"
      infoExplanation="Plots projected cash balance month-by-month. The shaded red zone represents less than 6 months of liquidity runway remaining, signaling urgent refinancing or restructuring requirements."
      data={chartData}
      sourceContext={`Starting Liquidity: $${cashBalance}M | Monthly Burn: $${monthlyBurn}M`}
    >
      <div className="h-64 w-full flex items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center text-xs text-slate-400">
            Enter valid cash and burn rate to simulate depletion curves.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} />

              <XAxis dataKey="month" stroke={CHART_THEME.axisText} fontSize={10} tickLine={false} />
              <YAxis
                stroke={CHART_THEME.axisText}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}M`}
              />

              <Tooltip
                content={
                  <InteractiveTooltip
                    formatter={(val) => `$${val}M`}
                  />
                }
              />

              <Legend
                verticalAlign="top"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />

              <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="3 3" />

              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline Burn Runway"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
              />

              <Line
                type="monotone"
                dataKey="stress"
                name="Stress Scenario (+25% burn)"
                stroke="#DC2626"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#DC2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </VisualizationShell>
  );
};
