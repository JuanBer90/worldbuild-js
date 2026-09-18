# WorldBuild

WorldBuild renders a transparent, particle-based 3D Earth from the bundled Natural Earth land dataset. It constructs the globe, then optionally rotates it around its geographic Y axis.

## Installation

```bash
npm install worldbuild-js three
```

## Quick start

Create a container with a non-zero size, then pass it to `WorldBuild`.

```html
<div id="globe" style="width: 640px; height: 640px;"></div>
```

```ts
import { WorldBuild } from 'worldbuild-js';

const world = new WorldBuild({
  container: document.getElementById('globe')!,
});
```

The constructor adds a transparent canvas to the container and starts the default construction sequence automatically. The default sequence builds land particles from south to north, pauses briefly, then begins a clockwise rotation.

## Configuration

```ts
const world = new WorldBuild({
  container: document.getElementById('globe')!,
  build: {
    enabled: true,
    animation: 'from-edges',
    direction: 'south-to-north',
    duration: 4000,
    randomness: 0.12,
  },
  particles: {
    density: 1,
    size: 1,
    color: '#c8e6ff',
    colors: ['#FF4057', '#22E68A', '#35A7FF'],
    opacity: 0.92,
  },
  rotation: {
    enabled: true,
    duration: 22000,
    direction: 'clockwise',
  },
  globe: {
    radius: 1,
    hideBackside: true,
  },
  camera: {
    latitude: 0,
    longitude: 0,
  },
});
```

### `build`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Runs the construction sequence before rotation. Set to `false` to render the complete globe immediately. |
| `animation` | `'south-to-north' \| 'from-edges'` | `'south-to-north'` | Construction animation. `south-to-north` reveals particles by latitude. `from-edges` brings particles from deterministic camera-relative perimeter origins to their geographic positions. |
| `direction` | `'south-to-north' \| 'north-to-south'` | `'south-to-north'` | Direction option. The latitude animation currently supports only `'south-to-north'`; using `'north-to-south'` with `animation: 'south-to-north'` throws. It does not affect `from-edges`. |
| `duration` | `number` | `4000` | Construction duration in milliseconds. Must be a positive finite number. |
| `randomness` | `number` | `0.12` | Deterministic per-particle timing variation from `0` through `1`. |

### `particles`

Single-color particles use `color`:

```ts
particles: {
  color: '#ffffff',
}
```

Use a palette for deterministic mixed particle colors:

```ts
particles: {
  colors: ['#FF4057', '#22E68A', '#35A7FF'],
}
```

A non-empty `colors` palette takes precedence over `color`.

Palette colors are independently mixed by default. Use spatial distribution to group nearby geographic particles into discrete, organic color regions:

```ts
particles: {
  colors: ['#FF4057', '#FF9D32', '#F6D83B', '#22E68A', '#1EDBE5', '#35A7FF', '#9A4DFF'],
  colorDistribution: 'spatial',
  colorScale: 0.25,
}
```

`colorScale` applies only to `spatial`: smaller values create larger regions, while larger values create smaller, more frequent regions.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `density` | `number` | `1` | Accepted public option; the bundled 5,000-point land dataset is currently rendered at its fixed density. |
| `size` | `number` | `1` | Multiplier for particle diameter. |
| `color` | `string` | `'#c8e6ff'` | Particle color accepted by Three.js `Color`. |
| `colors` | `string[]` | `[]` | Optional palette of Three.js-compatible colors. A non-empty palette takes precedence over `color`; particles receive stable, deterministically mixed palette colors. |
| `colorDistribution` | `'random' \| 'spatial'` | `'random'` | Palette assignment strategy. `random` deterministically mixes colors per particle; `spatial` groups nearby geographic particles into organic regions. |
| `colorScale` | `number` | `0.25` | Spatial-region scale from greater than `0` through `1`. Smaller values create larger regions; larger values create smaller regions. Ignored without a palette or when `colorDistribution` is `random`. |
| `opacity` | `number` | `0.92` | Particle opacity. |

### `rotation`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enables continuous rotation after construction completes. |
| `duration` | `number` | `22000` | Milliseconds per complete revolution. |
| `direction` | `'clockwise' \| 'counterclockwise'` | `'clockwise'` | Rotation direction when viewed from above the North Pole. |

### `globe`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | `number` | `1` | Globe radius in world units. |
| `hideBackside` | `boolean` | `true` | Hides particles on the hemisphere facing away from the camera. Set to `false` for a transparent, x-ray view of both hemispheres. |

### `camera`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `latitude` | `number` | `0` | Observer latitude in degrees, from `-90` through `90`. `0` is an equatorial outside view; positive values move toward the north and negative values toward the south. |
| `longitude` | `number` | `0` | Observer longitude in degrees, from `-180` through `180`. `0` centers the 0° meridian; positive values use east-positive geographic longitude. |

## Instance methods

| Method | Description |
| --- | --- |
| `build()` | Starts or resumes construction. Has no effect after construction is complete. |
| `play()` | Resumes construction when incomplete, or rotation when complete. |
| `pause()` | Pauses construction or rotation without resetting progress. |
| `reset()` | Resets construction visibility and rotation to their initial state, then renders that state without starting the loop. |
| `replay()` | Resets and starts the construction sequence again. |
| `resize()` | Resizes the canvas to the current container dimensions and renders once. Call after changing container size when it is not otherwise managed. |
| `destroy()` | Stops rendering, disposes render resources, and removes the canvas from its container. |

## Development

Requires Node.js 24 LTS (`>=24 <25`). The bundled land data is generated from [Natural Earth 1:110m Land](https://www.naturalearthdata.com/) (`data/source/world-land.geojson`). After changing that source file, regenerate the runtime dataset:

```bash
npm run generate:data
```

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## License

MIT — see [LICENSE](./LICENSE).
