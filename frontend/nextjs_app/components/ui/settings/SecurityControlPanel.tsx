/**
 * Security Control Panel Component
 * Password change, 2FA, active sessions management
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Smartphone, Monitor, MapPin, Clock, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function SecurityControlPanel() {
  const { settings, updateSettings } = useSettingsMaster();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [activeSessions, setActiveSessions] = useState(settings?.activeSessions || []);

  if (!settings) return null;

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      alert('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
      setIsChangingPassword(false);
    } catch (error: any) {
      console.error('Password change failed:', error);
      alert(`Failed to update password: ${error.message}`);
    }
  };

  const handleToggle2FA = async () => {
    // TODO: Implement 2FA setup/disable flow
    updateSettings({ twoFactorEnabled: !settings.twoFactorEnabled });
  };

  const handleRevokeSession = async (sessionId: string) => {
    // TODO: Implement session revocation
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Password Change */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Password & Security</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your account password and authentication
              </p>
            </div>
          </div>

          {!isChangingPassword ? (
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="defender"
                  onClick={handlePasswordChange}
                  disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                >
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.twoFactorEnabled ? (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-300">
                2FA is enabled. You'll be asked for a verification code when signing in from new devices.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                2FA is disabled. Enable it to protect your account from unauthorized access.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-8 h-8 text-indigo-400" />
            <div>
              <h3 className="text-xl font-bold text-slate-100">Active Sessions</h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage devices where you're currently signed in
              </p>
            </div>
          </div>

          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <Monitor className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{session.device}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No active sessions found</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

