/**
 * Integration Hub Component
 * GitHub/THM/Coursera OAuth status and connections
 */

'use client';

import { motion } from 'framer-motion';
import { Github, ExternalLink, BookOpen, Link2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

interface IntegrationHubProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function IntegrationHub({ settings, updateSettings, userId }: IntegrationHubProps) {

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Auto-import repositories as portfolio items',
      status: settings.integrations?.github || 'disconnected',
      connectUrl: '/api/auth/github',
    },
    {
      id: 'thm',
      name: 'TryHackMe',
      icon: ExternalLink,
      description: 'Import completed rooms and achievements',
      status: settings.integrations?.thm || 'disconnected',
      connectUrl: '/api/auth/tryhackme',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Link2,
      description: 'Connect profile for completeness',
      status: settings.integrations?.linkedin || 'disconnected',
      connectUrl: '/api/auth/linkedin',
    },
  ];

  const handleConnect = (integrationId: string, connectUrl: string) => {
    window.location.href = connectUrl;
  };

  const handleDisconnect = (integrationId: string) => {
    updateSettings({
      integrations: {
        ...settings.integrations,
        [integrationId]: 'disconnected',
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link2 className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Integrations</h2>
              <p className="text-xs text-slate-500 mt-1">
                Connect external platforms to auto-import portfolio items
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = integration.status === 'connected';

              return (
                <div
                  key={integration.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isConnected
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Icon className={`w-6 h-6 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-200">{integration.name}</span>
                          {isConnected ? (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{integration.description}</p>
                      </div>
                    </div>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="defender"
                        size="sm"
                        onClick={() => handleConnect(integration.id, integration.connectUrl)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <p className="text-xs text-slate-400">
              <strong className="text-indigo-300">How it works:</strong> Connected integrations automatically create portfolio items when you complete missions, push code, or earn certifications. Items are created as drafts and can be reviewed before publishing.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

