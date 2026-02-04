import { useProject } from '../../contexts/ProjectContext'
import { AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Methodological Indicators Panel
 * 
 * Simple metrics to detect over-coding, under-coding, and ensure
 * methodological rigor. No fancy charts - just clear numbers.
 */
export default function MethodologicalIndicators() {
  const { codes, citations, documents } = useProject()

  // Calculate metrics
  const totalCodes = codes.length
  const totalCitations = citations.length
  const totalDocuments = documents.length
  
  const avgCitationsPerCode = totalCodes > 0 
    ? (totalCitations / totalCodes).toFixed(1) 
    : '0'
  
  const codesWithOneCitation = codes.filter(code => {
    const citationCount = citations.filter(c => c.codeIds.includes(code.id)).length
    return citationCount === 1
  }).length
  
  const unusedCodes = codes.filter(code => {
    const citationCount = citations.filter(c => c.codeIds.includes(code.id)).length
    return citationCount === 0
  }).length

  const documentsWithCitations = new Set(citations.map(c => c.documentId)).size
  const uncodedDocs = totalDocuments - documentsWithCitations

  const citationsWithoutMemo = citations.filter(c => !c.memo || c.memo.trim().length < 10).length

  // Warning thresholds
  const hasWarnings = codesWithOneCitation > totalCodes * 0.3 || unusedCodes > 0 || citationsWithoutMemo > 0

  return (
    <div className="p-4 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-medium text-sm">Methodological Indicators</h3>
        {hasWarnings ? (
          <AlertTriangle size={14} className="text-destructive" />
        ) : (
          <CheckCircle size={14} className="text-green-600" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Basic counts */}
        <div className="p-2 bg-background rounded">
          <div className="text-muted-foreground">Total Codes</div>
          <div className="text-lg font-semibold">{totalCodes}</div>
        </div>

        <div className="p-2 bg-background rounded">
          <div className="text-muted-foreground">Total Citations</div>
          <div className="text-lg font-semibold">{totalCitations}</div>
        </div>

        <div className="p-2 bg-background rounded">
          <div className="text-muted-foreground">Avg Citations/Code</div>
          <div className="text-lg font-semibold">{avgCitationsPerCode}</div>
        </div>

        <div className="p-2 bg-background rounded">
          <div className="text-muted-foreground">Documents Coded</div>
          <div className="text-lg font-semibold">{documentsWithCitations}/{totalDocuments}</div>
        </div>

        {/* Warnings */}
        {unusedCodes > 0 && (
          <div className="col-span-2 p-2 bg-destructive/10 border border-destructive/30 rounded">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={12} />
              <span className="font-medium">Unused Codes: {unusedCodes}</span>
            </div>
            <div className="text-muted-foreground mt-1">Consider deleting or merging unused codes</div>
          </div>
        )}

        {codesWithOneCitation > 0 && (
          <div className="col-span-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
              <AlertTriangle size={12} />
              <span className="font-medium">Single-use Codes: {codesWithOneCitation}</span>
            </div>
            <div className="text-muted-foreground mt-1">
              {codesWithOneCitation > totalCodes * 0.3 
                ? 'High number may indicate over-coding' 
                : 'Monitor for potential merging opportunities'}
            </div>
          </div>
        )}

        {citationsWithoutMemo > 0 && (
          <div className="col-span-2 p-2 bg-destructive/10 border border-destructive/30 rounded">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={12} />
              <span className="font-medium">Missing Memos: {citationsWithoutMemo}</span>
            </div>
            <div className="text-muted-foreground mt-1">All citations should have analytical memos</div>
          </div>
        )}

        {uncodedDocs > 0 && (
          <div className="col-span-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <AlertTriangle size={12} />
              <span className="font-medium">Uncoded Documents: {uncodedDocs}</span>
            </div>
            <div className="text-muted-foreground mt-1">Review remaining documents for coding</div>
          </div>
        )}

        {!hasWarnings && totalCitations > 0 && (
          <div className="col-span-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-500">
              <CheckCircle size={14} />
              <span className="font-medium">Good methodological hygiene</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
