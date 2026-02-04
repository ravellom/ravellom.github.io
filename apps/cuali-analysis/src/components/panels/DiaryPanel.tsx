import { useState, useEffect } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { diaryService } from '../../services/diaryService'
import type { DiaryEntry } from '../../types'
import { Plus, Edit2, Trash2, Download } from 'lucide-react'

/**
 * Research Diary Panel
 * 
 * Maintains reflexive memos and methodological notes independent
 * of specific citations. Essential for audit trail and transparency.
 */
export default function DiaryPanel() {
  const { currentProject } = useProject()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    if (currentProject) {
      loadEntries()
    }
  }, [currentProject])

  const loadEntries = async () => {
    if (!currentProject) return
    const data = await diaryService.getByProject(currentProject.id)
    setEntries(data)
  }

  const handleCreate = async () => {
    if (!currentProject || text.trim().length < 20) {
      alert('Entry must be at least 20 characters')
      return
    }

    await diaryService.create(currentProject.id, text)
    setText('')
    setShowForm(false)
    loadEntries()
  }

  const handleUpdate = async () => {
    if (!editingId || text.trim().length < 20) {
      alert('Entry must be at least 20 characters')
      return
    }

    await diaryService.update(editingId, text)
    setText('')
    setEditingId(null)
    loadEntries()
  }

  const handleEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id)
    setText(entry.text)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this diary entry?')) {
      await diaryService.delete(id)
      loadEntries()
    }
  }

  const handleExport = async () => {
    if (!currentProject) return
    const markdown = await diaryService.exportToMarkdown(currentProject.id)
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name}_diary.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setText('')
  }

  if (!currentProject) return null

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Research Diary
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reflexive notes and methodological decisions
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className="p-2 hover:bg-accent rounded disabled:opacity-50"
            title="Export as Markdown"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 hover:bg-accent rounded"
            title="New Entry"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-border rounded bg-card">
          <h3 className="text-sm font-medium mb-2">
            {editingId ? 'Edit Entry' : 'New Entry'}
          </h3>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reflect on your coding process, emerging themes, methodological decisions... (min. 20 characters)"
            rows={6}
            className="w-full px-3 py-2 border border-border rounded bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.length} characters {text.length < 20 && `(need ${20 - text.length} more)`}
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={text.trim().length < 20}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                onClick={resetForm}
                className="px-3 py-1 text-sm bg-secondary rounded hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No diary entries yet</p>
            <p className="text-xs">Start documenting your research process</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="p-4 border border-border rounded bg-card">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="text-sm whitespace-pre-wrap">{entry.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
