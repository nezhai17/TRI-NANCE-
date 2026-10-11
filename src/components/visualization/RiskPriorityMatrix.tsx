'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { RiskFinding } from '@/lib/types';
import { VisualizationShell } from './VisualizationShell';
import { InteractiveTooltip } from './InteractiveTooltip';
import { CHART_THEME, SEVERITY_COLORS } from './chart-tokens';

interface FindingWithMeta {
  finding: RiskFinding;
  analysisId: string;
  analysisTitle: string;
}

interface RiskPriorityMatrixProps {
  findings: FindingWithMeta[];
  onSelectFinding?: (findingId: string) => void;
  selectedFindingId?: string | null;
}

const SEVERITY_NUMERIC: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const RiskPriorityMatrix: React.FC<RiskPriorityMatrixProps> = ({
  findings,
  onSelectFinding,
  selectedFindingId,
}) => {
  const plotData = useMemo(() => {
    return findings.map((f, idx) => {
      const conf = Math.max(0.1, Math.min(1.0, f.finding.confidence || 0.7));
      const sevNum = SEVERITY_NUMERIC[f.finding.severity] || 2;
      // Add slight deterministic jitter so overlapping points are discernible
      const jitterX = ((idx % 5) - 2) * 0.02;
      const jitterY = ((idx % 3) - 1) * 0.08;

      return {
        id: f.finding.id,
        name: f.finding.title,
        severity: f.finding.severity,
        category: f.finding.categoryLabel || f.finding.category,
        confidence: Number((conf + jitterX).toFixed(2)),
        displayConfidence: `${Math.round(conf * 100)}%`,
        severityScore: Number((sevNum + jitterY).toFixed(2)),
        analysisTitle: f.analysisTitle,
        color: SEVERITY_COLORS[f.finding.severity] || '#3B82F6',
      };
    });
  }, [findings]);

  return (
    <VisualizationShell
      title="Risk Priority Matrix & Evidence Strength Scatter"
      subtitle="Correlation between severity urgency (Y-axis) and evidence confidence (X-axis)"
      badge="2D Triage Quadrants"
      infoExplanation="Plots each detected commercial risk. The top-left quadrant represents findings with High Urgency but Lower Document Grounding—flagged as prime candidates for investigative diligence."
      sourceContext={`${findings.length} findings plotted`}
    >
      <div className="h-72 w-full flex items-center justify-center">
        {plotData.length === 0 ? (
          <div className="text-center text-xs text-slate-400">
            No risk findings available to plot.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridLine} />
              
              {/* Reference Diligence Zone (Top-Left) */}
              <ReferenceArea
                x1={0}
                x2={0.65}
                y1={2.5}
                y2={4.5}
                fill="#FEF2F2"
                fillOpacity={0.6}
                stroke="#FCA5A5"
                strokeDasharray="4 4"
              />

              <XAxis
                type="number"
                dataKey="confidence"
                name="Evidence Confidence"
                domain={[0, 1.1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                stroke={CHART_THEME.axisText}
                fontSize={11}
                tickLine={false}
                label={{ value: 'Evidence Grounding Confidence →', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#64748B' }}
              />

              <YAxis
                type="number"
                dataKey="severityScore"
                name="Severity Urgency"
                domain={[0.5, 4.5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(v) => (v === 4 ? 'Critical' : v === 3 ? 'High' : v === 2 ? 'Medium' : 'Low')}
                stroke={CHART_THEME.axisText}
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />

              <ZAxis range={[70, 120]} />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl text-white text-xs max-w-xs space-y-1.5 z-50">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-2">
                        <span className="font-bold text-white truncate">{item.name}</span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold"
                          style={{ backgroundColor: `${item.color}33`, color: item.color }}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <p>Category: <span className="font-semibold text-white">{item.category}</span></p>
                        <p>Confidence: <span className="font-mono text-white">{item.displayConfidence}</span></p>
                        <p className="text-slate-400 truncate mt-1">Dossier: {item.analysisTitle}</p>
                      </div>
                      <p className="text-[10px] text-indigo-400 font-semibold pt-1">
                        Click bubble to inspect finding
                      </p>
                    </div>
                  );
                }}
              />

              <Scatter
                data={plotData}
                cursor="pointer"
                onClick={(node) => {
                  if (node && node.id && onSelectFinding) {
                    onSelectFinding(node.id);
                  }
                }}
              >
                {plotData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    stroke={selectedFindingId === entry.id ? '#FFFFFF' : `${entry.color}99`}
                    strokeWidth={selectedFindingId === entry.id ? 3 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </VisualizationShell>
  );
};
