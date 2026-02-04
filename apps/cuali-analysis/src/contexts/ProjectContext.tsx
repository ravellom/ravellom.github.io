import React, { createContext, useContext, useState } from 'react'
import type { Project, Document, Code, Citation, ViewMode, Selection } from '../types'
import { db, projectService, documentService, codeService, citationService } from '../services/database'
import { auditTrailService } from '../services/auditTrailService'

interface ProjectContextType {
  currentProject: Project | null
  currentDocument: Document | null
  documents: Document[]
  codes: Code[]
  citations: Citation[]
  selection: Selection | null
  viewMode: ViewMode
  
  // Project operations
  loadProject: (id: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<void>
  updateProject: (updates: Partial<Project>) => Promise<void>
  closeProject: () => void
  
  // Document operations
  createDocument: (name: string, content: string) => Promise<void>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  selectDocument: (id: string) => void
  
  // Code operations
  createCode: (name: string, color: string, description?: string) => Promise<void>
  updateCode: (id: string, updates: Partial<Code>) => Promise<void>
  deleteCode: (id: string) => Promise<void>
  
  // Citation operations
  createCitation: (codeIds: string[], memo?: string) => Promise<void>
  updateCitation: (id: string, updates: Partial<Citation>) => Promise<void>
  deleteCitation: (id: string) => Promise<void>
  
  // UI state
  setSelection: (selection: Selection | null) => void
  setViewMode: (mode: ViewMode) => void
  
  // Import/Export
  exportProject: () => Promise<string>
  importProject: (jsonData: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('documents')

  // Load project data
  const loadProject = async (id: string) => {
    const project = await projectService.getById(id)
    if (!project) throw new Error('Project not found')
    
    setCurrentProject(project)
    
    // Load documents and codes
    const docs = await db.documents.where('projectId').equals(id).toArray()
    const cds = await db.codes.where('projectId').equals(id).toArray()
    setDocuments(docs)
    setCodes(cds)
    
    // Load citations for all documents
    const allCitations: Citation[] = []
    for (const doc of docs) {
      const docCitations = await citationService.getByDocument(doc.id)
      allCitations.push(...docCitations)
    }
    setCitations(allCitations)
  }

  const createProject = async (name: string, description?: string) => {
    const id = await projectService.create({
      name,
      description,
      documentIds: [],
      codeIds: [],
      settings: {
        preprocessing: {
          lowercase: true,
          removeNumbers: false,
          removeStopwords: true,
          customStopwords: [],
          stemming: false,
          lemmatization: true,
          minWordLength: 2,
          maxWordLength: 50,
          nGrams: [1, 2]
        },
        nlp: {
          enableLDA: true,
          ldaTopics: 5,
          enableClustering: true,
          clusterCount: 3,
          enableSentiment: true,
          enableNER: true
        },
        visualization: {
          defaultView: 'wordcloud',
          colorScheme: 'default'
        }
      }
    })
    await loadProject(id)
  }

  const updateProject = async (updates: Partial<Project>) => {
    if (!currentProject) return
    await projectService.update(currentProject.id, updates)
    setCurrentProject({ ...currentProject, ...updates })
  }

  const closeProject = () => {
    setCurrentProject(null)
    setCurrentDocument(null)
    setDocuments([])
    setCodes([])
    setCitations([])
    setSelection(null)
  }

  const createDocument = async (name: string, content: string) => {
    if (!currentProject) return
    
    const id = await documentService.create({ 
      projectId: currentProject.id,
      name, 
      content 
    })
    const newDoc = await documentService.getById(id)
    
    if (newDoc) {
      const updatedDocs = [...documents, newDoc]
      setDocuments(updatedDocs)
      await updateProject({ documentIds: updatedDocs.map((d: Document) => d.id) })
    }
  }

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    await documentService.update(id, updates)
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, ...updates } : d))
    if (currentDocument?.id === id) {
      setCurrentDocument({ ...currentDocument, ...updates })
    }
  }

  const deleteDocument = async (id: string) => {
    await documentService.delete(id)
    const updatedDocs = documents.filter(d => d.id !== id)
    setDocuments(updatedDocs)
    if (currentDocument?.id === id) {
      setCurrentDocument(null)
    }
    if (currentProject) {
      await updateProject({ documentIds: updatedDocs.map(d => d.id) })
    }
  }

  const selectDocument = (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      setCurrentDocument(doc)
      setViewMode('coding')
    }
  }

  const createCode = async (name: string, color: string, description?: string) => {
    if (!currentProject) return
    
    const id = await codeService.create({ 
      projectId: currentProject.id,
      name, 
      color, 
      description,
      updatedAt: new Date()
    })
    const newCode: Code = {
      id,
      projectId: currentProject.id,
      name,
      color,
      description,
      count: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const updatedCodes = [...codes, newCode]
    setCodes(updatedCodes)
    await updateProject({ codeIds: updatedCodes.map(c => c.id) })
    
    // Audit trail
    await auditTrailService.log(
      currentProject.id,
      'CREATE_CODE',
      { codeId: id, name, color },
      `Created code "${name}"`
    )
  }

  const updateCode = async (id: string, updates: Partial<Code>) => {
    await codeService.update(id, updates)
    setCodes(codes => codes.map(c => c.id === id ? { ...c, ...updates } : c))
    if (currentProject) {
      await updateProject({ codeIds: codes.map(c => c.id) })
    }
  }

  const deleteCode = async (id: string) => {
    if (!currentProject) return
    
    const code = codes.find(c => c.id === id)
    await codeService.delete(id)
    const updatedCodes = codes.filter(c => c.id !== id)
    setCodes(updatedCodes)
    await updateProject({ codeIds: updatedCodes.map(c => c.id) })
    
    // Audit trail
    if (code) {
      await auditTrailService.log(
        currentProject.id,
        'DELETE_CODE',
        { codeId: id, name: code.name },
        `Deleted code "${code.name}"`
      )
    }
  }

  const createCitation = async (codeIds: string[], memo?: string) => {
    if (!currentDocument || !selection || !memo || memo.trim().length < 10) return
    
    const id = await citationService.create({
      documentId: currentDocument.id,
      codeIds,
      startIndex: selection.startIndex,
      endIndex: selection.endIndex,
      text: selection.text,
      memo: memo.trim(),
      updatedAt: new Date()
    })
    
    const newCitation: Citation = {
      id,
      documentId: currentDocument.id,
      codeIds,
      startIndex: selection.startIndex,
      endIndex: selection.endIndex,
      text: selection.text,
      memo: memo.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setCitations([...citations, newCitation])
    setSelection(null)
    
    // Update code counts
    for (const codeId of codeIds) {
      await codeService.updateCount(codeId)
    }
    
    // Reload codes to update counts
    if (currentProject) {
      const updatedCodes = await db.codes.where('projectId').equals(currentProject.id).toArray()
      setCodes(updatedCodes)
      
      // Audit trail
      const codeNames = codeIds.map(cid => codes.find(c => c.id === cid)?.name).filter(Boolean).join(', ')
      await auditTrailService.log(
        currentProject.id,
        'ADD_CITATION',
        { citationId: id, documentId: currentDocument.id, codeIds, textLength: selection.text.length },
        `Added citation with codes: ${codeNames}`
      )
    }
  }

  const updateCitation = async (id: string, updates: Partial<Citation>) => {
    if (!currentProject) return
    
    await citationService.update(id, { ...updates, updatedAt: new Date() })
    setCitations(citations => citations.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c))
    
    // Audit trail
    if (updates.memo !== undefined) {
      await auditTrailService.log(
        currentProject.id,
        'EDIT_MEMO',
        { citationId: id, memoLength: updates.memo?.length },
        `Edited memo for citation`
      )
    }
  }

  const deleteCitation = async (id: string) => {
    if (!currentProject) return
    
    const citation = citations.find(c => c.id === id)
    await citationService.delete(id)
    setCitations(citations => citations.filter(c => c.id !== id))
    
    // Update code counts
    if (citation) {
      for (const codeId of citation.codeIds) {
        await codeService.updateCount(codeId)
      }
      
      // Audit trail
      const codeNames = citation.codeIds.map(cid => codes.find(c => c.id === cid)?.name).filter(Boolean).join(', ')
      await auditTrailService.log(
        currentProject.id,
        'DELETE_CITATION',
        { citationId: id, codeIds: citation.codeIds },
        `Deleted citation for codes: ${codeNames}`
      )
    }
    
    // Reload codes to update counts
    const updatedCodes = await db.codes.where('projectId').equals(currentProject.id).toArray()
    setCodes(updatedCodes)
  }

  const exportProject = async (): Promise<string> => {
    if (!currentProject) throw new Error('No project loaded')
    return await projectService.exportProject(currentProject.id)
  }

  const importProject = async (jsonData: string) => {
    const id = await projectService.importProject(jsonData)
    await loadProject(id)
  }

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        currentDocument,
        documents,
        codes,
        citations,
        selection,
        viewMode,
        loadProject,
        createProject,
        updateProject,
        closeProject,
        createDocument,
        updateDocument,
        deleteDocument,
        selectDocument,
        createCode,
        updateCode,
        deleteCode,
        createCitation,
        updateCitation,
        deleteCitation,
        setSelection,
        setViewMode,
        exportProject,
        importProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
