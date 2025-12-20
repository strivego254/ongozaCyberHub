/**
 * System Status Card Component
 * Impact visualization for settings changes
 */

'use client';

import { CheckCircle, AlertTriangle, Sparkles, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { SystemStatus } from '@/lib/settings/types';

interface SystemStatusCardProps {
  status: SystemStatus;
}

export function SystemStatusCard({ status }: SystemStatusCardProps) {
  const statusConfig = {
    healthy: { 
      color: 'emerald', 
      icon: CheckCircle,
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-400',
    },
    warning: { 
      color: 'amber', 
      icon: AlertTriangle,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-400',
    },
    upgrade: { 
      color: 'indigo', 
      icon: Sparkles,
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/50',
      textColor: 'text-indigo-400',
    },
    error: { 
      color: 'red', 
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-400',
    },
  }[status.status];

  const Icon = statusConfig.icon;

  return (
    <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor} hover:shadow-lg transition-all duration-300 group`}>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-3">
          <Icon className={`w-8 h-8 ${statusConfig.textColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-100 text-lg truncate group-hover:text-slate-200 transition-colors">
              {status.title}
            </h3>
            <p className="text-sm text-slate-400 truncate mt-1">{status.impact}</p>
          </div>
          <div className={`text-2xl font-bold ${statusConfig.textColor}`}>
            {typeof status.value === 'number' ? `${status.value}%` : status.value}
          </div>
        </div>
      </div>
    </Card>
  );
}

