import { FileText, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'

export default function Sidebar() {
  const { documents, currentDocument, createDocument, selectDocument, deleteDocument } = useProject()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocContent, setNewDocContent] = useState('')

  const handleAddDocument = async () => {
    if (!newDocName.trim()) return
    
    await createDocument(newDocName, newDocContent)
    setNewDocName('')
    setNewDocContent('')
    setShowAddForm(false)
  }

  const handleFileImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.csv,.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        await createDocument(file.name, text)
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import file')
      }
    }
    input.click()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Documents
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1 hover:bg-accent rounded"
              title="Add document"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleFileImport}
              className="p-1 hover:bg-accent rounded"
              title="Import file"
            >
              <FileText size={16} />
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Document name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />
            <textarea
              placeholder="Content (optional)"
              value={newDocContent}
              onChange={(e) => setNewDocContent(e.target.value)}
              rows={3}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddDocument}
                className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No documents yet. Add one to get started.
          </div>
        ) : (
          <div className="p-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`
                  flex items-center gap-2 p-3 mb-1 rounded cursor-pointer transition-colors
                  ${currentDocument?.id === doc.id 
                    ? 'bg-accent border border-primary' 
                    : 'hover:bg-accent/50'
                  }
                `}
                onClick={() => selectDocument(doc.id)}
              >
                <FileText size={16} className="flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.content.length} chars
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${doc.name}"?`)) {
                      deleteDocument(doc.id)
                    }
                  }}
                  className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
