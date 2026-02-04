import { ProjectProvider } from './contexts/ProjectContext'
import { ThemeProvider } from './contexts/ThemeContext'
import MainLayout from './components/layout/MainLayout'
import './index.css'

function App() {
  console.log('App component rendering')
  
  return (
    <ThemeProvider>
      <ProjectProvider>
        <MainLayout />
      </ProjectProvider>
    </ThemeProvider>
  )
}

export default App
