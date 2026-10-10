'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserProfile } from '@/lib/types';

interface DashboardShellProps {
  user: UserProfile | null;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ user, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
