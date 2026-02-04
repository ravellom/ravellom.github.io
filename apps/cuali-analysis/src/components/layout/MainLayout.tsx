import { useState, useEffect } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import Header from './Header'
import Sidebar from './Sidebar'
import DocumentPanel from '../panels/DocumentPanel'
import CodePanel from '../panels/CodePanel'
import AnalysisPanel from '../panels/AnalysisPanel'
import CodeReviewPanel from '../panels/CodeReviewPanel'
import DiaryPanel from '../panels/DiaryPanel'
import MethodologicalIndicators from '../panels/MethodologicalIndicators'
import ProjectHistoryPanel from '../panels/ProjectHistoryPanel'
import WelcomeScreen from '../screens/WelcomeScreen'

export default function MainLayout() {
  const { currentProject } = useProject()
  const [leftPanelWidth, setLeftPanelWidth] = useState(280)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [rightTab, setRightTab] = useState<'codes' | 'review' | 'diary' | 'indicators' | 'history'>('codes')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX
        if (newWidth > 200 && newWidth < 500) {
          setLeftPanelWidth(newWidth)
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth > 200 && newWidth < 600) {
          setRightPanelWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizingLeft, isResizingRight])

  if (!currentProject) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <WelcomeScreen />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Documents */}
        <div 
          className="bg-card border-r border-border flex-shrink-0"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <Sidebar />
        </div>

        {/* Resize Handle - Left */}
        <div
          className="resize-handle"
          onMouseDown={() => setIsResizingLeft(true)}
        />

        {/* Main Content - Document/Code View */}
        <div className="flex-1 overflow-auto">
          <DocumentPanel />
        </div>

        {/* Resize Handle - Right */}
        <div
          className="resize-handle"
          onMouseDown={() => setIsResizingRight(true)}
        />

        {/* Right Panel - Codes/Review/Diary/Indicators/History */}
        <div 
          className="bg-card border-l border-border flex-shrink-0 overflow-hidden flex flex-col"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="flex border-b border-border overflow-x-auto">
            <button 
              onClick={() => setRightTab('codes')}
              className={`px-3 py-2 text-xs font-medium hover:bg-accent whitespace-nowrap ${rightTab === 'codes' ? 'bg-accent border-b-2 border-primary' : ''}`}
            >
              Codes
            </button>
            <button 
              onClick={() => setRightTab('review')}
              className={`px-3 py-2 text-xs font-medium hover:bg-accent whitespace-nowrap ${rightTab === 'review' ? 'bg-accent border-b-2 border-primary' : ''}`}
            >
              Code Review
            </button>
            <button 
              onClick={() => setRightTab('diary')}
              className={`px-3 py-2 text-xs font-medium hover:bg-accent whitespace-nowrap ${rightTab === 'diary' ? 'bg-accent border-b-2 border-primary' : ''}`}
            >
              Diary
            </button>
            <button 
              onClick={() => setRightTab('indicators')}
              className={`px-3 py-2 text-xs font-medium hover:bg-accent whitespace-nowrap ${rightTab === 'indicators' ? 'bg-accent border-b-2 border-primary' : ''}`}
            >
              Indicators
            </button>
            <button 
              onClick={() => setRightTab('history')}
              className={`px-3 py-2 text-xs font-medium hover:bg-accent whitespace-nowrap ${rightTab === 'history' ? 'bg-accent border-b-2 border-primary' : ''}`}
            >
              History
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {rightTab === 'codes' && <CodePanel />}
            {rightTab === 'review' && <CodeReviewPanel />}
            {rightTab === 'diary' && <DiaryPanel />}
            {rightTab === 'indicators' && <MethodologicalIndicators />}
            {rightTab === 'history' && <ProjectHistoryPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
