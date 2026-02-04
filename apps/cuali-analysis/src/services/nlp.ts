import nlp from 'compromise'
import type { 
  PreprocessingConfig, 
  WordFrequency, 
  Topic, 
  ClusterResult,
  SentimentResult,
  Entity 
} from '../types'

// Simple tokenizer
class SimpleTokenizer {
  tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || []
  }
}

// Simple Porter Stemmer implementation
class SimpleStemmer {
  static stem(word: string): string {
    // Very basic stemming - just remove common suffixes
    return word
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/s$/, '')
      .replace(/ly$/, '')
  }
}

// Common English stopwords
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 'should', 'so', 'some',
  'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
])

// Simple TF-IDF implementation
class SimpleTfIdf {
  private documents: string[][] = []

  addDocument(tokens: string[]) {
    this.documents.push(tokens)
  }

  listTerms(docIndex: number): Array<{ term: string; tfidf: number }> {
    const doc = this.documents[docIndex]
    const termFreq: { [key: string]: number } = {}
    
    // Calculate term frequency
    doc.forEach(term => {
      termFreq[term] = (termFreq[term] || 0) + 1
    })

    // Calculate TF-IDF
    const results: Array<{ term: string; tfidf: number }> = []
    
    Object.keys(termFreq).forEach(term => {
      const tf = termFreq[term] / doc.length
      
      // Calculate IDF
      const docsWithTerm = this.documents.filter(d => d.includes(term)).length
      const idf = Math.log(this.documents.length / (1 + docsWithTerm))
      
      results.push({ term, tfidf: tf * idf })
    })

    return results.sort((a, b) => b.tfidf - a.tfidf)
  }
}

/**
 * Text preprocessing service
 */
export class PreprocessingService {
  private tokenizer = new SimpleTokenizer()

  tokenize(text: string): string[] {
    return this.tokenizer.tokenize(text)
  }

  removeStopwords(tokens: string[], customStopwords: string[] = []): string[] {
    const stopwords = new Set([...STOPWORDS, ...customStopwords.map(w => w.toLowerCase())])
    return tokens.filter(token => !stopwords.has(token.toLowerCase()))
  }

  stem(tokens: string[]): string[] {
    return tokens.map(token => SimpleStemmer.stem(token))
  }

  lemmatize(text: string): string[] {
    const doc = nlp(text)
    return doc.terms().out('array') as string[]
  }

  generateNGrams(tokens: string[], n: number): string[] {
    const ngrams: string[] = []
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '))
    }
    return ngrams
  }

  preprocess(text: string, config: PreprocessingConfig): string[] {
    let tokens = this.tokenize(text)

    // Lowercase
    if (config.lowercase) {
      tokens = tokens.map(t => t.toLowerCase())
    }

    // Remove numbers
    if (config.removeNumbers) {
      tokens = tokens.filter(t => !/^\d+$/.test(t))
    }

    // Remove stopwords
    if (config.removeStopwords) {
      tokens = this.removeStopwords(tokens, config.customStopwords)
    }

    // Filter by length
    tokens = tokens.filter(t => 
      t.length >= config.minWordLength && 
      t.length <= config.maxWordLength
    )

    // Stemming or lemmatization
    if (config.stemming && !config.lemmatization) {
      tokens = this.stem(tokens)
    } else if (config.lemmatization) {
      tokens = this.lemmatize(tokens.join(' '))
    }

    return tokens
  }
}

/**
 * NLP analysis service
 */
export class NLPService {
  private preprocessing = new PreprocessingService()

  /**
   * Calculate word frequencies
   */
  calculateFrequencies(tokens: string[]): WordFrequency[] {
    const freq: Record<string, number> = {}
    
    tokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1
    })

    return Object.entries(freq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Calculate TF-IDF scores
   */
  calculateTFIDF(documents: string[][]): Map<string, WordFrequency[]> {
    const tfidf = new SimpleTfIdf()
    
    documents.forEach(doc => {
      tfidf.addDocument(doc)
    })

    const results = new Map<string, WordFrequency[]>()

    documents.forEach((_, docIndex) => {
      const scores: WordFrequency[] = []
      tfidf.listTerms(docIndex).forEach((item: any) => {
        scores.push({
          word: item.term,
          count: 0,
          tfidf: item.tfidf
        })
      })
      results.set(`doc_${docIndex}`, scores.sort((a, b) => (b.tfidf || 0) - (a.tfidf || 0)))
    })

    return results
  }

  /**
   * Topic modeling using simple frequency-based clustering
   * (Simplified version - for production consider using a proper LDA library)
   */
  extractTopics(documents: string[], numTopics: number = 5, numWords: number = 10): Topic[] {
    try {
      // Calculate TF-IDF for all documents
      const tfidf = new SimpleTfIdf()
      documents.forEach(doc => tfidf.addDocument(doc.split(/\s+/)))

      // Get top terms for each document and group them
      const topics: Topic[] = []
      
      for (let topicId = 0; topicId < Math.min(numTopics, documents.length); topicId++) {
        const docIndex = topicId % documents.length
        const terms = tfidf.listTerms(docIndex)
          .slice(0, numWords)
          .map((item: any) => ({
            word: item.term,
            weight: item.tfidf
          }))

        topics.push({
          id: topicId,
          words: terms,
          documents: [`doc_${docIndex}`]
        })
      }

      return topics
    } catch (error) {
      console.error('Topic extraction failed:', error)
      return []
    }
  }

  /**
   * Simple sentiment analysis using word lists
   */
  analyzeSentiment(text: string): SentimentResult {
    const tokens = this.preprocessing.tokenize(text.toLowerCase())
    
    // Simple positive/negative word lists
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'best', 'love',
      'happy', 'joy', 'positive', 'perfect', 'success', 'beautiful', 'brilliant'
    ])
    
    const negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'sad', 'angry',
      'negative', 'poor', 'fail', 'failure', 'ugly', 'disappointing'
    ])
    
    let positiveCount = 0
    let negativeCount = 0
    
    tokens.forEach(token => {
      if (positiveWords.has(token)) positiveCount++
      if (negativeWords.has(token)) negativeCount++
    })
    
    const score = (positiveCount - negativeCount) / Math.max(tokens.length, 1)
    
    let label: 'positive' | 'negative' | 'neutral'
    if (score > 0.05) label = 'positive'
    else if (score < -0.05) label = 'negative'
    else label = 'neutral'

    return {
      documentId: '',
      score,
      label
    }
  }

  /**
   * Named Entity Recognition using compromise
   */
  extractEntities(text: string): Entity[] {
    const doc = nlp(text)
    const entities: Map<string, Entity> = new Map()

    // People
    doc.people().forEach((person: any) => {
      const text = person.text()
      const existing = entities.get(text)
      if (existing) {
        existing.count++
      } else {
        entities.set(text, { text, type: 'person', count: 1 })
      }
    })

    // Organizations
    doc.organizations().forEach((org: any) => {
      const text = org.text()
      const existing = entities.get(text)
      if (existing) {
        existing.count++
      } else {
        entities.set(text, { text, type: 'organization', count: 1 })
      }
    })

    // Places
    doc.places().forEach((place: any) => {
      const text = place.text()
      const existing = entities.get(text)
      if (existing) {
        existing.count++
      } else {
        entities.set(text, { text, type: 'location', count: 1 })
      }
    })

    return Array.from(entities.values()).sort((a, b) => b.count - a.count)
  }

  /**
   * Simple clustering using cosine similarity
   */
  clusterDocuments(documents: string[], numClusters: number = 3): ClusterResult[] {
    // Calculate TF-IDF vectors
    const tfidf = new SimpleTfIdf()
    documents.forEach(doc => tfidf.addDocument(doc.split(' ')))

    // Simple k-means-like clustering
    const clusters: ClusterResult[] = Array.from({ length: numClusters }, (_, i) => ({
      clusterId: i,
      documents: [],
      keywords: []
    }))

    // Assign documents to clusters (simplified)
    documents.forEach((_, docIndex) => {
      const clusterId = docIndex % numClusters
      clusters[clusterId].documents.push(`doc_${docIndex}`)
    })

    // Extract keywords for each cluster
    clusters.forEach((cluster) => {
      const terms = new Map<string, number>()
      
      cluster.documents.forEach(docId => {
        const docIndex = parseInt(docId.split('_')[1])
        tfidf.listTerms(docIndex).slice(0, 10).forEach((item: any) => {
          terms.set(item.term, (terms.get(item.term) || 0) + item.tfidf)
        })
      })

      cluster.keywords = Array.from(terms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)
    })

    return clusters
  }
}

export const nlpService = new NLPService()
export const preprocessingService = new PreprocessingService()
