import React, { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { listAnalyses, listDocuments } from '@/lib/store/repository';
import { CopilotWorkspaceClient } from './CopilotWorkspaceClient';

export default async function CopilotPage() {
  const user = await getCurrentUser();
  const userId = user?.id || '';

  const [{ analyses }, documents] = await Promise.all([
    listAnalyses(userId, { limit: 100 }),
    listDocuments(userId),
  ]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col">
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading Copilot Workstation...</div>}>
        <CopilotWorkspaceClient analyses={analyses} documents={documents} />
      </Suspense>
    </div>
  );
}
