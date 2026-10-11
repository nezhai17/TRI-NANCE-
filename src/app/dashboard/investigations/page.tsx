import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { InvestigationsWorkspace } from '@/components/investigations/InvestigationsWorkspace';

export default async function InvestigationsPage() {
  await getCurrentUser();

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Loading Investigations Workspace...</p>
          </div>
        }
      >
        <InvestigationsWorkspace />
      </Suspense>
    </div>
  );
}
