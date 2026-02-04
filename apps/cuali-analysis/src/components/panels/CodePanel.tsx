import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useProject } from '../../contexts/ProjectContext'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
]

export default function CodePanel() {
  const { codes, createCode, updateCode, deleteCode, citations } = useProject()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(PRESET_COLORS[0])
  const [formDesc, setFormDesc] = useState('')

  const handleCreate = async () => {
    if (!formName.trim()) return
    await createCode(formName, formColor, formDesc.trim() || undefined)
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingCode || !formName.trim()) return
    await updateCode(editingCode, {
      name: formName,
      color: formColor,
      description: formDesc.trim() || undefined
    })
    resetForm()
  }

  const handleEdit = (codeId: string) => {
    const code = codes.find(c => c.id === codeId)
    if (!code) return
    
    setEditingCode(codeId)
    setFormName(code.name)
    setFormColor(code.color)
    setFormDesc(code.description || '')
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingCode(null)
    setFormName('')
    setFormColor(PRESET_COLORS[0])
    setFormDesc('')
  }

  const getCodeCitations = (codeId: string) => {
    return citations.filter(c => c.codeIds.includes(codeId))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Codes
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 hover:bg-accent rounded"
            title="Add code"
          >
            <Plus size={16} />
          </button>
        </div>

        {showCreateForm && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              placeholder="Code name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Color:</label>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-6 h-6 rounded border-2 ${formColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <textarea
              placeholder="Description (optional)"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={editingCode ? handleUpdate : handleCreate}
                className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {editingCode ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {codes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-4">
            No codes yet. Create one to start coding.
          </div>
        ) : (
          <div className="space-y-1">
            {codes.map(code => {
              const citationCount = getCodeCitations(code.id).length
              
              return (
                <div
                  key={code.id}
                  className="group p-3 rounded hover:bg-accent transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: code.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {code.name}
                        <span className="text-xs text-muted-foreground">
                          ({citationCount})
                        </span>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {code.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(code.id)}
                        className="p-1 hover:bg-primary/10 rounded"
                        title="Edit code"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete code "${code.name}"? This will remove it from ${citationCount} citation(s).`)) {
                            deleteCode(code.id)
                          }
                        }}
                        className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                        title="Delete code"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {citationCount > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <details className="cursor-pointer">
                        <summary className="hover:text-foreground">
                          View {citationCount} citation{citationCount > 1 ? 's' : ''}
                        </summary>
                        <div className="mt-2 space-y-2 pl-2 border-l-2" style={{ borderColor: code.color }}>
                          {getCodeCitations(code.id).map(citation => (
                            <div key={citation.id} className="text-xs">
                              <div className="font-mono bg-muted p-1 rounded">
                                "{citation.text.slice(0, 100)}{citation.text.length > 100 ? '...' : ''}"
                              </div>
                              {citation.memo && (
                                <div className="mt-1 italic text-muted-foreground">
                                  {citation.memo}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
