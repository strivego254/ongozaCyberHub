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
  result?: 'success' | 'failure' | 'partial'
}

class AuditClient {
  /**
   * Get audit logs with optional filters
   * Handles both paginated and non-paginated responses
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
    if (filters?.result) {
      params.append('result', filters.result)
    }
    
    const queryString = params.toString()
    const url = queryString ? `/audit-logs/?${queryString}` : '/audit-logs/'
    
    const response = await apiGateway.get<any>(url)
    
    // Handle paginated response (DRF default pagination)
    if (response && typeof response === 'object' && 'results' in response) {
      return Array.isArray(response.results) ? response.results : []
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      return response
    }
    
    // Fallback to empty array
    return []
  }

  /**
   * Get director-specific actions (programs, cohorts, tracks)
   * Fetches logs for all director-related resource types and combines them
   */
  async getDirectorActions(filters?: Omit<AuditLogFilters, 'resource_type'> & { resource_type?: string }): Promise<AuditLog[]> {
    // Get actions for programs, cohorts, tracks, and related resources
    // If a specific resource_type is provided in filters, use only that; otherwise fetch all
    const resourceTypes = filters?.resource_type 
      ? [filters.resource_type]
      : ['program', 'cohort', 'track', 'milestone', 'module', 'enrollment', 'mentor_assignment', 'mission']
    
    const allLogs: AuditLog[] = []
    
    // Fetch logs for each resource type in parallel for better performance
    const fetchPromises = resourceTypes.map(async (resourceType) => {
      try {
        const logs = await this.getAuditLogs({
          ...filters,
          resource_type: resourceType,
        })
        return Array.isArray(logs) ? logs : []
      } catch (err) {
        console.error(`Failed to fetch ${resourceType} logs:`, err)
        return []
      }
    })
    
    // Wait for all requests to complete
    const results = await Promise.all(fetchPromises)
    
    // Flatten and combine all logs
    results.forEach(logs => {
      if (Array.isArray(logs)) {
        allLogs.push(...logs)
      }
    })
    
    // Sort by timestamp descending (most recent first)
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

