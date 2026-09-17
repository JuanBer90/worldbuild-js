# WorldBuild

A configurable 3D animation engine for constructing the world from particles.

**This project is under active development.** The public API is being shaped; most visualization and animation behavior is not implemented yet.

## Concept

WorldBuild will turn real geographic data into a particle-based 3D globe: sample land from GeoJSON/TopoJSON, map coordinates to a sphere, render particles, animate construction (initially south-to-north), and optionally rotate the globe—all on a transparent canvas so the host page controls the background.

## Installation

```bash
npm install worldbuild-js
```

*(Not published yet.)*

## Development

Requires Node.js 24 LTS (`>=24 <25`).

Land particles are generated from [Natural Earth 1:110m Land](https://www.naturalearthdata.com/) (`data/source/world-land.geojson`). After updating that file, regenerate the runtime dataset:

```bash
npm run generate:data
```

```bash
npm install
npm run dev        # playground
npm run build      # library bundle + types
npm run test
npm run lint
npm run format
npm run typecheck
```

## API (sketch)

```ts
import { WorldBuild } from 'worldbuild-js';

const world = new WorldBuild({
  container: document.getElementById('globe')!,
  build: { direction: 'south-to-north', duration: 8000 },
  particles: { density: 1, size: 1, color: '#ffffff', opacity: 1 },
  rotation: { enabled: true, duration: 30000, direction: 'clockwise' },
});

world.build();
world.play();
// world.pause();
// world.reset();
// world.replay();
// world.destroy();
```

Construction and rotation animations are **not implemented** yet. The library renders a static particle Earth from the generated land dataset.

## Current status

- Project tooling (TypeScript, Vite library mode, Vitest, ESLint, Prettier)
- Renderer abstraction with a transparent Three.js canvas
- ~5,000 land particles from Natural Earth 1:110m (generated via `npm run generate:data`)
- Geographic `lat`/`lon` → Cartesian conversion (tested)
- Placeholder modules for build and rotation animation

## Intended V1

- Real geographic land data
- Particle-based continents
- South-to-north construction animation
- Configurable appearance and timing
- Transparent background (host-controlled)
- Continuous globe rotation

## License

MIT — see [LICENSE](./LICENSE).
