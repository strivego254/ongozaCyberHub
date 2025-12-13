/**
 * Audit Log API Client
 * Handles audit log retrieval for director actions
 */

import { apiGateway } from './apiGateway'

export interface AuditLog {
  id: string
  actor_type: string
  actor_identifier: string
  action: 'create' | 'update' | 'delete' | 'read' | string
  resource_type: string
  resource_id: string | null
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  result: 'success' | 'failure' | 'partial'
  changes?: Record<string, { old: any; new: any }>
}

export interface AuditLogFilters {
  resource_type?: string
  action?: string
  range?: 'today' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
  actor?: string
}

class AuditClient {
  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const params = new URLSearchParams()
    
    if (filters?.resource_type) {
      params.append('resource_type', filters.resource_type)
    }
    if (filters?.action) {
      params.append('action', filters.action)
    }
    if (filters?.range) {
      params.append('range', filters.range)
    }
    if (filters?.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date)
    }
    if (filters?.actor) {
      params.append('actor', filters.actor)
    }
    
    const queryString = params.toString()
    const url = queryString ? `/audit-logs/?${queryString}` : '/audit-logs/'
    
    return apiGateway.get(url)
  }

  /**
   * Get director-specific actions (programs, cohorts, tracks)
   */
  async getDirectorActions(filters?: Omit<AuditLogFilters, 'resource_type'>): Promise<AuditLog[]> {
    // Get actions for programs, cohorts, tracks, and related resources
    const resourceTypes = ['program', 'cohort', 'track', 'milestone', 'module', 'enrollment', 'mentor_assignment']
    
    const allLogs: AuditLog[] = []
    
    // Fetch logs for each resource type
    for (const resourceType of resourceTypes) {
      try {
        const logs = await this.getAuditLogs({
          ...filters,
          resource_type: resourceType,
        })
        allLogs.push(...logs)
      } catch (err) {
        console.error(`Failed to fetch ${resourceType} logs:`, err)
      }
    }
    
    // Sort by timestamp descending
    return allLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(filters?: AuditLogFilters): Promise<{
    total: number
    success: number
    failure: number
    action_counts: Record<string, number>
  }> {
    const params = new URLSearchParams()
    
    if (filters?.resource_type) {
      params.append('resource_type', filters.resource_type)
    }
    if (filters?.action) {
      params.append('action', filters.action)
    }
    if (filters?.range) {
      params.append('range', filters.range)
    }
    
    const queryString = params.toString()
    const url = queryString ? `/audit-logs/stats/?${queryString}` : '/audit-logs/stats/'
    
    return apiGateway.get(url)
  }
}

export const auditClient = new AuditClient()

