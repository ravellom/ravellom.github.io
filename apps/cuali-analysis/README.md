# Qualitative Analysis App

A modern, client-side Single Page Application for qualitative text analysis inspired by ATLAS.ti and NVivo. Features manual text coding, NLP analysis, topic modeling, visualizations, and offline storage.

## Features

### 🎯 Core Functionality
- **Manual Text Coding**: Highlight and tag text segments with custom codes
- **Project Management**: Create, import, and export projects (JSON format)
- **Offline Storage**: All data stored locally in IndexedDB
- **Multi-document Support**: Work with multiple documents in a single project

### 🔬 Analysis Tools
- **NLP Processing**: Automatic text preprocessing pipeline
  - Tokenization
  - Stopword removal
  - Stemming / Lemmatization
  - N-grams extraction
  - TF-IDF calculation

- **Topic Modeling**: LDA-based topic extraction
- **Sentiment Analysis**: Basic sentiment scoring
- **Named Entity Recognition**: Extract people, organizations, locations
- **Clustering**: Document similarity clustering

### 📊 Visualizations
- Word clouds
- Frequency charts
- Code co-occurrence networks
- Sentiment timelines
- Cluster visualizations

### 🎨 UI/UX
- Modern, responsive 3-panel layout
- Dark/Light mode
- Resizable panels
- Keyboard shortcuts
- Real-time highlighting of coded segments
- Color-coded citations

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3
- **Database**: Dexie.js (IndexedDB wrapper)
- **NLP Libraries**:
  - `compromise` - Natural language processing
  - `natural` - NLP toolkit (tokenization, stemming, TF-IDF, sentiment)
  - `lda` - Topic modeling
- **Visualizations**:
  - D3.js - Advanced visualizations
  - Chart.js - Charts and graphs
- **Icons**: Lucide React
- **Performance**: Web Workers for heavy processing

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Usage Guide

### 1. Create a Project

1. Click "Create New Project" on the welcome screen
2. Enter a project name and optional description
3. Click "Create Project"

### 2. Add Documents

1. Click the "+" button in the Documents sidebar
2. Enter document name and content, OR
3. Click the file icon to import TXT/CSV/JSON files

### 3. Create Codes

1. In the right panel, click the "+" button
2. Enter code name and select a color
3. Add an optional description
4. Click "Create"

### 4. Code Text Segments

1. Select a document from the sidebar
2. Highlight text in the main panel
3. A dialog will appear - select one or more codes
4. Optionally add a memo
5. Click "Apply"

### 5. View Citations

- Coded segments are highlighted in the document
- Hover over highlights to see code names and memos
- Click on a code in the right panel to expand and view all citations

### 6. Export/Import Projects

- **Export**: Click the download icon in the header to save as JSON
- **Import**: Click the upload icon to load a saved project

## Architecture

```
src/
├── components/
│   ├── layout/          # MainLayout, Header, Sidebar
│   ├── panels/          # DocumentPanel, CodePanel, AnalysisPanel
│   └── screens/         # WelcomeScreen
├── contexts/            # React contexts (Theme, Project)
├── services/
│   ├── database.ts      # IndexedDB operations
│   └── nlp.ts           # NLP processing
├── types/               # TypeScript type definitions
├── workers/             # Web Workers for heavy processing
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

### Key Design Patterns

- **Context API**: Global state management (Project, Theme)
- **Service Layer**: Separation of business logic from UI
- **Web Workers**: Offload heavy NLP processing
- **IndexedDB**: Persistent offline storage
- **Type Safety**: Full TypeScript coverage

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Component-based architecture
- Functional components with hooks

### Adding New Features

1. **New Analysis Type**: Add to `src/services/nlp.ts`
2. **New Visualization**: Create component in `src/components/visualizations/`
3. **New Data Type**: Update `src/types/index.ts` and database schema
4. **New UI Component**: Add to `src/components/` with proper typing

## Performance Considerations

- Text highlighting is optimized for large documents
- NLP processing runs in Web Workers (non-blocking)
- IndexedDB provides fast local storage
- Lazy loading for large datasets
- Efficient re-rendering with React memoization

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires IndexedDB and Web Workers support.

## Data Privacy

All data is stored locally in the browser's IndexedDB. No data is sent to external servers. Projects are completely offline and private.

## Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save project (auto-saves)
- `Ctrl/Cmd + E`: Export project
- `Ctrl/Cmd + I`: Import project
- `Esc`: Close dialogs

## Future Enhancements

- [ ] Advanced clustering (t-SNE, PCA)
- [ ] Collaborative coding (conflict resolution)
- [ ] PDF import support
- [ ] Advanced search and filters
- [ ] Export to SPSS/Excel formats
- [ ] Hierarchical code trees
- [ ] Query language for complex searches
- [ ] Audio/video transcription support

## Contributing

This is a demonstration project. For production use, consider:
- Adding comprehensive error handling
- Implementing data validation
- Adding unit and integration tests
- Optimizing for very large documents (>100MB)
- Adding undo/redo functionality
- Implementing collaborative features

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by ATLAS.ti and NVivo
- Built with modern web technologies
- NLP powered by compromise, natural, and lda libraries

## Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This application is for research and educational purposes. For production qualitative research, consider established tools like ATLAS.ti, NVivo, or MAXQDA.
