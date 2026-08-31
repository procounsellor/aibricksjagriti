# AiBricks Page Architecture

## Component Hierarchy

```
AiBricksPage (index.jsx)
│
├── Canvas (React Three Fiber)
│   │
│   └── AiBricksScene
│       │
│       ├── Lighting
│       │   ├── ambientLight
│       │   ├── directionalLight (Sun)
│       │   ├── pointLight × 3 (Fill lights)
│       │   └── hemisphereLight
│       │
│       ├── Buildings Group
│       │   ├── Building (Skyscraper @ center)
│       │   │   ├── Foundation
│       │   │   └── BuildingFloor × 30
│       │   │       ├── Floor structure
│       │   │       ├── Windows
│       │   │       ├── Scaffolding
│       │   │       └── Concrete pour effect
│       │   │
│       │   ├── Building (Apartment × 3)
│       │   └── Building (House × 2)
│       │
│       ├── Construction Equipment
│       │   ├── ConstructionCrane × 2
│       │   │   ├── Tower
│       │   │   ├── Arm
│       │   │   ├── Counterweight
│       │   │   └── Hook (animated)
│       │   │
│       │   └── ConstructionDust (Particles)
│       │
│       ├── Environment
│       │   ├── Landscape
│       │   │   ├── Grass patches
│       │   │   └── Dirt patches
│       │   │
│       │   ├── Road
│       │   │   ├── Asphalt
│       │   │   ├── Lane markings (animated)
│       │   │   └── Sidewalks
│       │   │
│       │   └── Tree × 10
│       │       ├── Trunk
│       │       └── Foliage layers × 3
│       │
│       ├── Vehicles
│       │   └── Car × 4 (animated)
│       │       ├── Body
│       │       ├── Windows (glass)
│       │       └── Wheels × 4
│       │
│       ├── Wildlife
│       │   └── Bird × 5 (animated)
│       │       ├── Body
│       │       └── Wings × 2 (flapping)
│       │
│       ├── Atmosphere
│       │   ├── Fog
│       │   └── Cloud × 3
│       │
│       └── Ground Plane
│
└── HTML Overlay (Framer Motion)
    ├── Hero Section
    ├── Feature 1
    ├── Feature 2
    ├── Feature 3 (Sustainability)
    └── Final Section
```

## Data Flow

```
User Scroll
    ↓
ScrollControls (drei)
    ↓
useScroll hook
    ↓
┌─────────────────┐
│ AiBricksScene   │
└─────────────────┘
    ↓
┌─────────────────────────────┐
│ useCameraAnimation          │
│ - Calculates target position│
│ - Smooth lerp animation     │
│ - Mouse parallax            │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Building Components         │
│ - Calculate scroll progress │
│ - Phase-based animation:    │
│   1. Foundation             │
│   2. Structure              │
│   3. Finishing              │
│ - Update materials/opacity  │
└─────────────────────────────┘
    ↓
Three.js Renderer
    ↓
Screen Display
```

## Animation Timeline

```
Scroll: 0% ──────────────────────────────────────────────── 100%
        │                                                      │
        │ Skyscraper (0-40%)                                  │
        ├──────────────────┤                                  │
        │                                                      │
        │   Apartment 1 (15-50%)                              │
        │   ├────────────────────┤                            │
        │                                                      │
        │     Apartment 2 (20-55%)                            │
        │     ├─────────────────────┤                         │
        │                                                      │
        │       House 1 (30-60%)                              │
        │       ├──────────────────┤                          │
        │                                                      │
        │         House 2 (35-65%)                            │
        │         ├──────────────────┤                        │
        │                                                      │
        │           Apartment 3 (40-70%)                      │
        │           ├────────────────────┤                    │
        │                                                      │
        │             Skyscraper 2 (50-90%)                   │
        │             ├──────────────────────────────────┤    │
        │                                                      │
Camera: Near/Low                                        Far/High
        │                                                      │
        Z: 35, Y: 20                                    Z: 25, Y: 32
```

## State Management

```
┌─────────────────────────┐
│ AiBricksScene           │
│                         │
│ State:                  │
│ - groupRef (scene)      │
│ - buildings (useMemo)   │
│                         │
│ Props from:             │
│ - useScroll()           │
│ - useThree()            │
└─────────────────────────┘
          │
          ├───────────────────────────────┐
          │                               │
┌─────────▼──────────┐         ┌─────────▼──────────┐
│ Building            │         │ useCameraAnimation  │
│                     │         │                     │
│ State:              │         │ Controls:           │
│ - None (stateless)  │         │ - camera.position   │
│                     │         │ - camera.lookAt     │
│ Props:              │         │ - groupRef.rotation │
│ - position          │         └─────────────────────┘
│ - type              │
│ - floors            │
│ - scroll            │
│ - startScroll       │
│ - endScroll         │
└─────────────────────┘
          │
          │
┌─────────▼──────────┐
│ BuildingFloor       │
│                     │
│ Refs:               │
│ - meshRef           │
│ - groupRef          │
│ - windowRefs[]      │
│ - scaffoldingRef    │
│ - concreteRef       │
│                     │
│ Animation:          │
│ - useFrame()        │
│ - Phase calculation │
│ - Material updates  │
└─────────────────────┘
```

## File Dependencies

```
index.jsx
  ├─→ AiBricksScene.jsx
  │     ├─→ hooks/useCameraAnimation.js
  │     │     └─→ @react-three/fiber
  │     │
  │     ├─→ components/Building.jsx
  │     │     ├─→ components/BuildingFloor.jsx
  │     │     │     └─→ utils/animations.js
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/ConstructionCrane.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/Tree.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/Car.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/Bird.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/ConstructionDust.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/Road.jsx
  │     │     └─→ colors.js
  │     │
  │     ├─→ components/Landscape.jsx
  │     │     └─→ colors.js
  │     │
  │     └─→ colors.js
  │
  └─→ @react-three/fiber
      └─→ @react-three/drei
```

## Color Categories

```
colors.js (40+ constants)
├── Sky & Atmosphere (3)
│   ├── sky
│   ├── fog
│   └── cloudWhite
│
├── Lighting (5)
│   ├── sunLight
│   ├── ambientFill
│   ├── warmFill
│   ├── coolFill
│   └── hemisphereGround
│
├── Buildings (8)
│   ├── skyscraperBase
│   ├── apartmentBase
│   ├── houseBase
│   ├── concrete
│   ├── floorEdge
│   ├── foundation
│   ├── roofWood
│   └── roofShingle
│
├── Windows (3)
│   ├── windowGlass
│   ├── windowGlassEmissive
│   └── carWindowGlass
│
├── Construction (6)
│   ├── scaffolding
│   ├── craneOrange
│   ├── craneBright
│   ├── craneWeight
│   ├── craneCable
│   └── constructionDust
│
├── Environment (7)
│   ├── treeTrunk
│   ├── treeFoliageDark
│   ├── treeFoliageMid
│   ├── treeFoliageLight
│   ├── grassDark
│   ├── grassLight
│   └── groundBase
│
├── Roads (5)
│   ├── roadAsphalt
│   ├── roadLine
│   ├── roadLineEmissive
│   ├── sidewalk
│   ├── dirtPatch1
│   └── dirtPatch2
│
└── Vehicles & Wildlife (6)
    ├── carRed
    ├── carBlue
    ├── carGreen
    ├── carOrange
    ├── carTire
    ├── birdBody
    └── birdWing
```
