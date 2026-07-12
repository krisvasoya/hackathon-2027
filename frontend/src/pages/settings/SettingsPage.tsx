/**
 * Settings Page — TransitOps Enterprise
 * Fully localized for Indian fleet operations.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Bell,
  Globe,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, Button, Input, Badge } from '../../components/ui';
import { getInitials } from '../../utils';

export default function SettingsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    emailNotifications: true,
    smsAlerts: false,
    criticalAlertsOnly: false,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Profile settings updated successfully.');
    }, 800);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 800);
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Preferences saved successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Configure operational preferences, notification rules, and security profiles</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Security & Credentials
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Regional & Alerts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'profile' && (
            <Card>
              <CardBody className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
                  <UserIcon size={16} className="text-brand" /> Personal Information
                </h3>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                      disabled
                    />
                    <Input
                      label="Contact Number"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Department"
                      value={profileForm.department}
                      disabled
                    />
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-text-secondary uppercase">Role Privilege</label>
                      <div className="mt-1">
                        <Badge variant="danger">{user?.role.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="primary" type="submit" isLoading={isSaving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardBody className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
                  <Lock size={16} className="text-brand" /> Password & Authentication
                </h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="primary" type="submit" isLoading={isSaving}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardBody className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
                  <Globe size={16} className="text-brand" /> Regional Preferences
                </h3>
                <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-text-secondary uppercase">Operational Timezone</label>
                      <select
                        value={preferences.timezone}
                        disabled
                        className="w-full h-9 px-3 border border-border rounded bg-surface text-sm focus:outline-none"
                      >
                        <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-text-secondary uppercase">Platform Currency</label>
                      <select
                        value={preferences.currency}
                        disabled
                        className="w-full h-9 px-3 border border-border rounded bg-surface text-sm focus:outline-none"
                      >
                        <option value="INR (₹)">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-text-secondary uppercase">Date Pattern</label>
                      <select
                        value={preferences.dateFormat}
                        disabled
                        className="w-full h-9 px-3 border border-border rounded bg-surface text-sm focus:outline-none"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-text-secondary uppercase">Time Interval Pattern</label>
                      <select
                        value={preferences.timeFormat}
                        disabled
                        className="w-full h-9 px-3 border border-border rounded bg-surface text-sm focus:outline-none"
                      >
                        <option value="24-hour">24-hour format</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3 pt-4">
                    <Bell size={16} className="text-brand" /> Notifications & Dispatch Alerts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-primary">Email Notifications</p>
                        <p className="text-3xs text-text-secondary">Send automated dispatch summaries and daily operational report link alerts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                        className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-primary">SMS & Toll Alerts</p>
                        <p className="text-3xs text-text-secondary">Send instant warning notifications for FASTag balances and toll entries to active dispatchers</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.smsAlerts}
                        onChange={(e) => setPreferences({ ...preferences, smsAlerts: e.target.checked })}
                        className="h-4 w-4 text-brand focus:ring-brand border-border rounded"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="primary" type="submit" isLoading={isSaving}>
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-4">
          <Card className="bg-surface">
            <CardBody className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center border border-brand/20">
                  <span className="text-sm font-semibold text-brand">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{user ? `${user.firstName} ${user.lastName}` : 'User Profile'}</h4>
                  <Badge variant="danger" className="mt-1">{user?.role.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="space-y-2.5 text-3xs text-text-secondary">
                <div>
                  <span className="font-bold text-text-primary block uppercase">Employee ID</span>
                  {user?.employeeId || '—'}
                </div>
                <div>
                  <span className="font-bold text-text-primary block uppercase">Department</span>
                  {user?.department || '—'}
                </div>
                <div>
                  <span className="font-bold text-text-primary block uppercase">Current Privilege Scope</span>
                  All write actions are audited.
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
