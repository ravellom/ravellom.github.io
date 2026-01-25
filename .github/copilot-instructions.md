# AI Coding Guidelines for ravellom.github.io

## Project Architecture

This is a GitHub Pages portfolio containing multiple independent educational web applications:

- **Root level**: Simple HTML index linking to sub-projects
- **biblioclick/**: Vanilla JS bibliography reference generator with localStorage persistence
- **IA_apps/**: Educational tools hub with tabbed interface and multiple HTML pages
- **Open_Nutrition/**: React-based nutrition tracker (static deployment, no build system)
- **Open_Nutrition_local/**: Vanilla JS version of nutrition app
- **RED/**: Quarto-generated data analysis report
- **recuedu/**: Mobirise-generated educational website
- **quarto/**: Additional Quarto documents

## Key Patterns & Conventions

### Data Persistence
Use `localStorage` for client-side data storage:
```javascript
// Save data
localStorage.setItem('biblioclick_refs', JSON.stringify(references));

// Load data
const data = JSON.parse(localStorage.getItem('biblioclick_refs') || '[]');
```

### Tab Navigation (IA_apps pattern)
```javascript
function openTab(evt, tabName) {
  // Hide all panels, remove active classes, then show target panel
  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
}
```

### Nutrition Data Structure
```javascript
const nutritionData = {
  meta: { version: "1.0", created: new Date().toISOString() },
  profile: { weight: 75, height: 175, age: 30, gender: 'male', activity: 'moderate', goal: 'lose_fat' },
  logs: [{ timestamp: "2024-01-01T12:00:00Z", calories: 500, protein: 30, fat: 20, carbs: 50 }]
};
```

### Spanish Language Content
- All user-facing text should be in Spanish
- Code comments can be in English for maintainability
- Use proper Spanish punctuation and formatting

## Development Workflow

### No Build System
- Direct file editing - changes deploy immediately to GitHub Pages
- No compilation, bundling, or package management required
- Test by opening HTML files directly in browser

### File Organization
- Each sub-project is self-contained with its own `index.html`
- Shared assets (CSS/JS) within each project's folder
- External dependencies via CDN (Bootstrap, jQuery, etc.)

### Component Structure (React parts)
```jsx
// Open_Nutrition follows this pattern
import { DailySummary } from './components/dashboard/DailySummary';
import { FoodLogger } from './components/forms/FoodLogger';
import { Card } from './components/ui/Cards';
```

## External Dependencies

### CDN Resources
- Bootstrap 5.x for styling
- jQuery 3.x for DOM manipulation
- Font Awesome/Google Fonts for icons
- Plotly.js for data visualization (RED project)

### React Dependencies (Open_Nutrition)
- `lucide-react` for icons
- Standard React hooks (useState, useEffect)

## Educational Focus

All applications serve educational purposes:
- Bibliography management for students
- Interactive learning tools
- Nutrition education
- Data analysis demonstrations

Keep interfaces simple, accessible, and pedagogically sound.