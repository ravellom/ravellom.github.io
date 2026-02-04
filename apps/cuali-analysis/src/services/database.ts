import Dexie, { Table } from 'dexie'
import type { Project, Document, Code, Citation, Category, AuditEvent, DiaryEntry } from '../types'

/**
 * IndexedDB database for offline persistence
 * Enhanced for methodological rigor and reproducibility
 */
export class QualitativeDB extends Dexie {
  projects!: Table<Project>
  documents!: Table<Document>
  codes!: Table<Code>
  citations!: Table<Citation>
  categories!: Table<Category>
  auditEvents!: Table<AuditEvent>
  diaryEntries!: Table<DiaryEntry>

  constructor() {
    super('QualitativeAnalysisDB')
    
    // Version 2: Add categories, audit trail, and diary
    this.version(2).stores({
      projects: 'id, name, createdAt, updatedAt',
      documents: 'id, projectId, name, createdAt, updatedAt',
      codes: 'id, projectId, name, categoryId, parentId',
      citations: 'id, documentId, *codeIds, createdAt, updatedAt',
      categories: 'id, projectId, name, createdAt',
      auditEvents: 'id, projectId, type, timestamp',
      diaryEntries: 'id, projectId, timestamp'
    }).upgrade(tx => {
      // Migration: add updatedAt to existing citations
      return tx.table('citations').toCollection().modify(citation => {
        if (!citation.updatedAt) {
          citation.updatedAt = citation.createdAt
        }
        if (!citation.memo) {
          citation.memo = '' // Set empty string for existing citations
        }
      })
    })
    
    // Keep version 1 for backward compatibility
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      documents: 'id, projectId, name, createdAt, updatedAt',
      codes: 'id, projectId, name, parentId',
      citations: 'id, documentId, *codeIds, createdAt'
    })
  }
}

export const db = new QualitativeDB()

/**
 * Project operations
 */
export const projectService = {
  async getAll(): Promise<Project[]> {
    return await db.projects.toArray()
  },

  async getById(id: string): Promise<Project | undefined> {
    return await db.projects.get(id)
  },

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.projects.add(newProject)
    return newProject.id
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.projects.delete(id)
  },

  async exportProject(id: string): Promise<string> {
    const project = await db.projects.get(id)
    if (!project) throw new Error('Project not found')
    
    const documents = await db.documents.where('projectId').equals(id).toArray()
    const codes = await db.codes.where('projectId').equals(id).toArray()
    const citations = await db.citations.where('documentId').anyOf(documents.map((d: Document) => d.id)).toArray()
    const categories = await db.categories.where('projectId').equals(id).toArray()
    const auditEvents = await db.auditEvents.where('projectId').equals(id).toArray()
    const diaryEntries = await db.diaryEntries.where('projectId').equals(id).toArray()

    const exportData = {
      project,
      documents,
      codes,
      citations,
      categories,
      auditEvents,
      diaryEntries,
      exportedAt: new Date().toISOString(),
      version: 2 // Schema version for import validation
    }

    return JSON.stringify(exportData, null, 2)
  },

  async importProject(jsonData: string): Promise<string> {
    const data = JSON.parse(jsonData)
    const newProjectId = crypto.randomUUID()

    // Create new project with updated ID
    const project: Project = {
      ...data.project,
      id: newProjectId,
      createdAt: new Date(data.project.createdAt),
      updatedAt: new Date(),
    }

    await db.projects.add(project)

    // Import documents, codes, and citations
    if (data.documents) {
      await db.documents.bulkAdd(data.documents.map((d: Document) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      })))
    }

    if (data.codes) {
      await db.codes.bulkAdd(data.codes.map((c: Code) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })))
    }

    if (data.citations) {
      await db.citations.bulkAdd(data.citations.map((c: Citation) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })))
    }

    return newProjectId
  },
}

/**
 * Document operations
 */
export const documentService = {
  async create(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.documents.add(newDoc)
    return newDoc.id
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    await db.documents.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.documents.delete(id)
    // Also delete related citations
    await db.citations.where('documentId').equals(id).delete()
  },

  async getById(id: string): Promise<Document | undefined> {
    return await db.documents.get(id)
  },
}

/**
 * Code operations
 */
export const codeService = {
  async create(code: Omit<Code, 'id' | 'createdAt' | 'count'>): Promise<string> {
    const newCode: Code = {
      ...code,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      count: 0,
    }
    await db.codes.add(newCode)
    return newCode.id
  },

  async update(id: string, updates: Partial<Code>): Promise<void> {
    await db.codes.update(id, updates)
  },

  async delete(id: string): Promise<void> {
    await db.codes.delete(id)
    // Update citations that reference this code
    const citations = await db.citations.where('codeIds').equals(id).toArray()
    for (const citation of citations) {
      const newCodeIds = citation.codeIds.filter((cid: string) => cid !== id)
      if (newCodeIds.length > 0) {
        await db.citations.update(citation.id, { codeIds: newCodeIds })
      } else {
        await db.citations.delete(citation.id)
      }
    }
  },

  async updateCount(id: string): Promise<void> {
    const count = await db.citations.where('codeIds').equals(id).count()
    await db.codes.update(id, { count })
  },
}

/**
 * Citation operations
 */
export const citationService = {
  async create(citation: Omit<Citation, 'id' | 'createdAt'>): Promise<string> {
    const newCitation: Citation = {
      ...citation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    await db.citations.add(newCitation)
    
    // Update code counts
    for (const codeId of citation.codeIds) {
      await codeService.updateCount(codeId)
    }
    
    return newCitation.id
  },

  async update(id: string, updates: Partial<Citation>): Promise<void> {
    const oldCitation = await db.citations.get(id)
    await db.citations.update(id, updates)
    
    // Update code counts if codeIds changed
    if (updates.codeIds && oldCitation) {
      const oldCodes = new Set(oldCitation.codeIds)
      const newCodes = new Set(updates.codeIds)
      
      const affected = new Set([...oldCodes, ...newCodes])
      for (const codeId of affected) {
        if (typeof codeId === 'string') {
          await codeService.updateCount(codeId)
        }
      }
    }
  },

  async delete(id: string): Promise<void> {
    const citation = await db.citations.get(id)
    await db.citations.delete(id)
    
    // Update code counts
    if (citation) {
      for (const codeId of citation.codeIds) {
        await codeService.updateCount(codeId)
      }
    }
  },

  async getByDocument(documentId: string): Promise<Citation[]> {
    return await db.citations.where('documentId').equals(documentId).toArray()
  },

  async getByCode(codeId: string): Promise<Citation[]> {
    return await db.citations.where('codeIds').equals(codeId).toArray()
  },
}

/**
 * Category operations for hierarchical code organization
 */
export const categoryService = {
  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const category: Category = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db.categories.add(category)
    return id
  },

  async update(id: string, updates: Partial<Category>): Promise<void> {
    await db.categories.update(id, { ...updates, updatedAt: new Date() })
  },

  async delete(id: string): Promise<void> {
    // Remove category reference from codes
    const codes = await db.codes.where('categoryId').equals(id).toArray()
    for (const code of codes) {
      await db.codes.update(code.id, { categoryId: undefined })
    }
    await db.categories.delete(id)
  },

  async getById(id: string): Promise<Category | undefined> {
    return await db.categories.get(id)
  },

  async getByProject(projectId: string): Promise<Category[]> {
    return await db.categories.where('projectId').equals(projectId).toArray()
  },

  async addCode(categoryId: string, codeId: string): Promise<void> {
    const category = await db.categories.get(categoryId)
    if (!category) throw new Error('Category not found')
    
    if (!category.codeIds.includes(codeId)) {
      category.codeIds.push(codeId)
      await db.categories.update(categoryId, { 
        codeIds: category.codeIds,
        updatedAt: new Date()
      })
      await db.codes.update(codeId, { categoryId })
    }
  },

  async removeCode(categoryId: string, codeId: string): Promise<void> {
    const category = await db.categories.get(categoryId)
    if (!category) return
    
    category.codeIds = category.codeIds.filter(id => id !== codeId)
    await db.categories.update(categoryId, { 
      codeIds: category.codeIds,
      updatedAt: new Date()
    })
    await db.codes.update(codeId, { categoryId: undefined })
  }
}

