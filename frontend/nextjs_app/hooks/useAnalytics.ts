/**
 * Hook for fetching analytics and audit log data
 */

'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/services/djangoClient';

export interface AnalyticsData {
  successRate: number;
  failureRate: number;
  totalActions: number;
  successActions: number;
  failureActions: number;
  heatmapData: Array<{ day: string; hour: number; value: number }>;
  systemMetrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeUsers: number;
  };
}

export function useAnalytics(params?: {
  start_date?: string;
  end_date?: string;
  range?: 'today' | 'week' | 'month' | 'year';
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        
        // Fetch audit stats
        const stats = await djangoClient.audit.getAuditStats();
        
        // Fetch audit logs for heatmap
        const auditParams: any = {};
        if (params?.range) {
          auditParams.range = params.range;
        }
        if (params?.start_date) {
          auditParams.start_date = params.start_date;
        }
        if (params?.end_date) {
          auditParams.end_date = params.end_date;
        }
        
        const logs = await djangoClient.audit.listAuditLogs(auditParams);
        
        // Calculate success/failure rates
        const total = stats.total || 1;
        const success = stats.success || 0;
        const failure = stats.failure || 0;
        const successRate = (success / total) * 100;
        const failureRate = (failure / total) * 100;
        
        // Generate heatmap data from audit logs
        const heatmapData = generateHeatmapData(logs);
        
        // System metrics (placeholder - would come from monitoring system)
        const systemMetrics = {
          uptime: 99.9,
          responseTime: 120,
          errorRate: failureRate,
          activeUsers: logs.length > 0 ? new Set(logs.map((log: any) => log.actor_identifier)).size : 0,
        };
        
        setData({
          successRate: Math.round(successRate * 10) / 10,
          failureRate: Math.round(failureRate * 10) / 10,
          totalActions: total,
          successActions: success,
          failureActions: failure,
          heatmapData,
          systemMetrics,
        });
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [params?.start_date, params?.end_date, params?.range]);

  return { data, isLoading, error };
}

/**
 * Generate heatmap data from audit logs
 */
function generateHeatmapData(logs: any[]): Array<{ day: string; hour: number; value: number }> {
  const heatmap: Record<string, number> = {};
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Initialize all slots
  days.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      heatmap[`${day}-${hour}`] = 0;
    }
  });
  
  // Count actions per day/hour
  logs.forEach((log: any) => {
    if (log.timestamp) {
      const date = new Date(log.timestamp);
      const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Convert to Mon-Sun
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    }
  });
  
  // Convert to array format
  const maxValue = Math.max(...Object.values(heatmap));
  return Object.entries(heatmap).map(([key, value]) => {
    const [day, hour] = key.split('-');
    return {
      day,
      hour: parseInt(hour),
      value: maxValue > 0 ? Math.round((value / maxValue) * 100) : 0,
    };
  });
}

