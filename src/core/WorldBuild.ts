import { createBuildController, type BuildController } from '../animation/build';
import { createRotationController, type RotationController } from '../animation/rotate';
import { WORLD_LAND_POINTS } from '../data/world-land-points';
import { createParticlesFromLandTuples } from '../particles/create-particles';
import { DEFAULT_GLOBE_RADIUS } from '../particles/globe-radius';
import { ParticlePoints } from '../particles/ParticlePoints';
import { ThreeRenderer } from '../renderer/ThreeRenderer';
import type { ResolvedWorldBuildOptions, WorldBuildOptions } from './types';

const DEFAULT_BUILD_DURATION_MS = 8000;
const DEFAULT_PARTICLE_DENSITY = 1;
/** Multiplier for world-space point size (see ParticlePoints). */
const DEFAULT_PARTICLE_SIZE = 1;
const DEFAULT_PARTICLE_COLOR = '#c8e6ff';
const DEFAULT_PARTICLE_OPACITY = 0.92;
const DEFAULT_ROTATION_DURATION_MS = 22000;

function resolveOptions(options: WorldBuildOptions): ResolvedWorldBuildOptions {
  return {
    container: options.container,
    build: {
      direction: options.build?.direction ?? 'south-to-north',
      duration: options.build?.duration ?? DEFAULT_BUILD_DURATION_MS,
    },
    particles: {
      density: options.particles?.density ?? DEFAULT_PARTICLE_DENSITY,
      size: options.particles?.size ?? DEFAULT_PARTICLE_SIZE,
      color: options.particles?.color ?? DEFAULT_PARTICLE_COLOR,
      opacity: options.particles?.opacity ?? DEFAULT_PARTICLE_OPACITY,
    },
    rotation: {
      enabled: options.rotation?.enabled ?? true,
      duration: options.rotation?.duration ?? DEFAULT_ROTATION_DURATION_MS,
      direction: options.rotation?.direction ?? 'clockwise',
    },
    globe: {
      radius: options.globe?.radius ?? DEFAULT_GLOBE_RADIUS,
    },
  };
}

export class WorldBuild {
  private readonly options: ResolvedWorldBuildOptions;
  private readonly renderer: ThreeRenderer;
  private readonly buildController: BuildController;
  private readonly rotationController: RotationController;
  private readonly particles: ReturnType<typeof createParticlesFromLandTuples>;
  private readonly particlePoints: ParticlePoints;
  private destroyed = false;

  constructor(options: WorldBuildOptions) {
    if (!options.container) {
      throw new Error('WorldBuild requires a container HTMLElement');
    }
    this.options = resolveOptions(options);
    this.renderer = new ThreeRenderer(this.options.container);
    this.buildController = createBuildController(this.options.build);
    this.rotationController = createRotationController(this.options.rotation);
    this.renderer.initialize();

    this.particles = createParticlesFromLandTuples(WORLD_LAND_POINTS, this.options.globe.radius, {
      size: this.options.particles.size,
      opacity: this.options.particles.opacity,
      color: this.options.particles.color,
    });
    this.particlePoints = new ParticlePoints(this.particles, {
      size: this.options.particles.size,
      globeRadius: this.options.globe.radius,
      color: this.options.particles.color,
      opacity: this.options.particles.opacity,
    });
    this.renderer.setParticlePoints(this.particlePoints.object);
    this.renderer.frameGlobe(this.options.globe.radius);
    this.renderer.setFrameCallback((deltaMilliseconds) => {
      this.particlePoints.object.rotation.y = this.rotationController.advance(deltaMilliseconds);
    });
    this.renderer.render();

    if (this.options.rotation.enabled) {
      this.play();
    }
  }

  /** Prepare or run the construction sequence (not yet implemented). */
  build(): void {
    this.assertAlive();
    this.buildController.start();
  }

  /** Resume animation playback (not yet implemented). */
  play(): void {
    this.assertAlive();
    this.rotationController.start();
    this.renderer.startRenderLoop();
  }

  /** Pause animation playback (not yet implemented). */
  pause(): void {
    this.assertAlive();
    this.buildController.stop();
    this.rotationController.stop();
    this.renderer.stopRenderLoop();
  }

  /** Reset animation state (not yet implemented). */
  reset(): void {
    this.assertAlive();
    this.buildController.reset();
  }

  /** Reset and play from the beginning (not yet implemented). */
  replay(): void {
    this.assertAlive();
    this.reset();
    this.build();
    this.play();
  }

  /** Resize the renderer to match the container. */
  resize(): void {
    this.assertAlive();
    this.renderer.resize();
    this.renderer.render();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.pause();
    this.particlePoints.dispose();
    this.renderer.destroy();
    this.destroyed = true;
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new Error('WorldBuild instance has been destroyed');
    }
  }
}
