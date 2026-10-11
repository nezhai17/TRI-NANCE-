'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, User, ShieldCheck, ChevronDown, Settings, LogOut, Search, Command, Bot, Bell, Radio } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserProfile } from '@/lib/types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenMobile: () => void;
  onOpenCommandPalette: () => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenMobile, onOpenCommandPalette, onOpenCopilot }) => {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const getPageTitle = () => {
    if (pathname === '/dashboard') return { title: 'Intelligence Overview', section: 'Workspace' };
    if (pathname === '/dashboard/documents') return { title: 'Document Vault', section: 'Source Data' };
    if (pathname === '/dashboard/analyze') return { title: 'New Analysis', section: 'Intelligence Engine' };
    if (pathname === '/dashboard/risk') return { title: 'Risk Center', section: 'Risk Engine & Triage' };
    if (pathname === '/dashboard/sentiment') return { title: 'Sentiment Intelligence', section: 'Narrative Analytics' };
    if (pathname === '/dashboard/analytics') return { title: 'Financial Analytics', section: 'Quantitative Precision' };
    if (pathname === '/dashboard/evidence') return { title: 'Evidence Explorer', section: 'Provenance & Citations' };
    if (pathname === '/dashboard/ml') return { title: 'ML Operations & Benchmarking', section: 'Model Training & Registry' };
    if (pathname === '/dashboard/investigations') return { title: 'Investigations Workspace', section: 'Triage & Matrix' };
    if (pathname === '/dashboard/entities') return { title: 'Entity Explorer', section: 'Relational Graph' };
    if (pathname === '/dashboard/copilot') return { title: 'AI Copilot Workspace', section: 'Conversational Diligence' };
    if (pathname === '/dashboard/history') return { title: 'Analysis History', section: 'Audit Archive' };
    if (pathname === '/dashboard/reports') return { title: 'Executive Reports Hub', section: 'Dossier Center' };
    if (pathname.startsWith('/dashboard/reports/')) return { title: 'Report Deep Dive', section: 'Evidence Explorer' };
    if (pathname === '/dashboard/settings') return { title: 'Platform Settings', section: 'Preferences & Keys' };
    return { title: 'Financial Intelligence', section: 'Tri-nance' };
  };

  const { title, section } = getPageTitle();

  return (
    <header className="h-16 bg-white border-b border-brand-border sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left Title & Mobile Hamburger */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100 focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block -mb-0.5">
            {section}
          </span>
          <h1 className="text-lg font-bold text-brand-text-primary tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Middle Quick Search trigger */}
      <div className="flex-1 max-w-md hidden lg:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100/80 border border-brand-border rounded-xl transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-navy transition-colors" />
            <span>Search dossiers, commands, or jump to workspace...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Search Icon button */}
        <button
          onClick={onOpenCommandPalette}
          className="lg:hidden p-2 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open command search"
          title="Search (Ctrl+K)"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Engine Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Intelligence Engine Active</span>
        </div>

        {/* Global AI Copilot Trigger */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy border border-brand-navy/15 text-xs font-semibold transition-all shadow-2xs group"
            title="Open AI Copilot (Ctrl+J)"
          >
            <Bot className="w-4 h-4 text-brand-navy group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">AI Copilot</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.2 font-mono text-[9px] text-slate-500 bg-white border border-slate-200 rounded">
              Ctrl+J
            </kbd>
          </button>
        )}

        {/* Activity & Notifications Bell */}
        <Link
          href="/dashboard/history"
          className="relative p-2 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors"
          title="Audit History & System Events"
          aria-label="View Audit History"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </Link>

        {/* Primary CTA */}
        {pathname !== '/dashboard/analyze' && (
          <Link href="/dashboard/analyze">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">Analyze</span>
            </Button>
          </Link>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-brand-border py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-brand-border/60">
                <p className="text-xs font-semibold text-brand-text-primary truncate">{user?.fullName || 'Analyst'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'analyst@trinance.io'}</p>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings & API Keys
              </Link>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
