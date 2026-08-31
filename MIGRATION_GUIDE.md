# Migration Guide - Refactoring Other Pages

Use this guide to refactor HomePage, ProCounselPage, and TheMindSoulPage following the AiBricks pattern.

## Step-by-Step Process

### Step 1: Create Folder Structure

```bash
# For each page, create this structure:
mkdir -p src/pages/PageName/{components,hooks}
touch src/pages/PageName/index.jsx
touch src/pages/PageName/PageNameScene.jsx
touch src/pages/PageName/colors.js
touch src/pages/PageName/README.md
touch src/pages/PageName/components/index.js
```

### Step 2: Extract Colors

1. Open the old scene file
2. Find all color strings (e.g., `'#ff0000'`, `'#rgb(...)'`)
3. Create constants in `colors.js`:

```javascript
// colors.js template
export const colors = {
  // Organize by category
  background: '#000000',
  primary: '#ff0000',
  // ... add all colors
};

export default colors;
```

### Step 3: Identify Components

Look for patterns in the scene file:
- Self-contained groups
- Repeated elements
- Animated objects
- Environmental elements

Example identifiers:
```javascript
// If you see:
function SomeElement() { ... }
// Or:
<group ref={someRef}>
  <mesh>...</mesh>
  <mesh>...</mesh>
</group>

// → Extract to separate component
```

### Step 4: Extract Components

For each component:

1. Create file: `components/ComponentName.jsx`
2. Move JSX and logic
3. Import necessary dependencies
4. Import colors from `../colors`
5. Add JSDoc comments

```javascript
// components/ComponentName.jsx template
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import colors from '../colors';

/**
 * ComponentName - Brief description
 * @param {Object} props - Component props
 */
export function ComponentName({ position, ...props }) {
  const ref = useRef();
  
  useFrame((state) => {
    // Animation logic
  });
  
  return (
    <group ref={ref} position={position}>
      {/* JSX */}
    </group>
  );
}
```

### Step 5: Extract Hooks

Look for complex useFrame logic or reusable state management:

```javascript
// hooks/useComponentAnimation.js template
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Custom hook for component animation
 * @param {Object} scroll - Scroll object
 * @param {Object} ref - Component ref
 */
export const useComponentAnimation = (scroll, ref) => {
  const { camera } = useThree();
  
  useFrame((state) => {
    // Animation logic
  });
};
```

### Step 6: Create Scene File

Compose all components:

```javascript
// PageNameScene.jsx template
import React, { useRef, useMemo } from 'react';
import { useScroll } from '@react-three/drei';
import { useComponentAnimation } from './hooks/useComponentAnimation';
import { Component1, Component2 } from './components';
import colors from './colors';

export default function PageNameScene() {
  const scroll = useScroll();
  const groupRef = useRef();
  
  useComponentAnimation(scroll, groupRef);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      
      {/* Scene */}
      <group ref={groupRef}>
        <Component1 />
        <Component2 />
      </group>
    </>
  );
}
```

### Step 7: Create Page Component

```javascript
// index.jsx template
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageNameScene from './PageNameScene';
import colors from './colors';

export default function PageNamePage() {
  const { t } = useTranslation();
  
  return (
    <div className="relative w-full h-screen">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={[colors.background]} />
        <Suspense fallback={null}>
          <ScrollControls pages={3} damping={0.2}>
            <PageNameScene />
            {/* HTML overlay */}
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

### Step 8: Add Barrel Exports

```javascript
// components/index.js
export { Component1 } from './Component1';
export { Component2 } from './Component2';
// ... export all components
```

### Step 9: Update App.jsx

```javascript
// Before
import PageName from './pages/PageNamePage.jsx';

// After
import PageName from './pages/PageName/index.jsx';
// or
import PageName from './pages/PageName';
```

### Step 10: Documentation

Create `README.md`:
```markdown
# PageName

## Overview
Brief description of the page

## Components
- Component1: Description
- Component2: Description

## Colors
See colors.js for palette

## Usage
Import instructions
```

## Checklist Per Page

- [ ] Create folder structure
- [ ] Extract all colors to `colors.js`
- [ ] Identify all components
- [ ] Extract components to separate files
- [ ] Extract hooks if needed
- [ ] Create scene composition file
- [ ] Create page wrapper
- [ ] Add barrel exports
- [ ] Update App.jsx import
- [ ] Test all functionality
- [ ] Write README.md
- [ ] Clean up old files

## Common Patterns to Extract

### Pattern 1: Animated Mesh
```javascript
// Extract this:
const meshRef = useRef();
useFrame(() => {
  meshRef.current.rotation.y += 0.01;
});
return <mesh ref={meshRef}>...</mesh>

// To:
function RotatingMesh() { ... }
```

### Pattern 2: Particle Systems
```javascript
// Extract particles to:
components/ParticleSystem.jsx
```

### Pattern 3: Lighting Setup
```javascript
// Can stay in scene or extract to:
components/Lighting.jsx
```

### Pattern 4: Ground/Environment
```javascript
// Extract to:
components/Environment.jsx
```

## Utilities to Use

From `utils/animations.js`:
- `easeOutCubic(t)` - Smooth animations
- `smoothStep(t)` - Interpolation
- `easeOutElastic(t)` - Bounce effects

From `utils/math.js`:
- `lerp(start, end, t)` - Linear interpolation
- `clamp(value, min, max)` - Constrain values
- `mapRange(...)` - Map value ranges

## Testing After Migration

1. **Visual Check**
   - [ ] Scene renders correctly
   - [ ] Colors match original
   - [ ] Animations work

2. **Performance Check**
   - [ ] No frame drops
   - [ ] Smooth scrolling
   - [ ] Proper memory usage

3. **Code Quality Check**
   - [ ] No ESLint errors
   - [ ] No console warnings
   - [ ] All imports resolve

4. **Responsive Check**
   - [ ] Works on mobile
   - [ ] Works on tablet
   - [ ] Works on desktop

## Tips

1. **One component at a time** - Don't try to extract everything at once
2. **Test frequently** - Run the app after each extraction
3. **Keep colors consistent** - Use exact same hex values
4. **Preserve animations** - Make sure timing matches original
5. **Document as you go** - Add comments and JSDoc
6. **Use git** - Commit after each successful extraction

## Example: HomePage

HomePage has:
- Hero section with floating elements
- Particle effects
- Product cards
- Animated camera

Extract to:
```
pages/Home/
├── index.jsx
├── HomeScene.jsx
├── colors.js
├── components/
│   ├── FloatingElements.jsx
│   ├── ParticleField.jsx
│   ├── ProductCard.jsx
│   └── index.js
└── hooks/
    └── useCameraAnimation.js
```

## Need Help?

Refer to AiBricks implementation:
- `src/pages/AiBricks/` - Complete example
- `STRUCTURE.md` - Overall architecture
- `ARCHITECTURE.md` - Component hierarchy
- `REFACTORING_SUMMARY.md` - What was done

## Next Page Priority

1. **HomePage** - Most important, sets the tone
2. **ProCounselPage** - Legal services
3. **TheMindSoulPage** - Wellness/mental health

Good luck! 🚀
