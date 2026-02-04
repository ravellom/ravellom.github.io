import { useState, useRef } from 'react'
import { useProject } from '../../contexts/ProjectContext'

export default function DocumentPanel() {
  const { currentDocument, selection, setSelection, codes, citations, createCitation } = useProject()
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [memo, setMemo] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const handleTextSelection = () => {
    const sel = window.getSelection()
    if (!sel || !currentDocument || sel.toString().trim() === '') {
      return
    }

    const range = sel.getRangeAt(0)
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(contentRef.current!)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const startIndex = preSelectionRange.toString().length

    setSelection({
      documentId: currentDocument.id,
      startIndex,
      endIndex: startIndex + sel.toString().length,
      text: sel.toString()
    })
    setShowCodeDialog(true)
  }

  const handleApplyCodes = async () => {
    if (selectedCodes.length === 0) return
    if (memo.trim().length < 10) {
      alert('Analytical memo is required (minimum 10 characters)')
      return
    }
    
    await createCitation(selectedCodes, memo.trim())
    
    setSelectedCodes([])
    setMemo('')
    setShowCodeDialog(false)
  }

  const renderHighlightedText = () => {
    if (!currentDocument) return null

    const documentCitations = citations.filter(c => c.documentId === currentDocument.id)
    if (documentCitations.length === 0) {
      return <div className="whitespace-pre-wrap">{currentDocument.content}</div>
    }

    // Sort citations by start index
    const sorted = [...documentCitations].sort((a, b) => a.startIndex - b.startIndex)

    const segments: JSX.Element[] = []
    let lastIndex = 0

    sorted.forEach((citation, idx) => {
      // Add text before citation
      if (citation.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${idx}`}>
            {currentDocument.content.slice(lastIndex, citation.startIndex)}
          </span>
        )
      }

      // Add highlighted citation
      const code = codes.find(c => citation.codeIds.includes(c.id))
      segments.push(
        <span
          key={`cite-${idx}`}
          className="code-highlight"
          style={{
            backgroundColor: code ? `${code.color}40` : '#fbbf2440',
            borderBottom: `2px solid ${code?.color || '#fbbf24'}`
          }}
          title={citation.memo || code?.name}
        >
          {currentDocument.content.slice(citation.startIndex, citation.endIndex)}
        </span>
      )

      lastIndex = citation.endIndex
    })

    // Add remaining text
    if (lastIndex < currentDocument.content.length) {
      segments.push(
        <span key="text-end">
          {currentDocument.content.slice(lastIndex)}
        </span>
      )
    }

    return <div className="whitespace-pre-wrap">{segments}</div>
  }

  if (!currentDocument) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No document selected</p>
          <p className="text-sm">Select a document from the sidebar to start coding</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="font-semibold text-lg">{currentDocument.name}</h2>
        <p className="text-sm text-muted-foreground">
          {currentDocument.content.length} characters • {citations.filter(c => c.documentId === currentDocument.id).length} citations
        </p>
      </div>

      <div 
        ref={contentRef}
        className="flex-1 p-6 overflow-auto leading-relaxed"
        onMouseUp={handleTextSelection}
      >
        {renderHighlightedText()}
      </div>

      {showCodeDialog && selection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full m-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Code Selection</h3>
            
            <div className="mb-4 p-3 bg-muted rounded text-sm">
              "{selection.text}"
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Codes {codes.length > 0 && `(${selectedCodes.length} selected)`}:
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded p-2">
                {codes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No codes available yet.</p>
                    <p className="text-xs text-muted-foreground">
                      Go to the <strong>Codes</strong> tab in the right panel and create a code first.
                    </p>
                  </div>
                ) : (
                  codes.map(code => (
                    <label
                      key={code.id}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCodes([...selectedCodes, code.id])
                          } else {
                            setSelectedCodes(selectedCodes.filter(id => id !== code.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: code.color }}
                      />
                      <span className="text-sm">{code.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Analytical Memo <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Explain WHY you're applying these codes. What interpretation or pattern do you see?
              </p>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Describe your analytical reasoning for this coding... (minimum 10 characters)"
                rows={4}
                className="w-full px-3 py-2 border border-border rounded bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center justify-between text-xs mt-1">
                <span className={memo.trim().length < 10 ? 'text-destructive' : 'text-muted-foreground'}>
                  {memo.trim().length}/10 characters
                  {memo.trim().length < 10 && ` (${10 - memo.trim().length} more needed)`}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApplyCodes}
                disabled={selectedCodes.length === 0 || memo.trim().length < 10}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Codes
              </button>
              <button
                onClick={() => {
                  setShowCodeDialog(false)
                  setSelection(null)
                  setSelectedCodes([])
                  setMemo('')
                }}
                className="flex-1 px-4 py-2 bg-secondary rounded font-medium hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
