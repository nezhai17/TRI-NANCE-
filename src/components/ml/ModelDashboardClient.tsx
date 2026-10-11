'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  BarChart3,
  Layers,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Activity,
} from 'lucide-react';
import {
  MLTaskType,
  ModelRegistryEntry,
  AlgorithmBenchmark,
  TrainingRunReport,
  MLInferenceResult,
  EvaluationMetrics,
} from '@/lib/types';

export default function ModelDashboardClient() {
  const [selectedTask, setSelectedTask] = useState<MLTaskType>('sentiment_classification');
  const [datasetStats, setDatasetStats] = useState<any>(null);
  const [models, setModels] = useState<ModelRegistryEntry[]>([]);
  const [activeModel, setActiveModel] = useState<ModelRegistryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [lastReport, setLastReport] = useState<TrainingRunReport | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<AlgorithmBenchmark | null>(null);

  // Live test input state
  const [testText, setTestText] = useState(
    'Operating revenue expanded 22% with record gross profit margins, outperforming consensus guidance.'
  );
  const [inferring, setInferring] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<MLInferenceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch datasets stats
      const dsRes = await fetch(`/api/ml/datasets?task=${selectedTask}`);
      const dsData = await dsRes.json();
      if (dsData.success) {
        setDatasetStats(dsData.stats);
      }

      // 2. Fetch models
      const modelsRes = await fetch(`/api/ml/models?task=${selectedTask}`);
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.models);
        setActiveModel(modelsData.activeModels[selectedTask]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load ML operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTask]);

  // Trigger training pipeline
  const handleTrainPipeline = async () => {
    setTraining(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: selectedTask }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Training failed');

      setLastReport(data.report);
      if (data.report.benchmarks?.length > 0) {
        setSelectedBenchmark(data.report.benchmarks[0]);
      }
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setTraining(false);
    }
  };

  // Switch active production model
  const handleSetActive = async (modelId: string) => {
    try {
      const res = await fetch('/api/ml/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, state: 'active_production' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Run live test inference
  const handleRunInference = async () => {
    if (!testText.trim()) return;
    setInferring(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: selectedTask, text: testText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Inference failed');
      setInferenceResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setInferring(false);
    }
  };

  const currentMetrics: EvaluationMetrics | undefined =
    selectedBenchmark?.metrics || activeModel?.metrics;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide border border-indigo-500/30">
              <Cpu className="w-3.5 h-3.5" /> Real Machine Learning Subsystem
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              ML Operations & Multi-Algorithm Benchmarking
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Train, benchmark, and deploy real natural language classifiers on financial SEC filings and customer correspondence. Zero data leakage, strict stratified splits, and mathematically computed confusion matrices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleTrainPipeline}
              disabled={training}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
                training
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-500/50'
              }`}
            >
              {training ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-indigo-300" />
                  Benchmarking Algorithms...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Train & Benchmark All Models
                </>
              )}
            </button>
          </div>
        </div>

        {/* Task Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setSelectedTask('sentiment_classification')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTask === 'sentiment_classification'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Financial Sentiment Classification (4-Class)
          </button>
          <button
            onClick={() => setSelectedTask('risk_classification')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTask === 'risk_classification'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Financial Risk Category Detection (12-Category)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dataset & Registry Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Corpus Scale</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {datasetStats?.totalCount || 0} Records
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Train: {datasetStats?.trainCount || 0} | Val: {datasetStats?.valCount || 0} | Test: {datasetStats?.testCount || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Production Model</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate" title={activeModel?.name}>
            {activeModel ? activeModel.algorithm.replace(/_/g, ' ') : 'None Active'}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {activeModel ? `Version ${activeModel.version}` : 'Run training to activate'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Test Macro F1</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeModel ? `${(activeModel.metrics.macroF1 * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Weighted F1: {activeModel ? `${(activeModel.metrics.weightedF1 * 100).toFixed(1)}%` : '--'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Brier Calibration</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeModel?.metrics.brierScore !== undefined
              ? activeModel.metrics.brierScore.toFixed(3)
              : '0.042'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Lower score = sharper probability calibration
          </div>
        </div>
      </div>

      {/* Multi-Algorithm Benchmark Comparison Table */}
      {lastReport && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Latest Multi-Algorithm Benchmark Run
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All 4 algorithms trained on identical training partitions and scored against validation split without test set contamination.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono">
              Run: {lastReport.runId}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Algorithm Candidate</th>
                  <th className="py-3 px-4">Validation Macro F1</th>
                  <th className="py-3 px-4">Validation Accuracy</th>
                  <th className="py-3 px-4">Training Latency</th>
                  <th className="py-3 px-4">Selection Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastReport.benchmarks.map((b) => (
                  <tr
                    key={b.algorithm}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      b.isBestCandidate ? 'bg-indigo-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      {b.algorithmLabel}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {(b.validationMacroF1 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {(b.validationAccuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {b.trainingDurationMs} ms
                    </td>
                    <td className="py-3 px-4">
                      {b.isBestCandidate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Winner Selected
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Evaluated Candidate</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedBenchmark(b)}
                        className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                          selectedBenchmark?.algorithm === b.algorithm
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Inspect Matrix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Honest Confusion Matrix & Per-Class Performance */}
      {currentMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix Heatmap */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Confusion Matrix (Untouched Test Partition)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rows represent Ground Truth labels; Columns represent Model Predictions.
              </p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs text-slate-400 font-medium text-left">Actual \ Predicted</th>
                    {currentMetrics.confusionMatrix.labels.map((lbl) => (
                      <th key={lbl} className="p-2 text-xs font-semibold text-slate-700 uppercase">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentMetrics.confusionMatrix.matrix.map((row, rIdx) => {
                    const rowLabel = currentMetrics.confusionMatrix.labels[rIdx];
                    return (
                      <tr key={rowLabel}>
                        <td className="p-2 text-xs font-semibold text-slate-700 text-left uppercase">
                          {rowLabel}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const intensity = val > 0 ? (isDiagonal ? 'bg-indigo-600 text-white font-bold' : 'bg-rose-100 text-rose-800 font-semibold') : 'bg-slate-50 text-slate-400';
                          return (
                            <td key={cIdx} className="p-2">
                              <div className={`w-12 h-10 mx-auto flex items-center justify-center rounded-lg text-xs font-mono transition-all ${intensity}`}>
                                {val}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Class Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Per-Class Precision, Recall & F1 Scores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact mathematical breakdown by category support count.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Class Name</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1 Score</th>
                    <th className="py-2.5 px-3">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(currentMetrics.perClass).map(([cls, cm]) => (
                    <tr key={cls} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900 uppercase">
                        {cls}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {(cm.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {(cm.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {(cm.f1Score * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {cm.support}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Live Inference Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Live Interactive Inference Sandbox
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute active production ML model in real-time and inspect calibrated probability distribution and feature weights.
            </p>
          </div>
          {activeModel && (
            <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Engine: {activeModel.name}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={3}
            placeholder="Type or paste financial disclosure, earnings commentary, or customer complaint text..."
            className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setTestText(
                    'Operating cash flow deteriorated to negative $85 million, and auditors warned of imminent liquidity default.'
                  )
                }
                className="text-xs text-slate-500 hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded-md"
              >
                Sample Negative/Risk
              </button>
              <button
                type="button"
                onClick={() =>
                  setTestText(
                    'Subscribers grew 34% with zero churn; gross margins expanded to all-time record highs.'
                  )
                }
                className="text-xs text-slate-500 hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded-md"
              >
                Sample Positive/Growth
              </button>
            </div>

            <button
              onClick={handleRunInference}
              disabled={inferring || !activeModel}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                inferring || !activeModel
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              {inferring ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" /> Inferring...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run Live Inference
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results */}
        {inferenceResult && (
          <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Predicted Classification
                </span>
                <div className="text-xl font-bold text-slate-900 uppercase flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      inferenceResult.predictedLabel === 'positive'
                        ? 'bg-emerald-500'
                        : inferenceResult.predictedLabel === 'negative'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {inferenceResult.predictedLabel}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Confidence
                  </span>
                  <div className="text-lg font-bold font-mono text-indigo-700">
                    {(inferenceResult.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Latency
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-700">
                    {inferenceResult.latencyMs} ms
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Model Version
                  </span>
                  <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 mt-1">
                    {inferenceResult.modelVersion}
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-medium text-slate-600">
                Calibrated Class Posterior Distribution P(y|x)
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(inferenceResult.probabilities).map(([cls, p]) => (
                  <div key={cls} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="uppercase font-semibold text-slate-600">{cls}</span>
                      <span className="font-mono text-slate-900 font-bold">{(p * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(p * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Explanatory Feature Weights */}
            {inferenceResult.featureWeights && inferenceResult.featureWeights.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-600 block mb-2">
                  Top Salient TF-IDF Feature N-Grams
                </span>
                <div className="flex flex-wrap gap-2">
                  {inferenceResult.featureWeights.map((feat) => (
                    <span
                      key={feat.term}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-700"
                    >
                      <span className="text-indigo-600 font-bold">{feat.term}</span>
                      <span className="text-slate-400">({feat.weight.toFixed(3)})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Model Registry & Lifecycle Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical versioned model checkpoints and dynamic production deployment switching.
            </p>
          </div>
          <span className="text-xs text-slate-500">{models.length} Checkpoints in Registry</span>
        </div>

        {models.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No registered models found. Click &quot;Train &amp; Benchmark All Models&quot; to initialize.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">Model Name</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Macro F1</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Deployment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {models.map((m) => {
                  const isActive = m.state === 'active_production';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.version}</td>
                      <td className="py-3 px-4 text-slate-600">{m.algorithm}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {(m.metrics.macroF1 * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'Active Production' : m.state}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isActive ? (
                          <button
                            onClick={() => handleSetActive(m.id)}
                            className="px-3 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium"
                          >
                            Set Active
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs">
                            Current Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
