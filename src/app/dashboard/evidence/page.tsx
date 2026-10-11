import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses } from '@/lib/store/repository';
import { SearchCheck, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { EvidenceClient } from './EvidenceClient';

export default async function EvidencePage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const { analyses } = await listAnalyses(userId, { limit: 100 });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <SearchCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy tracking-tight">
                Forensic Evidence & Provenance Explorer
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Verbatim source citations, line coordinates, epistemic grounding verification, and cross-claim contradiction auditing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/copilot"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Verify Evidence with Copilot</span>
          </Link>
          <Link
            href="/dashboard/investigations"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <span>Cross-Document Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Evidence Catalog */}
      <EvidenceClient analyses={analyses} />
    </div>
  );
}
