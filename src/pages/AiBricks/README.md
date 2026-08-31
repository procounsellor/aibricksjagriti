# AiBricks Page - Living Data City

This folder contains all the code for the AiBricks page: a finished, living
city that moves through a full day-to-night cycle as the user scrolls, while
glowing data streams flow between the homes and a central AI core - a mood
piece showing the AI quietly matching buyers to homes.

## Folder Structure

```
AiBricks/
├── index.jsx                    # Main page component with Canvas and UI
├── AiBricksScene.jsx            # 3D scene composition
├── cityLayout.js                # Static building layout + AI core position
├── timeOfDay.js                 # Keyframed day-night palettes + shared cityState
├── colors.js                    # Color palette constants
├── components/                  # 3D components
│   ├── TimeOfDayController.jsx  # Scroll -> time-of-day; owns all scene lights
│   ├── SkyEffects.jsx           # Stars, sun/moon discs, procedural clouds
│   ├── AICore.jsx               # Central spire + orb landmark
│   ├── DataStreams.jsx          # Instanced stream dashes + match pulses
│   ├── Building.jsx             # Building type router
│   ├── BuildingFloor.jsx        # Instanced floors; windows lit by time of day
│   ├── Tree.jsx                 # Tree with trunk and foliage
│   ├── Car.jsx                  # Moving car (headlights brighten at night)
│   ├── Bird.jsx                 # Flying bird (daytime only)
│   ├── Road.jsx                 # Road with instanced lane markings
│   └── Landscape.jsx            # Grass and terrain
```

## How it works

- **Scroll = time of day.** `timeOfDay.js` holds 7 keyframed palettes
  (sunrise, morning, high day, golden dusk, sunset, twilight, deep night).
  `TimeOfDayController` samples the drei `useScroll` offset into the shared
  preallocated `cityState` object at useFrame priority -10; every other
  component reads from it at default priority. Zero per-frame allocations.
- **Windows** use per-instance colors on an unlit material; each window has a
  stable random threshold, so the city lights up in a staggered, organic way
  through dusk.
- **Data streams** are one InstancedMesh of glowing dashes moving along
  curves baked at module load (road lanes + arcs from the AI core to each
  neighborhood).
- **Match pulses**: every few seconds a brighter, faster dash surges from the
  core to a random building's rooftop; on arrival that building's windows
  flare (`cityState.matchGlow`, decayed by the controller) and a ring ripple
  expands at its base. Pools of 3 pulses / 3 ripples, all preallocated.

## Adding New Buildings

Edit the `BUILDINGS` array in `cityLayout.js`:
```javascript
export const BUILDINGS = [
  {
    type: 'skyscraper',  // 'skyscraper' | 'apartment' | 'house'
    pos: [0, 0, 0],      // [x, y, z] position
    floors: 30,          // number of floors
  },
  // Add more... (keep count <= MAX_BUILDINGS in timeOfDay.js)
];
```

## Performance

- Instancing everywhere repeated (floors, edges, windows, stream dashes,
  road markings) - the whole city renders in well under 250 draw calls
- 4 lights total: ambient + directional sun/moon + hemisphere + AI core point
- Delta-time everywhere; `prefers-reduced-motion` parks streams, pulses,
  cars, birds and the core's breathing (time of day stays scroll-driven)
- No CDN assets: stars, clouds, sun/moon and glow sprites are procedural
