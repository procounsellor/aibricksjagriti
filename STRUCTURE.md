# Project Structure - Refactored

This document explains the new organized structure of the landing page application.

## Overview

The project has been restructured to separate concerns, improve maintainability, and make the codebase more scalable.

## Directory Structure

```
src/
├── components/           # Shared UI components
│   ├── Header.jsx
│   ├── Footer.jsx
│   └── LoadingSpinner.jsx
│
├── config/              # Configuration files
│   └── products.json
│
├── hooks/               # Shared React hooks
│   └── useReducedMotion.js
│
├── pages/               # Page-specific folders
│   ├── AiBricks/        # AiBricks page (refactored)
│   │   ├── index.jsx                 # Main page component
│   │   ├── AiBricksScene.jsx         # 3D scene
│   │   ├── colors.js                 # Color constants
│   │   ├── README.md                 # Documentation
│   │   ├── components/               # 3D components
│   │   │   ├── index.js              # Barrel export
│   │   │   ├── Building.jsx
│   │   │   ├── BuildingFloor.jsx
│   │   │   ├── ConstructionCrane.jsx
│   │   │   ├── Tree.jsx
│   │   │   ├── Car.jsx
│   │   │   ├── Bird.jsx
│   │   │   ├── ConstructionDust.jsx
│   │   │   ├── Road.jsx
│   │   │   └── Landscape.jsx
│   │   └── hooks/
│   │       └── useCameraAnimation.js
│   │
│   ├── HomePage.jsx     # Home page (to be refactored)
│   ├── ProCounselPage.jsx    # ProCounsel page (to be refactored)
│   └── TheMindSoulPage.jsx   # TheMindSoul page (to be refactored)
│
├── scenes/              # Old 3D scenes (to be migrated)
│   ├── AiBricksScene.jsx (DEPRECATED - use pages/AiBricks/)
│   ├── HomeScene.jsx
│   ├── ProCounselScene.jsx
│   └── TheMindSoulScene.jsx
│
├── utils/               # Shared utilities
│   ├── index.js         # Barrel export
│   ├── animations.js    # Animation/easing functions
│   ├── math.js          # Math utilities
│   └── README.md        # Documentation
│
├── App.jsx              # Main app with routing
├── i18n.js              # Internationalization
├── index.css            # Global styles
└── main.jsx             # Entry point
```

## Design Principles

### 1. **Separation of Concerns**
Each page has its own folder with:
- UI/Canvas setup (`index.jsx`)
- 3D scene composition (`*Scene.jsx`)
- Color constants (`colors.js`)
- Components (in `components/` subfolder)
- Hooks (in `hooks/` subfolder)

### 2. **Component Organization**
- **3D Components**: Self-contained with animations and materials
- **Shared Components**: In root `components/` folder
- **Page-Specific Components**: In page's `components/` subfolder

### 3. **Constants Management**
- Colors are defined per-page in `colors.js`
- No hardcoded color strings in components
- Easy theme changes

### 4. **Utilities**
- Common functions in `utils/`
- Animation helpers (easing functions)
- Math utilities (lerp, clamp, etc.)
- Properly documented with JSDoc

### 5. **Barrel Exports**
- `index.js` files for cleaner imports
- Example: `import { Building, Tree } from './components'`

## Migration Status

### ✅ Completed
- **AiBricks**: Fully refactored with new structure
- **Utils**: Created with animation and math utilities
- **Documentation**: READMEs for each major folder

### 🔄 To Do
- **HomePage**: Needs refactoring
- **ProCounsel**: Needs refactoring
- **TheMindSoul**: Needs refactoring
- Remove old `scenes/` folder after migration

## Usage Examples

### Importing from AiBricks
```javascript
// Clean imports with barrel exports
import { Building, Tree, Car } from './pages/AiBricks/components';
import colors from './pages/AiBricks/colors';

// Using utilities
import { easeOutCubic, lerp } from './utils';
```

### Adding a New Page
1. Create folder: `src/pages/NewPage/`
2. Add files:
   - `index.jsx` (main component)
   - `NewPageScene.jsx` (3D scene)
   - `colors.js` (color constants)
   - `components/` (3D components)
   - `hooks/` (custom hooks)
   - `README.md` (documentation)
3. Update `App.jsx` to import from new location

### Adding a New Component
1. Create component file in page's `components/` folder
2. Use colors from `colors.js`
3. Add JSDoc comments
4. Export from `components/index.js`

## Benefits

1. **Maintainability**: Easy to find and modify code
2. **Scalability**: Simple to add new pages/features
3. **Reusability**: Shared utilities and components
4. **Documentation**: READMEs explain structure
5. **Type Safety**: JSDoc comments for better IDE support
6. **Performance**: Optimized imports and lazy loading

## Next Steps

1. Refactor remaining pages (HomePage, ProCounsel, TheMindSoul)
2. Create color palette files for each page
3. Extract common 3D components to shared folder
4. Add TypeScript (optional)
5. Create component library documentation
