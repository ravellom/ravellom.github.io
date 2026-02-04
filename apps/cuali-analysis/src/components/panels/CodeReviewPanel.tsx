import { useState, useEffect } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { citationService } from '../../services/database'
import type { Code, Citation } from '../../types'
import { Edit2, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Code Review Panel - Constant Comparison Method
 * 
 * Displays all citations for each code to enable systematic
 * comparison and refinement - core method in grounded theory.
 */
export default function CodeReviewPanel() {
  const { codes, documents } = useProject()
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [citationsByCode, setCitationsByCode] = useState<Map<string, Citation[]>>(new Map())
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [editingMemo, setEditingMemo] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')

  useEffect(() => {
    loadCitations()
  }, [codes])

  const loadCitations = async () => {
    const map = new Map<string, Citation[]>()
    
    for (const code of codes) {
      const citations = await citationService.getByCode(code.id)
      map.set(code.id, citations.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ))
    }
    
    setCitationsByCode(map)
  }

  const toggleCode = (codeId: string) => {
    const newExpanded = new Set(expandedCodes)
    if (newExpanded.has(codeId)) {
      newExpanded.delete(codeId)
    } else {
      newExpanded.add(codeId)
    }
    setExpandedCodes(newExpanded)
  }

  const getDocumentName = (documentId: string): string => {
    const doc = documents.find(d => d.id === documentId)
    return doc?.name || 'Unknown Document'
  }

  const handleEditMemo = (citationId: string, currentMemo: string) => {
    setEditingMemo(citationId)
    setMemoText(currentMemo)
  }

  const saveMemo = async (citationId: string) => {
    if (memoText.trim().length < 10) {
      alert('Memo must be at least 10 characters')
      return
    }
    
    await citationService.update(citationId, { memo: memoText, updatedAt: new Date() })
    setEditingMemo(null)
    loadCitations()
  }

  const toggleCompare = (codeId: string) => {
    if (selectedCodes.includes(codeId)) {
      setSelectedCodes(selectedCodes.filter(id => id !== codeId))
    } else if (selectedCodes.length < 2) {
      setSelectedCodes([...selectedCodes, codeId])
    }
  }

  // Split view when comparing two codes
  if (selectedCodes.length === 2) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Code Comparison</h2>
          <button 
            onClick={() => setSelectedCodes([])}
            className="px-3 py-1 text-sm bg-secondary rounded hover:bg-secondary/80"
          >
            Exit Comparison
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {selectedCodes.map(codeId => {
            const code = codes.find(c => c.id === codeId)
            const citations = citationsByCode.get(codeId) || []
            
            return (
              <div key={codeId} className="flex flex-col border border-border rounded">
                <div className="p-3 border-b border-border bg-accent">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: code?.color }} />
                    <span className="font-medium">{code?.name}</span>
                    <span className="text-xs text-muted-foreground">({citations.length})</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-3 space-y-3">
                  {citations.map(citation => (
                    <div key={citation.id} className="p-3 bg-muted/50 rounded text-sm">
                      <div className="text-xs text-muted-foreground mb-1">
                        {getDocumentName(citation.documentId)}
                      </div>
                      <div className="italic mb-2">"{citation.text}"</div>
                      <div className="text-xs">
                        <span className="font-medium">Memo:</span> {citation.memo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Default list view
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
          Code Review
        </h2>
        <p className="text-xs text-muted-foreground">
          Review all citations per code. Select two codes for side-by-side comparison.
        </p>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {codes.map(code => {
          const citations = citationsByCode.get(code.id) || []
          const isExpanded = expandedCodes.has(code.id)
          const isSelected = selectedCodes.includes(code.id)

          return (
            <div key={code.id} className="border border-border rounded">
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
                onClick={() => toggleCode(code.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: code.color }} />
                  <span className="font-medium">{code.name}</span>
                  <span className="text-xs text-muted-foreground">({citations.length} citations)</span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCompare(code.id)
                  }}
                  disabled={selectedCodes.length >= 2 && !isSelected}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSelected ? 'Deselect' : 'Compare'}
                </button>
              </div>

              {isExpanded && (
                <div className="p-3 border-t border-border space-y-3">
                  {citations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No citations yet</p>
                  ) : (
                    citations.map((citation, idx) => (
                      <div key={citation.id} className="p-3 bg-muted/50 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-xs text-muted-foreground">
                            #{idx + 1} • {getDocumentName(citation.documentId)} • {new Date(citation.createdAt).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => handleEditMemo(citation.id, citation.memo)}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>

                        <div className="text-sm italic mb-2 p-2 bg-background rounded">
                          "{citation.text}"
                        </div>

                        {editingMemo === citation.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={memoText}
                              onChange={(e) => setMemoText(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                              rows={4}
                              placeholder="Analytical memo (min. 10 characters)..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveMemo(citation.id)}
                                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMemo(null)}
                                className="px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <span className="font-medium">Memo:</span> {citation.memo || '(No memo)'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
