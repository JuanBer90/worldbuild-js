import {
  createBuildController,
  createFromEdgesOrigins,
  type BuildController,
} from '../animation/build';
import { createRotationController, type RotationController } from '../animation/rotate';
import { WORLD_LAND_POINTS } from '../data/world-land-points';
import { createParticlesFromLandTuples } from '../particles/create-particles';
import { DEFAULT_GLOBE_RADIUS } from '../particles/globe-radius';
import { ParticlePoints } from '../particles/ParticlePoints';
import { validateParticleColor } from '../particles/particle-colors';
import {
  getCameraEyePosition,
  getGlobeFrameDistance,
  ThreeRenderer,
} from '../renderer/ThreeRenderer';
import type { ColorDistribution, ResolvedWorldBuildOptions, WorldBuildOptions } from './types';

const DEFAULT_BUILD_DURATION_MS = 4000;
const DEFAULT_BUILD_RANDOMNESS = 0.12;
const DEFAULT_PARTICLE_DENSITY = 1;
/** Multiplier for world-space point size (see ParticlePoints). */
const DEFAULT_PARTICLE_SIZE = 1;
const DEFAULT_PARTICLE_COLOR = '#c8e6ff';
const DEFAULT_COLOR_DISTRIBUTION = 'random';
const DEFAULT_COLOR_SCALE = 0.25;
const DEFAULT_PARTICLE_OPACITY = 0.92;
const DEFAULT_ROTATION_DURATION_MS = 22000;
const DEFAULT_CAMERA_LATITUDE = 0;
const DEFAULT_CAMERA_LONGITUDE = 0;

export function resolveWorldBuildOptions(options: WorldBuildOptions): ResolvedWorldBuildOptions {
  const cameraLatitude = options.camera?.latitude ?? DEFAULT_CAMERA_LATITUDE;
  if (!Number.isFinite(cameraLatitude) || cameraLatitude < -90 || cameraLatitude > 90) {
    throw new RangeError('camera.latitude must be a finite number between -90 and 90 degrees');
  }
  const cameraLongitude = options.camera?.longitude ?? DEFAULT_CAMERA_LONGITUDE;
  if (!Number.isFinite(cameraLongitude) || cameraLongitude < -180 || cameraLongitude > 180) {
    throw new RangeError('camera.longitude must be a finite number between -180 and 180 degrees');
  }
  const particleColors = options.particles?.colors ?? [];
  if (!Array.isArray(particleColors)) {
    throw new TypeError('particles.colors must be an array of color strings');
  }
  particleColors.forEach((color, index) => validateParticleColor(color, `particles.colors[${index}]`));
  let colorDistribution: ColorDistribution = DEFAULT_COLOR_DISTRIBUTION;
  let colorScale = DEFAULT_COLOR_SCALE;
  if (particleColors.length > 0) {
    colorDistribution = options.particles?.colorDistribution ?? DEFAULT_COLOR_DISTRIBUTION;
    if (colorDistribution !== 'random' && colorDistribution !== 'spatial' && colorDistribution !== 'continent') {
      throw new RangeError('particles.colorDistribution must be "random", "spatial", or "continent"');
    }
    colorScale = options.particles?.colorScale ?? DEFAULT_COLOR_SCALE;
    if (!Number.isFinite(colorScale) || colorScale <= 0 || colorScale > 1) {
      throw new RangeError('particles.colorScale must be a finite number greater than 0 and at most 1');
    }
  }

  return {
    container: options.container,
    build: {
      enabled: options.build?.enabled ?? true,
      animation: options.build?.animation ?? 'south-to-north',
      direction: options.build?.direction ?? 'south-to-north',
      duration: options.build?.duration ?? DEFAULT_BUILD_DURATION_MS,
      randomness: options.build?.randomness ?? DEFAULT_BUILD_RANDOMNESS,
    },
    particles: {
      density: options.particles?.density ?? DEFAULT_PARTICLE_DENSITY,
      size: options.particles?.size ?? DEFAULT_PARTICLE_SIZE,
      color: options.particles?.color ?? DEFAULT_PARTICLE_COLOR,
      colors: [...particleColors],
      colorDistribution,
      colorScale,
      opacity: options.particles?.opacity ?? DEFAULT_PARTICLE_OPACITY,
    },
    rotation: {
      enabled: options.rotation?.enabled ?? true,
      duration: options.rotation?.duration ?? DEFAULT_ROTATION_DURATION_MS,
      direction: options.rotation?.direction ?? 'clockwise',
    },
    globe: {
      radius: options.globe?.radius ?? DEFAULT_GLOBE_RADIUS,
      hideBackside: options.globe?.hideBackside ?? true,
    },
    camera: {
      latitude: cameraLatitude,
      longitude: cameraLongitude,
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
    this.options = resolveWorldBuildOptions(options);
    this.renderer = new ThreeRenderer(this.options.container, this.options.camera);
    this.buildController = createBuildController(this.options.build);
    this.rotationController = createRotationController(this.options.rotation);
    this.renderer.initialize();

    this.particles = createParticlesFromLandTuples(WORLD_LAND_POINTS, this.options.globe.radius, {
      size: this.options.particles.size,
      opacity: this.options.particles.opacity,
      color: this.options.particles.color,
    });
    const cameraDistance = getGlobeFrameDistance(this.options.globe.radius);
    const buildOrigins = createFromEdgesOrigins(
      this.particles.length,
      getCameraEyePosition(
        this.options.camera.latitude,
        this.options.camera.longitude,
        cameraDistance,
      ),
      this.options.globe.radius,
    );
    this.particlePoints = new ParticlePoints(this.particles, {
      size: this.options.particles.size,
      globeRadius: this.options.globe.radius,
      color: this.options.particles.color,
      colors: this.options.particles.colors,
      colorDistribution: this.options.particles.colorDistribution,
      colorScale: this.options.particles.colorScale,
      opacity: this.options.particles.opacity,
      hideBackside: this.options.globe.hideBackside,
      build: this.options.build,
      buildOrigins,
    });
    this.renderer.setParticlePoints(this.particlePoints.object);
    this.renderer.frameGlobe(this.options.globe.radius);
    this.renderer.setFrameCallback((deltaMilliseconds) => {
      const buildWasComplete = this.buildController.isComplete();
      this.particlePoints.setBuildProgress(this.buildController.advance(deltaMilliseconds));

      if (!buildWasComplete && this.buildController.isComplete() && this.options.rotation.enabled) {
        this.rotationController.start();
      }
      if (buildWasComplete) {
        this.particlePoints.object.rotation.y = this.rotationController.advance(deltaMilliseconds);
      }
    });
    this.renderer.render();

    if (this.options.build.enabled) {
      this.build();
    } else if (this.options.rotation.enabled) {
      this.play();
    }
  }

  /** Start or resume the construction sequence. */
  build(): void {
    this.assertAlive();
    if (this.buildController.isComplete()) {
      return;
    }
    this.rotationController.stop();
    this.buildController.start();
    this.renderer.startRenderLoop();
  }

  /** Resume construction, or rotation after construction has completed. */
  play(): void {
    this.assertAlive();
    if (this.buildController.isComplete()) {
      this.rotationController.start();
    } else {
      this.buildController.start();
    }
    this.renderer.startRenderLoop();
  }

  /** Pause construction or rotation without changing their current progress. */
  pause(): void {
    this.assertAlive();
    this.buildController.stop();
    this.rotationController.stop();
    this.renderer.stopRenderLoop();
  }

  /** Reset construction visibility and rotation back to their initial state. */
  reset(): void {
    this.assertAlive();
    this.buildController.reset();
    this.rotationController.reset();
    this.renderer.stopRenderLoop();
    this.particlePoints.setBuildProgress(this.buildController.getProgress());
    this.particlePoints.object.rotation.y = 0;
    this.renderer.render();
  }

  /** Reset and replay construction before restarting rotation. */
  replay(): void {
    this.assertAlive();
    this.reset();
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
