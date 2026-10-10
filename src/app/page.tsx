'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Database,
  Lock,
  ChevronRight,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const PREVIEW_SAMPLES = [
  {
    label: 'High Risk (10-Q Debt & Cash Burn)',
    title: 'Acme Corp Q3 Liquidity & Debt Covenant Disclosure',
    sentiment: 'negative' as const,
    risk: 'critical' as const,
    score: -0.9,
    excerpt: 'Operating cash flow deficit reached $18.2 million, resulting in declining cash reserves of only $6.4 million. Covenant breach triggered under senior facility.',
    category: 'Liquidity & Debt Structure',
  },
  {
    label: 'Mixed Signals (Growth vs Cost Pressure)',
    title: 'Zenith Tech Annual Financial Commentary',
    sentiment: 'mixed' as const,
    risk: 'high' as const,
    score: 0.15,
    excerpt: 'Revenue expanded 28% to $110 million, however gross margin compressed 350 basis points due to severe cloud infrastructure and SG&A cost inflation.',
    category: 'Margin Compression & OPEX',
  },
  {
    label: 'Clean Growth (Profitable Expansion)',
    title: 'Apex Financial Services Robust Performance',
    sentiment: 'positive' as const,
    risk: 'low' as const,
    score: 0.94,
    excerpt: 'Apex delivered record net income expansion of 32% with cash-rich balance sheet reserves of $410 million. Zero litigation, covenant, or regulatory disputes.',
    category: 'Solvency & Capital Adequacy',
  },
];

export default function LandingPage() {
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const activeSample = PREVIEW_SAMPLES[activeSampleIdx];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col text-brand-text-primary">
      {/* Navigation Bar */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-brand-border sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="lg" />
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Workspace
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-brand-accent text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span>Financial Sentiment & Multi-Risk Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-navy max-w-4xl mx-auto leading-tight">
          See the signals behind the numbers.
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Analyze financial reports, business commentary, and customer feedback to uncover sentiment, identify potential risks, and explore the evidence behind every finding.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/dashboard/analyze">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Financial Analysis
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Explore Demo Workspace
            </Button>
          </Link>
        </div>

        {/* Live Interface Preview with Illustrative Sample Selector */}
        <div className="pt-10 max-w-5xl mx-auto text-left">
          <div className="bg-white rounded-2xl border border-brand-border shadow-xl overflow-hidden">
            {/* Window chrome header */}
            <div className="bg-brand-navy px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-300 font-mono ml-2">tri-nance-intelligence-console.tsx</span>
              </div>

              {/* Sample switcher pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden md:inline">
                  Interactive Preview:
                </span>
                {PREVIEW_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSampleIdx(idx)}
                    className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all ${
                      activeSampleIdx === idx
                        ? 'bg-brand-accent text-white shadow-2xs font-bold'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Active Dossier
                  </span>
                  <h3 className="text-sm font-bold text-brand-navy">{activeSample.title}</h3>
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-700 px-2.5 py-0.5 rounded border border-amber-300">
                  Illustrative Sample Data
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-brand-border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">1. Sentiment Dimension</span>
                    <Badge variant="sentiment" sentiment={activeSample.sentiment}>
                      {activeSample.sentiment}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-brand-navy">
                    Score: {activeSample.score > 0 ? '+' : ''}{activeSample.score}
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    "{activeSample.excerpt}"
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-brand-border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">2. Risk Dimension</span>
                    <Badge variant="severity" severity={activeSample.risk}>
                      {activeSample.risk}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-brand-navy">{activeSample.category}</p>
                  <p className="text-xs text-slate-600">
                    Pattern evaluated against 12 financial solvency, operational, and regulatory indicators.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-brand-border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">3. Evidence Dimension</span>
                    <Badge variant="classification" classification="explicitly_stated">Verified</Badge>
                  </div>
                  <p className="text-xs font-semibold text-brand-navy">Exact Byte Offsets</p>
                  <p className="text-xs text-slate-600">
                    Verbatim passage anchored at line 1 with audit coordinates and contextual impact rationale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Analysis Workflow */}
      <section className="py-16 bg-white border-y border-brand-border px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">
              End-to-End Intelligence Pipeline
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Transform unstructured financial text into evidence-backed risk intelligence in 4 coordinated steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-brand-border bg-slate-50/50 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-navy text-white text-xs font-bold flex items-center justify-center font-mono">
                01
              </div>
              <h4 className="font-bold text-sm text-brand-navy">Ingest & Extract</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parse PDF, DOCX, CSV, or TXT documents using server-side extraction libraries.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-slate-50/50 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-accent text-white text-xs font-bold flex items-center justify-center font-mono">
                02
              </div>
              <h4 className="font-bold text-sm text-brand-navy">Score Sentiment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply Loughran-McDonald financial domain lexicons with negation and contradiction detection.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-slate-50/50 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                03
              </div>
              <h4 className="font-bold text-sm text-brand-navy">Detect 12 Risks</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Classify cash burn, covenant breaches, DSO delays, churn, and going-concern signals.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-slate-50/50 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                04
              </div>
              <h4 className="font-bold text-sm text-brand-navy">Anchor Evidence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Link every finding to exact line numbers and byte offsets with formula-protected export capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Three Dimensions of Intelligence */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">
            Three Core Intelligence Dimensions
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Tri-nance combines three foundational dimensions to replace subjective impressions with structured intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-slate-400 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-brand-navy">Sentiment Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Distinguishes between superficial optimism and underlying financial disclosures. Identifies conflicting statements where positive top-line growth coincides with declining operating margins.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-400 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-brand-navy">Risk Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies a four-tier severity rubric (Low, Medium, High, Critical) across 12 distinct business risk domains with actionable mitigation next steps.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-slate-400 transition-all">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-brand-navy">Evidence Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Re-verifies all excerpts against original content to prevent ungrounded assertions. Provides interactive synchronized text highlighting and complete source citations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security & Governance Footer */}
      <footer className="mt-auto bg-brand-deep text-slate-300 py-12 px-6 lg:px-12 border-t border-white/10 text-xs">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Logo size="md" inverted />
            <div className="flex items-center gap-4 text-slate-400">
              <Link href="/login" className="hover:text-white">Sign In</Link>
              <Link href="/dashboard" className="hover:text-white">Workspace</Link>
              <Link href="/dashboard/reports" className="hover:text-white">Reports Hub</Link>
              <Link href="/dashboard/settings" className="hover:text-white">API Keys</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed space-y-2">
            <p>
              <strong>Security & Governance:</strong> Tri-nance treats all corporate documents as confidential. Data is isolated via PostgreSQL Row Level Security (RLS) and client tokens are never exposed.
            </p>
            <p>
              <strong>Regulatory Disclaimer:</strong> Tri-nance provides automated sentiment scoring and textual pattern detection based on submitted materials. Outputs do not constitute audited financial advice, formal solvency certifications, or fiduciary guarantees.
            </p>
            <p className="text-slate-500 pt-2">
              © {new Date().getFullYear()} Tri-nance Intelligence Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
