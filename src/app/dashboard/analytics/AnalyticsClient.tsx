'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  Percent,
  Clock,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AnalysisRecord, FinancialMetric, AnomalyFinding } from '@/lib/types';
import { FinancialVarianceWaterfall } from '@/components/visualization/FinancialVarianceWaterfall';
import { CashRunwayStressChart } from '@/components/visualization/CashRunwayStressChart';

interface AnalyticsClientProps {
  analyses: AnalysisRecord[];
}

export const AnalyticsClient: React.FC<AnalyticsClientProps> = ({ analyses }) => {
  // Variance Calculator State
  const [calcMetricName, setCalcMetricName] = useState('Revenue / Net Sales');
  const [priorVal, setPriorVal] = useState<string>('120.5');
  const [currentVal, setCurrentVal] = useState<string>('145.8');

  // Runway Simulator State
  const [runwayCash, setRunwayCash] = useState<string>('50');
  const [runwayBurn, setRunwayBurn] = useState<string>('4.2');

  // Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossier, setSelectedDossier] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');

  // Aggregate all metrics and anomalies across analyses
  const { allMetrics, allAnomalies } = useMemo(() => {
    const metrics: Array<{
      metric: FinancialMetric;
      analysisId: string;
      analysisTitle: string;
    }> = [];

    const anomalies: Array<{
      anomaly: AnomalyFinding;
      analysisId: string;
      analysisTitle: string;
    }> = [];

    analyses.forEach((a) => {
      (a.numericalSignals || []).forEach((m) => {
        metrics.push({ metric: m, analysisId: a.id, analysisTitle: a.title });
      });

      (a.anomalies || []).forEach((anom) => {
        anomalies.push({ anomaly: anom, analysisId: a.id, analysisTitle: a.title });
      });
    });

    return { allMetrics: metrics, allAnomalies: anomalies };
  }, [analyses]);

  // Deterministic Variance Computation
  const varianceResult = useMemo(() => {
    const p = parseFloat(priorVal);
    const c = parseFloat(currentVal);

    if (isNaN(p) || isNaN(c)) {
      return null;
    }

    const delta = c - p;
    let pctChange = 0;
    if (p !== 0) {
      pctChange = (delta / Math.abs(p)) * 100;
    }

    return {
      delta: delta.toFixed(2),
      pctChange: pctChange.toFixed(2),
      isIncrease: delta > 0,
      isDecrease: delta < 0,
    };
  }, [priorVal, currentVal]);

  // Deterministic Runway Computation
  const runwayResult = useMemo(() => {
    const cash = parseFloat(runwayCash);
    const burn = parseFloat(runwayBurn);

    if (isNaN(cash) || isNaN(burn) || burn <= 0) {
      return null;
    }

    const months = cash / burn;
    const stressMonths = cash / (burn * 1.25); // +25% burn stress scenario

    let status: 'healthy' | 'caution' | 'critical' = 'healthy';
    if (months < 6) status = 'critical';
    else if (months < 12) status = 'caution';

    return {
      months: months.toFixed(1),
      stressMonths: stressMonths.toFixed(1),
      status,
    };
  }, [runwayCash, runwayBurn]);

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return allMetrics.filter((item) => {
      if (selectedDossier !== 'all' && item.analysisId !== selectedDossier) {
        return false;
      }
      if (selectedUnit !== 'all' && item.metric.unit !== selectedUnit) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.metric.name.toLowerCase().includes(q);
        const matchRaw = item.metric.rawValue.toLowerCase().includes(q);
        const matchExcerpt = item.metric.excerpt.toLowerCase().includes(q);
        return matchName || matchRaw || matchExcerpt;
      }
      return true;
    });
  }, [allMetrics, selectedDossier, selectedUnit, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indexed Financial Metrics</span>
          <p className="text-2xl font-bold text-brand-navy mt-1 tabular-nums">{allMetrics.length}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Extracted from disclosures & tables</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200/80 bg-amber-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Flagged Dissonances</span>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{allAnomalies.length}</p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Narrative vs financial conflicts</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200/80 bg-emerald-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Deterministic Engine</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">Active</p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Safe math, no hallucinated bounds</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-blue-200/80 bg-blue-50/10 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Dossiers</span>
          <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{analyses.length}</p>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Ready for cross-period variance</span>
        </div>
      </div>

      {/* Interactive Tool Grid: Variance Calculator & Cash Runway Stress Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Commercial Variance Calculator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Deterministic Variance & % Growth Calculator
              </h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Audited Formula
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Calculate exact delta and percentage shifts between baseline (e.g. Prior Period / Budget) and comparative (Current Period / Actual) metrics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Metric Description</label>
                <input
                  type="text"
                  value={calcMetricName}
                  onChange={(e) => setCalcMetricName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Baseline / Prior Value</label>
                <input
                  type="number"
                  step="any"
                  value={priorVal}
                  onChange={(e) => setPriorVal(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Current / Actual Value</label>
                <input
                  type="number"
                  step="any"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Quick preset selector from extracted metrics */}
            {allMetrics.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Or pull from indexed filing:</span>
                <div className="flex flex-wrap gap-1.5 mt-1 max-h-16 overflow-y-auto">
                  {allMetrics.slice(0, 5).map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCalcMetricName(m.metric.name);
                        if (m.metric.normalizedValue) {
                          setCurrentVal(m.metric.normalizedValue.toString());
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium"
                    >
                      {m.metric.name}: {m.metric.rawValue}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Variance Results Display */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {varianceResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Absolute Delta</span>
                  <p
                    className={`text-lg font-bold font-mono tabular-nums ${
                      varianceResult.isIncrease ? 'text-emerald-600' : varianceResult.isDecrease ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {Number(varianceResult.delta) > 0 ? `+${varianceResult.delta}` : varianceResult.delta}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Percentage Change</span>
                  <div className="flex items-center gap-1.5">
                    {varianceResult.isIncrease ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : varianceResult.isDecrease ? (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    ) : null}
                    <p
                      className={`text-lg font-bold font-mono tabular-nums ${
                        varianceResult.isIncrease ? 'text-emerald-600' : varianceResult.isDecrease ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {Number(varianceResult.pctChange) > 0 ? `+${varianceResult.pctChange}%` : `${varianceResult.pctChange}%`}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Analysis Note</span>
                  <p className="text-xs text-slate-600 font-medium">
                    {varianceResult.isIncrease
                      ? `${calcMetricName} expanded by ${varianceResult.pctChange}% vs prior reference baseline.`
                      : varianceResult.isDecrease
                      ? `${calcMetricName} contracted by ${varianceResult.pctChange}% vs prior reference baseline.`
                      : 'Zero directional shift detected.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400">Enter valid numbers to calculate variance</div>
            )}
          </div>
        </div>

        {/* Tool 2: Cash Runway & Burn Rate Stress Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Liquidity & Cash Runway Forecaster
              </h2>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Stress Model
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Forensic runway analysis simulating baseline survival horizon and conservative +25% burn-acceleration stress scenario.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Cash & Equivalents ($M)</label>
                <input
                  type="number"
                  step="any"
                  value={runwayCash}
                  onChange={(e) => setRunwayCash(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Monthly Net Burn Rate ($M)</label>
                <input
                  type="number"
                  step="any"
                  value={runwayBurn}
                  onChange={(e) => setRunwayBurn(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Runway Results Display */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {runwayResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Baseline Runway</span>
                  <p
                    className={`text-xl font-bold font-mono tabular-nums ${
                      runwayResult.status === 'healthy'
                        ? 'text-emerald-600'
                        : runwayResult.status === 'caution'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {runwayResult.months} Months
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Stress Scenario (+25% burn)</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-700">
                    {runwayResult.stressMonths} Months
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Covenant Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      runwayResult.status === 'healthy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : runwayResult.status === 'caution'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {runwayResult.status === 'healthy'
                      ? 'Adequate Runway (>12 mo)'
                      : runwayResult.status === 'caution'
                      ? 'Refinancing Horizon (6-12 mo)'
                      : 'Severe Liquidity Drag (<6 mo)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400">Enter cash and monthly burn rate to evaluate runway</div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Financial Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialVarianceWaterfall
          metricName={calcMetricName}
          prior={parseFloat(priorVal) || 0}
          current={parseFloat(currentVal) || 0}
        />
        <CashRunwayStressChart
          cashBalance={parseFloat(runwayCash) || 0}
          monthlyBurn={parseFloat(runwayBurn) || 0}
        />
      </div>

      {/* Flagged Anomaly & Contradiction Feed */}
      {allAnomalies.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Flagged Narrative-vs-Financial Contradictions ({allAnomalies.length})
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
              High Audit Sensitivity
            </span>
          </div>

          <div className="p-5 space-y-4">
            {allAnomalies.map((item, idx) => (
              <div
                key={item.anomaly.id || idx}
                className="p-4 rounded-xl border border-amber-200/90 bg-white hover:bg-amber-50/20 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">{item.anomaly.title}</span>
                  <Link
                    href={`/dashboard/analyze/${item.analysisId}`}
                    className="text-[11px] text-brand-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <span>{item.analysisTitle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.anomaly.description}</p>

                {item.anomaly.comparedExcerpts && item.anomaly.comparedExcerpts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {item.anomaly.comparedExcerpts.map((ex, exIdx) => (
                      <div key={exIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          {ex.label || `Statement ${exIdx + 1}`}
                        </span>
                        <p className="italic text-slate-700">&ldquo;{ex.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog of Extracted Financial Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Extracted Financial Metrics Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified numerical data points extracted verbatim with normalized values and source locations.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedDossier}
              onChange={(e) => setSelectedDossier(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-[150px]"
            >
              <option value="all">All Dossiers</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3">Metric Name</th>
                <th className="px-5 py-3">Reported Value</th>
                <th className="px-5 py-3">Unit</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Verbatim Excerpt</th>
                <th className="px-5 py-3 text-right">Source Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetrics.map((item, idx) => (
                <tr key={`${item.metric.id || idx}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-brand-navy">
                    {item.metric.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-brand-navy tabular-nums">
                    {item.metric.rawValue}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">
                    {item.metric.unit || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium">
                    {item.metric.period || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={item.metric.excerpt}>
                    &ldquo;{item.metric.excerpt}&rdquo;
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/analyze/${item.analysisId}`}
                      className="text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>{item.analysisTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredMetrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No financial metrics found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
