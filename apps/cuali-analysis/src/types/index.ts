/**
 * Core types for the qualitative analysis application
 */

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  documentIds: string[]
  codeIds: string[]
  settings: ProjectSettings
}

export interface Document {
  id: string
  projectId: string
  name: string
  content: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface Code {
  id: string
  projectId: string
  name: string
  color: string
  description?: string
  categoryId?: string // Hierarchical categorization
  count: number
  createdAt: Date
  updatedAt: Date
  parentId?: string
}

export interface Category {
  id: string
  projectId: string
  name: string
  description?: string
  codeIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AuditEvent {
  id: string
  projectId: string
  type: 'CREATE_CODE' | 'DELETE_CODE' | 'EDIT_CODE' | 'ADD_CITATION' | 'EDIT_CITATION' | 'DELETE_CITATION' | 'EDIT_MEMO' | 'CREATE_CATEGORY' | 'MERGE_CODES'
  payload: any
  timestamp: Date
  description: string
}

export interface DiaryEntry {
  id: string
  projectId: string
  text: string
  timestamp: Date
}

export interface Citation {
  id: string
  documentId: string
  codeIds: string[]
  startIndex: number
  endIndex: number
  text: string
  memo: string // REQUIRED - analytical justification
  createdAt: Date
  updatedAt: Date
}

export interface ProjectSettings {
  preprocessing: PreprocessingConfig
  nlp: NLPConfig
  visualization: VisualizationConfig
}

export interface PreprocessingConfig {
  lowercase: boolean
  removeNumbers: boolean
  removeStopwords: boolean
  customStopwords: string[]
  stemming: boolean
  lemmatization: boolean
  minWordLength: number
  maxWordLength: number
  nGrams: number[]
}

export interface NLPConfig {
  enableLDA: boolean
  ldaTopics: number
  enableClustering: boolean
  clusterCount: number
  enableSentiment: boolean
  enableNER: boolean
}

export interface VisualizationConfig {
  defaultView: 'wordcloud' | 'network' | 'timeline' | 'cluster'
  colorScheme: string
}

export interface WordFrequency {
  word: string
  count: number
  tfidf?: number
}

export interface Topic {
  id: number
  words: Array<{ word: string; weight: number }>
  documents: string[]
}

export interface CoOccurrence {
  code1: string
  code2: string
  count: number
}

export interface ClusterResult {
  clusterId: number
  documents: string[]
  keywords: string[]
}

export interface SentimentResult {
  documentId: string
  score: number
  label: 'positive' | 'negative' | 'neutral'
}

export interface Entity {
  text: string
  type: 'person' | 'organization' | 'location' | 'date' | 'other'
  count: number
}

export interface AnalysisResult {
  frequencies: WordFrequency[]
  topics?: Topic[]
  clusters?: ClusterResult[]
  sentiment?: SentimentResult[]
  entities?: Entity[]
  cooccurrence?: CoOccurrence[]
}

export type ViewMode = 'documents' | 'coding' | 'analysis' | 'visualization'

export interface Selection {
  documentId: string
  startIndex: number
  endIndex: number
  text: string
}
