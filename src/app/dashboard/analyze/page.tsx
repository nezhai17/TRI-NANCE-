import { Suspense } from 'react';
import { AnalysisWorkspace } from '@/components/analysis/AnalysisWorkspace';

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Initializing Tri-nance Intelligence Engine...</p>
          </div>
        }
      >
        <AnalysisWorkspace />
      </Suspense>
    </div>
  );
}
