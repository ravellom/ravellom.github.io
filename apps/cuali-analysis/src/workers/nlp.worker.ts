/**
 * Web Worker for heavy NLP processing
 * This prevents blocking the main UI thread
 */

import { nlpService, preprocessingService } from '../services/nlp'
import type { PreprocessingConfig } from '../types'

interface WorkerMessage {
  type: 'preprocess' | 'frequencies' | 'tfidf' | 'topics' | 'sentiment' | 'entities' | 'cluster'
  payload: any
}

interface WorkerResponse {
  type: string
  result: any
  error?: string
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    let result: any

    switch (type) {
      case 'preprocess':
        result = preprocessingService.preprocess(
          payload.text,
          payload.config as PreprocessingConfig
        )
        break

      case 'frequencies':
        result = nlpService.calculateFrequencies(payload.tokens)
        break

      case 'tfidf':
        result = Array.from(nlpService.calculateTFIDF(payload.documents).entries())
        break

      case 'topics':
        result = nlpService.extractTopics(
          payload.documents,
          payload.numTopics,
          payload.numWords
        )
        break

      case 'sentiment':
        result = nlpService.analyzeSentiment(payload.text)
        break

      case 'entities':
        result = nlpService.extractEntities(payload.text)
        break

      case 'cluster':
        result = nlpService.clusterDocuments(
          payload.documents,
          payload.numClusters
        )
        break

      default:
        throw new Error(`Unknown worker message type: ${type}`)
    }

    const response: WorkerResponse = { type, result }
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    self.postMessage(response)
  }
}
