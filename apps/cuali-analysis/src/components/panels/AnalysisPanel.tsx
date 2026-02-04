import { useState, useEffect, useRef } from 'react'
import { BarChart3, Cloud, Network, TrendingUp, X } from 'lucide-react'
import { useProject } from '../../contexts/ProjectContext'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { NLPService, PreprocessingService } from '../../services/nlp'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type VisualizationType = 'wordcloud' | 'frequency' | 'network' | 'sentiment' | null

export default function AnalysisPanel() {
  const { currentProject, documents, codes, citations } = useProject()
  const [activeViz, setActiveViz] = useState<VisualizationType>(null)
  const [vizData, setVizData] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nlpService = useRef(new NLPService()).current
  const preprocessingService = useRef(new PreprocessingService()).current

  if (!currentProject) return null

  const totalWords = documents.reduce((sum, doc) => {
    return sum + doc.content.split(/\s+/).length
  }, 0)

  const totalCitations = citations.length

  const generateWordCloud = async () => {
    const allText = documents.map(d => d.content).join(' ')
    const tokens = preprocessingService.tokenize(allText)
    const frequencies = nlpService.calculateFrequencies(tokens)
    setVizData({ type: 'wordcloud', data: frequencies.slice(0, 50) })
    setActiveViz('wordcloud')
  }

  const generateFrequencyChart = async () => {
    const codeCounts = codes.map(code => ({
      name: code.name,
      count: citations.filter(c => c.codeIds.includes(code.id)).length,
      color: code.color
    })).sort((a, b) => b.count - a.count).slice(0, 10)

    setVizData({
      type: 'frequency',
      labels: codeCounts.map(c => c.name),
      datasets: [{
        label: 'Citations',
        data: codeCounts.map(c => c.count),
        backgroundColor: codeCounts.map(c => c.color + '80'),
        borderColor: codeCounts.map(c => c.color),
        borderWidth: 2
      }]
    })
    setActiveViz('frequency')
  }

  const generateCodeNetwork = () => {
    // Create co-occurrence matrix
    const coOccurrence: { [key: string]: { [key: string]: number } } = {}
    
    citations.forEach(citation => {
      citation.codeIds.forEach(codeId1 => {
        if (!coOccurrence[codeId1]) coOccurrence[codeId1] = {}
        citation.codeIds.forEach(codeId2 => {
          if (codeId1 !== codeId2) {
            coOccurrence[codeId1][codeId2] = (coOccurrence[codeId1][codeId2] || 0) + 1
          }
        })
      })
    })

    const nodes = codes.map(code => ({
      id: code.id,
      name: code.name,
      color: code.color,
      size: citations.filter(c => c.codeIds.includes(code.id)).length
    }))

    const links: Array<{ source: string; target: string; value: number }> = []
    Object.keys(coOccurrence).forEach(source => {
      Object.keys(coOccurrence[source]).forEach(target => {
        links.push({ source, target, value: coOccurrence[source][target] })
      })
    })

    setVizData({ type: 'network', nodes, links })
    setActiveViz('network')
  }

  const generateSentimentAnalysis = async () => {
    const sentiments = await Promise.all(
      documents.map(async doc => {
        const sentiment = nlpService.analyzeSentiment(doc.content)
        return { name: doc.name, sentiment }
      })
    )

    setVizData({
      type: 'sentiment',
      labels: sentiments.map(s => s.name),
      datasets: [{
        label: 'Sentiment Score',
        data: sentiments.map(s => s.sentiment.score),
        backgroundColor: sentiments.map(s => 
          s.sentiment.score > 0.1 ? '#22c55e80' : 
          s.sentiment.score < -0.1 ? '#ef444480' : '#94a3b880'
        ),
        borderColor: sentiments.map(s => 
          s.sentiment.score > 0.1 ? '#22c55e' : 
          s.sentiment.score < -0.1 ? '#ef4444' : '#94a3b8'
        ),
        borderWidth: 2
      }]
    })
    setActiveViz('sentiment')
  }

  useEffect(() => {
    if (activeViz === 'network' && vizData && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const { nodes, links } = vizData

      // Simple force-directed layout
      const positions = nodes.map((node: any, i: number) => ({
        x: width / 2 + Math.cos(i * 2 * Math.PI / nodes.length) * 150,
        y: height / 2 + Math.sin(i * 2 * Math.PI / nodes.length) * 150,
        ...node
      }))

      // Draw links
      ctx.strokeStyle = '#94a3b840'
      ctx.lineWidth = 1
      links.forEach((link: any) => {
        const source = positions.find((p: any) => p.id === link.source)
        const target = positions.find((p: any) => p.id === link.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      positions.forEach((pos: any) => {
        ctx.fillStyle = pos.color
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, Math.max(5, pos.size * 2), 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.fillStyle = '#fff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(pos.name, pos.x, pos.y + pos.size * 2 + 12)
      })
    }
  }, [activeViz, vizData])

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
        Analysis
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-2xl font-bold text-primary">{documents.length}</div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </div>
          
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-2xl font-bold text-primary">{codes.length}</div>
            <div className="text-xs text-muted-foreground">Codes</div>
          </div>
          
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalCitations}</div>
            <div className="text-xs text-muted-foreground">Citations</div>
          </div>
          
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalWords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Words</div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-medium text-sm mb-2">Visualizations</h3>
          <div className="space-y-2">
            <button 
              onClick={generateWordCloud}
              disabled={documents.length === 0}
              className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cloud size={16} />
              <span>Word Cloud</span>
            </button>
            <button 
              onClick={generateFrequencyChart}
              disabled={codes.length === 0}
              className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 size={16} />
              <span>Frequency Chart</span>
            </button>
            <button 
              onClick={generateCodeNetwork}
              disabled={citations.length === 0}
              className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Network size={16} />
              <span>Code Network</span>
            </button>
            <button 
              onClick={generateSentimentAnalysis}
              disabled={documents.length === 0}
              className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp size={16} />
              <span>Sentiment Analysis</span>
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-medium text-sm mb-2">Top Codes</h3>
          {codes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No codes yet</p>
          ) : (
            <div className="space-y-1">
              {codes
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(code => (
                  <div key={code.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: code.color }}
                    />
                    <span className="flex-1 truncate">{code.name}</span>
                    <span className="text-xs text-muted-foreground">{code.count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Visualization Modal */}
      {activeViz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {activeViz === 'wordcloud' && 'Word Cloud'}
                {activeViz === 'frequency' && 'Code Frequency'}
                {activeViz === 'network' && 'Code Co-occurrence Network'}
                {activeViz === 'sentiment' && 'Sentiment Analysis'}
              </h3>
              <button onClick={() => setActiveViz(null)} className="p-1 hover:bg-accent rounded">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {activeViz === 'wordcloud' && vizData && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {vizData.data.map((item: any, i: number) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-1 rounded"
                      style={{
                        fontSize: `${Math.max(12, Math.min(item.count * 2, 48))}px`,
                        color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
                        fontWeight: item.count > 10 ? 'bold' : 'normal'
                      }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              )}

              {(activeViz === 'frequency' || activeViz === 'sentiment') && vizData && (
                <div className="h-96">
                  <Bar
                    data={vizData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: activeViz === 'frequency' ? 'Top 10 Codes by Citation Count' : 'Document Sentiment Scores'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: activeViz === 'frequency' ? 'Number of Citations' : 'Sentiment Score'
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}

              {activeViz === 'network' && vizData && (
                <div className="flex flex-col items-center">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={500}
                    className="border border-border rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-4">
                    Network shows code co-occurrence in citations. Larger nodes = more citations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
