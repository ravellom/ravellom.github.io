import { Moon, Sun, Download, Upload, Settings } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useProject } from '../../contexts/ProjectContext'

export default function Header() {
  const { isDark, toggleTheme } = useTheme()
  const { currentProject, exportProject, importProject } = useProject()

  const handleExport = async () => {
    try {
      const data = await exportProject()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentProject?.name || 'project'}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export project')
    }
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
        alert('Project imported successfully')
      } catch (error) {
        console.error('Import failed:', error)
        alert('Failed to import project')
      }
    }
    input.click()
  }

  return (
    <header className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Qualitative Analysis</h1>
        {currentProject && (
          <span className="text-sm opacity-90">• {currentProject.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentProject && (
          <>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors"
              title="Export Project"
            >
              <Download size={20} />
            </button>
            
            <button
              onClick={handleImport}
              className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors"
              title="Import Project"
            >
              <Upload size={20} />
            </button>

            <button
              className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
