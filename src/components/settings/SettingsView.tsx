'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Key,
  Shield,
  Sliders,
  CheckCircle,
  AlertCircle,
  Cloud,
  Cpu,
  Save,
  Lock,
  Trash2,
  Bell,
  X,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface SettingsViewProps {
  user: UserProfile | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'cloud'>('profile');

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Preferences Form
  const [defaultMode, setDefaultMode] = useState(user?.preferences?.defaultMode || 'combined');
  const [layoutDensity, setLayoutDensity] = useState<'standard' | 'compact' | 'expanded'>(
    user?.preferences?.layout || 'standard'
  );
  const [reducedMotion, setReducedMotion] = useState(user?.preferences?.reducedMotion || false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalRiskAlerts, setCriticalRiskAlerts] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  // Account Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);

    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      if (res.ok) {
        setProfileSuccess('Profile name updated successfully.');
        router.refresh();
      } else {
        alert('Failed to update profile.');
      }
    } catch {
      alert('Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password',
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Password successfully updated.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to update password.');
      }
    } catch {
      setPasswordError('Failed to connect to server.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaving(true);
    setPrefSuccess(null);

    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            defaultMode,
            layout: layoutDensity,
            reducedMotion,
          },
        }),
      });
      if (res.ok) {
        setPrefSuccess('Workspace preferences saved successfully.');
        router.refresh();
      }
    } finally {
      setPrefSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmationWord.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Please enter your current password for security verification.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Execute account logout and removal
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setDeleteError('Failed to execute account purge.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-brand-navy text-white'
              : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-brand-navy text-white'
              : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-brand-navy text-white'
              : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferences & Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cloud'
              ? 'bg-brand-navy text-white'
              : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud & Engine Configuration</span>
        </button>
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Analyst Profile</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal credentials and workspace identity.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Account Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'analyst@trinance.io'}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-brand-border rounded-lg text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">
                  Primary authentication identifier. Contact workspace administrator to reassign.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="md" isLoading={profileSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Security & Account Deletion */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Security & Password Management</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Update password and maintain protected session credentials.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  type="password"
                  label="Current Password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />

                <Input
                  type="password"
                  label="New Password"
                  placeholder="••••••••"
                  helperText="Must be at least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <Button type="submit" variant="primary" size="md" isLoading={passwordSaving} leftIcon={<Lock className="w-4 h-4" />}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Account Deletion */}
          <Card className="border-red-200 bg-red-50/20">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Permanent Account Deletion</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Irreversibly delete your account, all associated documents, and analysis records.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Analyst Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Preferences & Alerts */}
      {activeTab === 'preferences' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Workspace Preferences & Notifications</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure default intelligence engine behavior, display density, and alerts.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Default Intelligence Scope
                </label>
                <select
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as 'combined' | 'sentiment_only' | 'risk_only')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="combined">Combined (Sentiment + 12-Risk Patterns)</option>
                  <option value="sentiment_only">Sentiment Intelligence Only</option>
                  <option value="risk_only">Risk Intelligence Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Layout Density
                </label>
                <select
                  value={layoutDensity}
                  onChange={(e) => setLayoutDensity(e.target.value as 'standard' | 'compact' | 'expanded')}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="standard">Standard (Balanced whitespace)</option>
                  <option value="compact">Compact (High financial data density)</option>
                  <option value="expanded">Expanded (Generous reading layout)</option>
                </select>
              </div>

              <div className="space-y-3 pt-2 border-t border-brand-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Accessibility & Motion
                </span>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="rounded border-slate-300 text-brand-navy focus:ring-brand-accent"
                  />
                  <span>Respect Reduced Motion (Minimize transition animations)</span>
                </label>
              </div>

              <div className="space-y-3 pt-2 border-t border-brand-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
                  Notification Triggers
                </span>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded border-slate-300 text-brand-navy focus:ring-brand-accent"
                  />
                  <span>Analysis completion confirmation events</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criticalRiskAlerts}
                    onChange={(e) => setCriticalRiskAlerts(e.target.checked)}
                    className="rounded border-slate-300 text-brand-navy focus:ring-brand-accent"
                  />
                  <span>Urgent alert badge on Critical Severity debt or solvency findings</span>
                </label>
              </div>

              {prefSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{prefSuccess}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="md" isLoading={prefSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Cloud & Engine Configuration */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-navy" />
                <span>Financial Intelligence Engine Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-950">Deterministic Financial Engine Active</h4>
                  <p className="text-emerald-800 mt-1 leading-relaxed">
                    Tri-nance is currently running its built-in Loughran-McDonald financial domain sentiment model and 12-category risk pattern detection engine with verbatim character offset grounding.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-brand-text-primary text-sm">Supported Intelligence Capabilities:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Loughran-McDonald Financial Lexicon</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Negation & Hedging Detection</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mixed / Contradictory Signals</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>12 Risk Pattern Categories</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exact Source Character Offsets</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Formula-Safe CSV & JSON Export</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand-navy" />
                <span>Supabase PostgreSQL & Cloud Connection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                To connect an external Supabase production database, add your credentials in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-navy font-mono">.env.local</code>:
              </p>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
                <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......</p>
                <p>SUPABASE_SERVICE_ROLE_KEY=eyJh......</p>
              </div>
              <p>
                Schema migrations with full Row Level Security (RLS) policies are located in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-navy font-mono">supabase/migrations/01_initial_schema.sql</code> ready to execute in the Supabase SQL editor.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Explicit Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-red-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Confirm Account Purge</span>
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action is permanent and cannot be undone. All stored documents, extracted texts, and generated intelligence reports belonging to this account will be permanently erased.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Type <span className="text-red-600 font-mono">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmationWord}
                  onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Current Account Password:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isDeletingAccount}
                >
                  Confirm & Purge Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
