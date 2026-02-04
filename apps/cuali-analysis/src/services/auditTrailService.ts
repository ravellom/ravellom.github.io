import { db } from './database'
import type { AuditEvent } from '../types'

/**
 * Audit Trail Service
 * 
 * Automatically logs all critical operations for methodological transparency
 * and reproducibility. Essential for qualitative research rigor.
 */
export const auditTrailService = {
  /**
   * Log an audit event
   */
  async log(
    projectId: string,
    type: AuditEvent['type'],
    payload: any,
    description: string
  ): Promise<void> {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type,
      payload,
      timestamp: new Date(),
      description
    }

    await db.auditEvents.add(event)
  },

  /**
   * Get all events for a project
   */
  async getByProject(projectId: string): Promise<AuditEvent[]> {
    return await db.auditEvents
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('timestamp')
  },

  /**
   * Get events by type
   */
  async getByType(
    projectId: string,
    type: AuditEvent['type']
  ): Promise<AuditEvent[]> {
    return await db.auditEvents
      .where(['projectId', 'type'])
      .equals([projectId, type])
      .reverse()
      .sortBy('timestamp')
  },

  /**
   * Export audit trail as CSV
   */
  async exportToCSV(projectId: string): Promise<string> {
    const events = await this.getByProject(projectId)
    
    const headers = ['Timestamp', 'Type', 'Description', 'Payload']
    const rows = events.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.description,
      JSON.stringify(event.payload)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  },

  /**
   * Clear old events (optional cleanup)
   */
  async clearOlderThan(projectId: string, daysOld: number): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const oldEvents = await db.auditEvents
      .where('projectId')
      .equals(projectId)
      .and(event => event.timestamp < cutoffDate)
      .toArray()

    await db.auditEvents.bulkDelete(oldEvents.map(e => e.id))
  }
}
