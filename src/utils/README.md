# Utilities

Common utility functions used across the application.

## Files

### `animations.js`
Easing and animation helper functions:
- `easeOutCubic(t)` - Smooth ease-out
- `easeInOutCubic(t)` - Smooth ease-in-out
- `easeInCubic(t)` - Smooth ease-in
- `smoothStep(t)` - Smoothstep interpolation
- `easeOutElastic(t)` - Elastic bounce effect
- `easeOutBack(t)` - Overshoot effect

### `math.js`
Mathematical utility functions:
- `clamp(value, min, max)` - Clamp value between min and max
- `lerp(start, end, t)` - Linear interpolation
- `mapRange(value, inMin, inMax, outMin, outMax)` - Map value from one range to another
- `randomRange(min, max)` - Random float between min and max
- `randomInt(min, max)` - Random integer between min and max
- `degToRad(degrees)` - Convert degrees to radians
- `radToDeg(radians)` - Convert radians to degrees

## Usage

```javascript
import { easeOutCubic, smoothStep } from '../utils/animations';
import { clamp, lerp, mapRange } from '../utils/math';

// Animation
const progress = easeOutCubic(0.5); // 0.875

// Math
const clamped = clamp(150, 0, 100); // 100
const interpolated = lerp(0, 10, 0.5); // 5
const mapped = mapRange(5, 0, 10, 0, 100); // 50
```

## Adding New Utilities

1. Add function to appropriate file
2. Export the function
3. Add JSDoc comments
4. Update this README
