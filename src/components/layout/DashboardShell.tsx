'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { CopilotDrawer } from '../copilot/CopilotDrawer';
import { UserProfile } from '@/lib/types';

interface DashboardShellProps {
  user: UserProfile | null;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ user, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Global Ctrl+K (Command Palette) and Ctrl+J (Copilot) listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <Header
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenCopilot={() => setCopilotOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Global Copilot Launcher Pill */}
      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          aria-label="Open Tri-nance Copilot AI"
          title="Open Tri-nance Copilot AI (Ctrl+J)"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-brand-navy hover:bg-slate-900 text-white shadow-xl hover:shadow-2xl transition-all duration-200 border border-brand-navy/80 hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-brand-accent group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Copilot AI</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded font-mono text-[9px] bg-white/20 text-white/90">
            Ctrl+J
          </span>
        </button>
      )}

      {/* Slide-out Global Copilot Drawer */}
      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};
