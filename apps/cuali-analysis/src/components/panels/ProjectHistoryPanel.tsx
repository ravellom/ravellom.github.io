import { useState, useEffect } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { auditTrailService } from '../../services/auditTrailService'
import type { AuditEvent } from '../../types'
import { Clock, Download, ChevronDown, ChevronRight } from 'lucide-react'

export default function ProjectHistoryPanel() {
  const { currentProject } = useProject()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadEvents()
  }, [currentProject])

  const loadEvents = async () => {
    if (!currentProject) return
    
    const allEvents = await auditTrailService.getByProject(currentProject.id)
    setEvents(allEvents)
  }

  const handleExport = async () => {
    if (!currentProject) return
    
    const csv = await auditTrailService.exportToCSV(currentProject.id)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name}-audit-trail.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter)

  const eventTypes = Array.from(new Set(events.map(e => e.type)))

  const getEventTypeColor = (type: string) => {
    if (type.includes('CREATE')) return 'text-green-600'
    if (type.includes('DELETE')) return 'text-red-600'
    if (type.includes('EDIT')) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No project loaded</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h2 className="text-xl font-bold">Project History</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Events ({events.length})</option>
          {eventTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')} ({events.filter(e => e.type === type).length})
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No audit events yet</p>
            <p className="text-sm mt-2">All operations will be logged here for reproducibility</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id)
            
            return (
              <div
                key={event.id}
                className="border rounded-lg p-3 bg-white hover:bg-gray-50"
              >
                <div
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={() => toggleExpand(event.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-medium ${getEventTypeColor(event.type)}`}>
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-1">
                      {event.description}
                    </p>
                    
                    {isExpanded && event.payload && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <pre className="whitespace-pre-wrap font-mono">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>
          <strong>Audit trail:</strong> All critical operations are automatically logged.
          Export to CSV for methodological transparency and reproducibility.
        </p>
      </div>
    </div>
  )
}
