import { db } from './database'
import type { DiaryEntry } from '../types'

/**
 * Research Diary Service
 * 
 * Maintains reflexive notes and methodological decisions throughout
 * the research process. Critical for audit trails and transparency.
 */
export const diaryService = {
  /**
   * Create a new diary entry
   */
  async create(projectId: string, text: string): Promise<string> {
    const entry: DiaryEntry = {
      id: `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      text,
      timestamp: new Date()
    }

    await db.diaryEntries.add(entry)
    return entry.id
  },

  /**
   * Update an existing entry
   */
  async update(id: string, text: string): Promise<void> {
    await db.diaryEntries.update(id, { text })
  },

  /**
   * Delete an entry
   */
  async delete(id: string): Promise<void> {
    await db.diaryEntries.delete(id)
  },

  /**
   * Get all entries for a project
   */
  async getByProject(projectId: string): Promise<DiaryEntry[]> {
    return await db.diaryEntries
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('timestamp')
  },

  /**
   * Search entries
   */
  async search(projectId: string, query: string): Promise<DiaryEntry[]> {
    const allEntries = await this.getByProject(projectId)
    const lowerQuery = query.toLowerCase()
    
    return allEntries.filter(entry => 
      entry.text.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Export all entries as markdown
   */
  async exportToMarkdown(projectId: string): Promise<string> {
    const entries = await this.getByProject(projectId)
    
    const markdown = entries.map(entry => {
      const date = new Date(entry.timestamp).toLocaleString()
      return `## ${date}\n\n${entry.text}\n`
    }).join('\n---\n\n')

    return `# Research Diary\n\n${markdown}`
  }
}
