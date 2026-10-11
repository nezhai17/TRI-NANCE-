import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses, listDocuments } from '@/lib/store/repository';
import { Network, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { EntityClient } from './EntityClient';

export default async function EntitiesPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const [{ analyses }, documents] = await Promise.all([
    listAnalyses(userId, { limit: 100 }),
    listDocuments(userId),
  ]);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy tracking-tight">
                Corporate Entity & Counterparty Intelligence Explorer
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Profiles of issuers, auditors, lenders, counterparties, and regulatory agencies mapped across your filing repository.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/copilot"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Investigate Entity with Copilot</span>
          </Link>
          <Link
            href="/dashboard/risk"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <span>Review Risk Exposure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Entity Explorer Client */}
      <EntityClient analyses={analyses} documents={documents} />
    </div>
  );
}
