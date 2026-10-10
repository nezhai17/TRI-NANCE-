'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  File,
  X,
  Play,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';

const SAMPLE_TEXTS = [
  {
    name: '10-Q Debt & Liquidity Strain (High Risk)',
    category: 'financial_report' as const,
    industry: 'Enterprise SaaS & Cloud',
    period: 'Q3 2026',
    title: 'Acme Corp Q3 Liquidity & Debt Covenant Disclosure',
    question: 'Evaluate covenant compliance and runway to avoid going-concern qualifications.',
    text: `During the third quarter, operating revenue contracted by 14% year-over-year to $42.5 million. Furthermore, gross margin dropped from 58% to 41% due to severe cost inflation and material shortages across our primary supply chain. Operating cash flow deficit reached $18.2 million, resulting in declining cash reserves of only $6.4 million. As a consequence of these pressures, the company experienced a covenant breach under our senior credit facility. In addition, customer churn spiked to 22% among key enterprise accounts following service outage incidents in August. Days sales outstanding rose to 84 days, compounding our cash burn rate. The company is in active discussions with lenders regarding covenant relief, but there is substantial doubt about the company's ability to continue as a going concern if secondary financing is not secured.`,
  },
  {
    name: 'Mixed Signals (Growth vs Cost Pressure)',
    category: 'earnings_call' as const,
    industry: 'Enterprise SaaS & Cloud',
    period: 'FY 2025',
    title: 'Zenith Tech Annual Financial Commentary',
    question: 'Determine if top-line growth is offset by operating leverage decay.',
    text: `We are pleased to report that annual revenue exceeded guidance, delivering 28% top-line growth to $110 million. Client expansion in enterprise cloud solutions remained resilient throughout fiscal year 2025. However, SG&A increased substantially by 45%, driven by aggressive sales hiring and soaring infrastructure costs. Gross margin eroded by 350 basis points, and operating expenses outpacing top-line realization caused net profit to swing from positive to a net loss of $4.1 million. While our commercial tailwind is robust, overdue receivables lengthened DSO to 71 days, and we face single vendor dependency for core machine learning compute infrastructure. Management has initiated an opex restructuring program to restore operating profitability.`,
  },
  {
    name: 'Strong & Profitable (Clean Profile)',
    category: 'financial_report' as const,
    industry: 'Banking & FinTech',
    period: 'FY 2025',
    title: 'Apex Financial Services Robust Performance',
    question: 'Confirm absence of litigation, regulatory enforcement, or capital adequacy pressures.',
    text: `Apex delivered record net income of $88.4 million for the fiscal year, representing an expansion of 32% year-over-year. Robust client retention and efficiency initiatives accelerated margin expansion across all retail and commercial banking segments. Solvency ratios remained exceptionally strong with a Tier-1 capital ratio of 16.2%, and cash-rich balance sheet reserves increased to $410 million. Operating cash flow surplus was $94 million, enabling a 15% increase in annual dividends. No regulatory inquiries, litigation liabilities, or debt covenant strains were reported during the audited period.`,
  },
];

export const AnalysisWorkspace: React.FC = () => {
  const router = useRouter();

  // Mode: paste vs upload
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');

  // Form State
  const [title, setTitle] = useState('');
  const [sourceCategory, setSourceCategory] = useState<string>('financial_report');
  const [industry, setIndustry] = useState<string>('Enterprise SaaS & Cloud');
  const [reportingPeriod, setReportingPeriod] = useState<string>('Q3 2026');
  const [analyticalQuestion, setAnalyticalQuestion] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'combined' | 'sentiment_only' | 'risk_only'>('combined');
  const [pastedText, setPastedText] = useState('');

  // Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<string>('');
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Computations
  const currentText = activeTab === 'paste' ? pastedText : extractedPreview;
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const charCount = currentText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handleTabSwitch = (newTab: 'paste' | 'upload') => {
    if (newTab === activeTab) return;
    if (activeTab === 'paste' && pastedText.trim().length > 40) {
      if (!confirm('You have entered text in the editor. Switching modes will keep your text saved. Proceed?')) {
        return;
      }
    }
    setActiveTab(newTab);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_TEXTS)[0]) => {
    setTitle(sample.title);
    setSourceCategory(sample.category);
    setIndustry(sample.industry);
    setReportingPeriod(sample.period);
    setAnalyticalQuestion(sample.question);
    setPastedText(sample.text);
    setActiveTab('paste');
  };

  const handleClearText = () => {
    if (pastedText && confirm('Clear all text from the editor?')) {
      setPastedText('');
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setUploadedFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and parse document');
      }

      setUploadedDocId(data.id);
      setExtractedPreview(data.extractedText);
      if (!title) {
        setTitle(data.title);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadedFile(null);
      setUploadedDocId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveTitle = title.trim() || `Financial Analysis - ${new Date().toLocaleDateString()}`;
    const effectiveText = activeTab === 'paste' ? pastedText.trim() : extractedPreview.trim();

    if (activeTab === 'paste' && effectiveText.length < 15) {
      setError('Please provide at least 15 characters of financial text to analyze.');
      return;
    }

    if (activeTab === 'upload' && !uploadedDocId && effectiveText.length < 15) {
      setError('Please upload a document or paste text before analyzing.');
      return;
    }

    setIsSubmitting(true);
    setAnalysisStep('1/4: Ingesting & tokenizing text...');

    try {
      setTimeout(() => setAnalysisStep('2/4: Computing Loughran-McDonald sentiment metrics...'), 400);
      setTimeout(() => setAnalysisStep('3/4: Scanning 12 financial risk patterns...'), 900);
      setTimeout(() => setAnalysisStep('4/4: Anchoring exact evidence offsets...'), 1400);

      const payload = {
        title: effectiveTitle,
        sourceType: activeTab === 'paste' ? 'pasted_text' : 'document_upload',
        sourceCategory,
        analysisMode,
        inputText: effectiveText,
        documentId: uploadedDocId || undefined,
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      router.push(`/dashboard/reports/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Quick-Load Templates */}
      <Card className="bg-slate-50/70 border-brand-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-accent shrink-0" />
              <span className="text-xs font-semibold text-brand-text-primary">
                Quick-Load Verified Test Dossiers:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-brand-navy hover:text-white border border-brand-border rounded-md text-slate-700 transition-colors shadow-2xs"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Analysis Workspace</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input financial filings, earnings call transcripts, management write-ups, or customer sentiment text.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg select-none">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('paste')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'paste'
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-600 hover:text-brand-navy'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('upload')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-600 hover:text-brand-navy'
                  }`}
                >
                  Upload Document
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Metadata Fields: Title, Category, Scope */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Report / Analysis Title"
                placeholder="e.g. Q3 2026 Earnings & Liquidity Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Source Category
                </label>
                <select
                  value={sourceCategory}
                  onChange={(e) => setSourceCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                >
                  <option value="financial_report">Financial Report / 10-K / 10-Q</option>
                  <option value="earnings_call">Earnings Call Transcript</option>
                  <option value="management_writeup">Management Commentary / MD&A</option>
                  <option value="customer_feedback">Customer Reviews / Feedback</option>
                  <option value="regulatory_filing">Regulatory / Audit Filing</option>
                  <option value="news_commentary">Financial News / Commentary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Intelligence Scope
                </label>
                <select
                  value={analysisMode}
                  onChange={(e) => setAnalysisMode(e.target.value as 'combined' | 'sentiment_only' | 'risk_only')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                >
                  <option value="combined">Combined (Sentiment + 12-Risk Patterns)</option>
                  <option value="sentiment_only">Sentiment Intelligence Only</option>
                  <option value="risk_only">Risk Intelligence Only</option>
                </select>
              </div>
            </div>

            {/* Contextual Optional Settings: Industry, Reporting Period, Question */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/60 rounded-xl border border-brand-border/70">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Industry Context
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="Enterprise SaaS & Cloud">Enterprise SaaS & Cloud</option>
                  <option value="Banking & FinTech">Banking & FinTech</option>
                  <option value="Manufacturing & Supply Chain">Manufacturing & Supply Chain</option>
                  <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                  <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                </select>
              </div>

              <Input
                label="Reporting Period"
                placeholder="e.g. Q3 2026 / FY 2025"
                value={reportingPeriod}
                onChange={(e) => setReportingPeriod(e.target.value)}
                className="py-1.5 text-xs"
              />

              <Input
                label="Specific Analytical Question (Optional)"
                placeholder="e.g. Are there signs of debt covenant strain?"
                value={analyticalQuestion}
                onChange={(e) => setAnalyticalQuestion(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>

            {/* TAB 1: Paste Text */}
            {activeTab === 'paste' && (
              <div className="space-y-2">
                <Textarea
                  label="Financial Content / Text Payload"
                  rows={10}
                  placeholder="Paste financial disclosures, quarterly reports, customer complaints, or business commentary here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="font-mono text-xs leading-relaxed"
                />
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
                  <div className="flex items-center gap-3">
                    <span>
                      Words: <strong className="text-slate-800">{wordCount}</strong>
                    </span>
                    <span>|</span>
                    <span>
                      Characters: <strong className="text-slate-800">{charCount}</strong>
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      ~{readingTimeMinutes} min read
                    </span>
                  </div>

                  {pastedText && (
                    <button
                      type="button"
                      onClick={handleClearText}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear Editor
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Upload Document */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-brand-border hover:border-brand-accent/50 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.docx,.txt,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                      <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-text-primary">
                          Click to upload or drag & drop financial document
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Supported formats: PDF, DOCX, TXT, CSV (Max 20MB)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{uploadedFile.name}</p>
                          <p className="text-xs text-slate-500">
                            {(uploadedFile.size / 1024).toFixed(1)} KB | Extracted {wordCount} words (~{readingTimeMinutes} min read)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setExtractedPreview('');
                          setUploadedDocId(null);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-white"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Extracted Text Preview */}
                    {extractedPreview && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Extracted Text Preview:
                        </p>
                        <div className="max-h-36 overflow-y-auto p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {extractedPreview.substring(0, 800)}
                          {extractedPreview.length > 800 ? '...' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-brand-border gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Deterministic Loughran-McDonald & 12-risk pattern algorithms applied with byte offset grounding.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting || uploading}
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                {isSubmitting ? analysisStep || 'Executing Analysis...' : 'Run Intelligence Analysis'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
