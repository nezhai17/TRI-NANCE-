'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  History,
  FolderArchive,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ShieldAlert,
  SearchCheck,
  Bot,
  TrendingUp,
  BarChart3,
  Network,
  Compass,
  FileText,
  AlertTriangle,
  FolderLock,
  Layers,
  Cpu,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { UserProfile } from '@/lib/types';

interface SidebarProps {
  user: UserProfile | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  category: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    badge?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, mobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navSections: NavSection[] = [
    {
      category: 'Core Workspaces',
      items: [
        {
          label: 'Overview',
          href: '/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/dashboard',
        },
        {
          label: 'Document Vault',
          href: '/dashboard/documents',
          icon: FolderArchive,
          active: pathname === '/dashboard/documents',
        },
        {
          label: 'Intelligence Engine',
          href: '/dashboard/analyze',
          icon: FilePlus,
          active: pathname === '/dashboard/analyze',
        },
        {
          label: 'AI Copilot',
          href: '/dashboard/copilot',
          icon: Bot,
          active: pathname === '/dashboard/copilot',
          badge: 'AI',
        },
      ],
    },
    {
      category: 'Analytics & Risk',
      items: [
        {
          label: 'Risk Center',
          href: '/dashboard/risk',
          icon: ShieldAlert,
          active: pathname === '/dashboard/risk',
        },
        {
          label: 'Sentiment',
          href: '/dashboard/sentiment',
          icon: TrendingUp,
          active: pathname === '/dashboard/sentiment',
        },
        {
          label: 'Financial Analytics',
          href: '/dashboard/analytics',
          icon: BarChart3,
          active: pathname === '/dashboard/analytics',
        },
        {
          label: 'Evidence Explorer',
          href: '/dashboard/evidence',
          icon: SearchCheck,
          active: pathname === '/dashboard/evidence',
        },
        {
          label: 'ML Operations',
          href: '/dashboard/ml',
          icon: Cpu,
          active: pathname === '/dashboard/ml',
          badge: 'ML',
        },
      ],
    },
    {
      category: 'Forensic & Reports',
      items: [
        {
          label: 'Investigations',
          href: '/dashboard/investigations',
          icon: Compass,
          active: pathname.startsWith('/dashboard/investigations'),
        },
        {
          label: 'Entity Explorer',
          href: '/dashboard/entities',
          icon: Network,
          active: pathname === '/dashboard/entities',
        },
        {
          label: 'Reports Hub',
          href: '/dashboard/reports',
          icon: FileText,
          active: pathname === '/dashboard/reports' || pathname.startsWith('/dashboard/reports/'),
        },
        {
          label: 'Audit History',
          href: '/dashboard/history',
          icon: History,
          active: pathname === '/dashboard/history',
        },
      ],
    },
    {
      category: 'System',
      items: [
        {
          label: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          active: pathname === '/dashboard/settings',
        },
      ],
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-brand-navy text-slate-200 select-none">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90"
        >
          <Logo size="md" showText={!collapsed} inverted />
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Links by Category */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto" aria-label="Main Navigation">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.category}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group ${
                    item.active
                      ? 'bg-brand-accent text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip on collapsed desktop view */}
                  {collapsed && (
                    <div className="fixed left-20 hidden md:group-hover:flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-lg border border-slate-700 pointer-events-none z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Profile & Actions */}
      <div className="p-3 border-t border-white/10 bg-black/15 shrink-0 space-y-2">
        <div
          className={`flex items-center gap-3 p-1.5 rounded-lg ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-brand-accent/30 border border-brand-accent/50 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Analyst'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'analyst@trinance.io'}</p>
            </div>
          )}
        </div>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-red-300 hover:bg-red-500/10 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 text-red-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Desktop Collapse/Expand Control */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-brand-border transition-all duration-300 sticky top-0 h-screen z-30 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
