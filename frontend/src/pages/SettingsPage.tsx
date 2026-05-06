import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Lock, Bell, Shield,
  Save, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

type Section = 'profile' | 'security' | 'notifications';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('profile');

  // Profile form
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [oldPw, setOldPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Notification prefs (local only — no backend yet)
  const [notifs, setNotifs] = useState({
    statusUpdates:  true,
    disputes:       true,
    newReports:     false,
    weeklyDigest:   false,
  });

  const saveProfile = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty.'); return; }
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { username: displayName.trim() });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) { toast.error('Fill in all password fields.'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match.'); return; }
    if (newPw.length < 8)   { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await api.patch('/auth/change-password', { oldPassword: oldPw, newPassword: newPw });
      toast.success('Password changed!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile',       label: 'Profile',        icon: User  },
    { id: 'security',      label: 'Security',       icon: Lock  },
    { id: 'notifications', label: 'Notifications',  icon: Bell  },
  ];

  return (
    <div className="min-h-screen bg-grid noise pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-amber/20 border border-amber/30 flex items-center justify-center">
            <Settings size={18} className="text-amber" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-wide">Settings</h1>
            <p className="text-gray-500 text-xs">Manage your account and preferences</p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-4 gap-5">

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="sm:col-span-1"
          >
            <div className="cs-card p-2 space-y-0.5">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    section === s.id
                      ? 'bg-amber/10 text-amber border border-amber/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <s.icon size={15} />
                  <span className="font-display uppercase tracking-wider text-xs">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Role badge */}
            <div className="cs-card p-4 mt-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-2">
                <Shield size={20} className="text-amber" />
              </div>
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
              <span className="text-xs px-2 py-0.5 bg-amber/10 border border-amber/20 text-amber rounded-full font-display uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="sm:col-span-3"
          >
            {/* ── Profile ── */}
            {section === 'profile' && (
              <div className="cs-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User size={16} className="text-amber" />
                  <h2 className="font-display text-base font-bold text-white uppercase tracking-wide">Profile Info</h2>
                </div>

                <div className="space-y-5">
                  {/* Avatar preview */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber/20 border-2 border-amber/30 flex items-center justify-center">
                      <span className="font-display text-2xl font-black text-amber">
                        {displayName.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{displayName || 'Your Name'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="cs-input w-full px-4 py-3 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      disabled
                      className="cs-input w-full px-4 py-3 rounded-xl text-sm opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-600 mt-1">Email cannot be changed after registration.</p>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
                  >
                    {savingProfile
                      ? <><div className="spinner w-4 h-4 border-2" /> Saving…</>
                      : <><Save size={14} /> Save Changes</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {section === 'security' && (
              <div className="cs-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Lock size={16} className="text-amber" />
                  <h2 className="font-display text-base font-bold text-white uppercase tracking-wide">Change Password</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Current Password',  val: oldPw,      set: setOldPw      },
                    { label: 'New Password',       val: newPw,      set: setNewPw      },
                    { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                        {f.label}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          placeholder="••••••••"
                          className="cs-input w-full px-4 py-3 pr-10 rounded-xl text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {newPw && confirmPw && (
                    <div className={`flex items-center gap-2 text-xs ${newPw === confirmPw ? 'text-green-400' : 'text-red-400'}`}>
                      <CheckCircle2 size={13} />
                      {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}

                  <button
                    onClick={savePassword}
                    disabled={savingPw}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
                  >
                    {savingPw
                      ? <><div className="spinner w-4 h-4 border-2" /> Updating…</>
                      : <><Lock size={14} /> Update Password</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {section === 'notifications' && (
              <div className="cs-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bell size={16} className="text-amber" />
                  <h2 className="font-display text-base font-bold text-white uppercase tracking-wide">Notification Preferences</h2>
                </div>

                <div className="space-y-3">
                  {(Object.keys(notifs) as (keyof typeof notifs)[]).map(key => {
                    const LABELS: Record<keyof typeof notifs, { label: string; desc: string }> = {
                      statusUpdates:  { label: 'Status Updates',  desc: 'Email when your report status changes' },
                      disputes:       { label: 'Dispute Alerts',  desc: 'Email when a dispute is filed on your report' },
                      newReports:     { label: 'Nearby Reports',  desc: 'Notify when new reports are filed near you' },
                      weeklyDigest:   { label: 'Weekly Digest',   desc: 'Weekly summary of activity in your area' },
                    };
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl border border-border"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{LABELS[key].label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{LABELS[key].desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                            notifs[key] ? 'bg-amber' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                              notifs[key] ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Email notifications are sent to <span className="text-gray-400">{user?.email}</span>.
                  Preferences are saved locally.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
