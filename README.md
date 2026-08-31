# TechCorp Landing Page

A production-grade, modular React + Three.js landing page with world-class 3D animations and internationalization support.

## Features

### ✨ World-Class 3D Scenes

- **Home Scene**: Animated icosahedron with orbiting elements and particle effects
- **aiBricks Scene**: Realistic skyscraper construction animation with:
  - 35 floors with individual windows and lighting
  - Dynamic particle system for construction sparks
  - Realistic materials with shadows and reflections
  - Smooth scroll-driven animations
- **ProCounsel Scene**: Student journey animation with:
  - Animated path visualization
  - University entrance to success destination
  - Degree appearance animation
  - Enhanced lighting and particle effects
- **TheMindSoul Scene**: Calming wellness visualization with:
  - Breathing orb with inner/outer glow
  - Floating particles
  - Multiple sparkle systems
  - Dynamic color-shifting lighting

### 🚀 Performance Optimizations

- **ACES Filmic Tone Mapping** for cinematic lighting
- **Dynamic DPR** (device pixel ratio) for optimal quality/performance
- **Shadow mapping** with optimized settings
- **Selective updates** for efficient rendering
- **High-performance WebGL** context

### ♿ Accessibility

- **Reduced motion support** respecting user preferences
- **ARIA labels** on interactive elements
- **Keyboard navigation** ready
- **Screen reader friendly** structure

### 🌍 Internationalization

- Full English/Spanish support
- Easy to add more languages via `src/i18n.js`
- All UI text driven by i18n

### 🎯 Modular Architecture

- **JSON-driven page config** (`src/config/products.json`)
- Easy to add/remove pages by editing JSON
- Component-based structure
- Lazy-loaded pages for optimal performance

### 🛣️ URL-Based Routing

- React Router DOM integration
- Clean URLs: `/`, `/aiBricks`, `/proCounsel`, `/theMindSoul`
- Browser history support

## Getting Started

### Prerequisites

- Node.js 18+ (use Node 22 recommended via `.nvmrc`)
- npm or yarn

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

## Project Structure

```
landing/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── LoadingSpinner.jsx
│   ├── scenes/          # 3D Three.js scenes
│   │   ├── HomeScene.jsx
│   │   ├── AiBricksScene.jsx
│   │   ├── ProCounselScene.jsx
│   │   └── TheMindSoulScene.jsx
│   ├── pages/           # Page components
│   │   ├── HomePage.jsx
│   │   ├── AiBricksPage.jsx
│   │   ├── ProCounselPage.jsx
│   │   └── TheMindSoulPage.jsx
│   ├── config/          # Configuration files
│   │   └── products.json
│   ├── hooks/           # Custom React hooks
│   │   └── useReducedMotion.js
│   ├── i18n.js          # Internationalization setup
│   ├── App.jsx          # Main app with routing
│   └── main.jsx         # Entry point
├── package.json
└── vite.config.js
```

## Adding/Removing Pages

1. Edit `src/config/products.json`:
```json
{
  "newProduct": {
    "id": "newProduct",
    "labelKey": "navNewProduct",
    "component": "NewProductPage"
  }
}
```

2. Create the page component in `src/pages/NewProductPage.jsx`
3. Add the component to `PageRegistry` in `src/App.jsx`
4. Add translations to `src/i18n.js`
5. Add navigation link to `src/components/Header.jsx`

## SSR/Pre-rendering

The app is structured for SSR compatibility. For full SSR, consider:

1. **vite-plugin-ssr** - Full SSR framework
2. **react-snap** - Static pre-rendering
3. **Next.js migration** - For full SSR capabilities

Current setup uses client-side routing and is optimized for static hosting (Vercel, Netlify, etc.).

## Performance Tips

- Scenes use optimized geometries
- Particle systems are performance-aware
- Mobile devices get reduced particle counts
- Shadows are optimized per scene
- DPR is dynamically adjusted

## Browser Support

- Modern browsers with WebGL support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

© 2025 TechCorp. All rights reserved.



