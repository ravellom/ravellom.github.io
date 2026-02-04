import { FolderPlus, Upload } from 'lucide-react'
import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'

export default function WelcomeScreen() {
  const { createProject, importProject } = useProject()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  const handleCreate = async () => {
    if (!projectName.trim()) return
    await createProject(projectName, projectDesc)
    setProjectName('')
    setProjectDesc('')
    setShowCreateForm(false)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        await importProject(text)
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import project')
      }
    }
    input.click()
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Qualitative Analysis</h1>
          <p className="text-lg text-muted-foreground">
            A powerful tool for qualitative text analysis with manual coding, NLP, and visualizations
          </p>
        </div>

        {!showCreateForm ? (
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="group p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-all"
            >
              <FolderPlus size={48} className="mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Create New Project</h3>
              <p className="text-sm text-muted-foreground">
                Start a new qualitative analysis project from scratch
              </p>
            </button>

            <button
              onClick={handleImport}
              className="group p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-all"
            >
              <Upload size={48} className="mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Import Project</h3>
              <p className="text-sm text-muted-foreground">
                Load an existing project from a JSON file
              </p>
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Research Project"
                  className="w-full px-3 py-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="A brief description of your project..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!projectName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setProjectName('')
                    setProjectDesc('')
                  }}
                  className="flex-1 px-4 py-2 bg-secondary rounded font-medium hover:bg-secondary/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <h4 className="font-semibold mb-2">Features:</h4>
          <div className="flex flex-wrap justify-center gap-4">
            <span>• Manual Text Coding</span>
            <span>• NLP Analysis</span>
            <span>• Topic Modeling</span>
            <span>• Sentiment Analysis</span>
            <span>• Visualizations</span>
            <span>• Offline Storage</span>
          </div>
        </div>
      </div>
    </div>
  )
}
