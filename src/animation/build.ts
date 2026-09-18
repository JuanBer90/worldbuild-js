import type { ResolvedBuildOptions } from '../core/types.js';
import type { Vector3 } from '../geography/coordinates.js';

export const BUILD_REVEAL_SPAN = 0.14;

export type BuildPhase = 'idle' | 'building' | 'complete';

export interface BuildController {
  start(): void;
  stop(): void;
  reset(): void;
  advance(deltaMilliseconds: number): number;
  getProgress(): number;
  isComplete(): boolean;
}

/**
 * Creates stable south-to-north reveal start points for GPU particle attributes.
 * Each index receives the same signed offset for a given build configuration.
 */
export function createBuildStartProgress(
  latitude: number,
  particleIndex: number,
  randomness: number,
): number {
  const latitudeProgress = clamp((latitude + 90) / 180, 0, 1);
  const organicOffset = (deterministicUnit(particleIndex) * 2 - 1) * randomness;
  return clamp(latitudeProgress + organicOffset, 0, 1) * (1 - BUILD_REVEAL_SPAN);
}

/** Creates stable reveal timing for particles arriving from camera-relative edges. */
export function createFromEdgesStartProgress(particleIndex: number, randomness: number): number {
  const baseOrder = deterministicUnit(particleIndex, 0x9e3779b9);
  const organicOffset = (deterministicUnit(particleIndex, 0x85ebca6b) * 2 - 1) * randomness;
  return clamp(baseOrder + organicOffset, 0, 1) * (1 - BUILD_REVEAL_SPAN);
}

/**
 * Creates deterministic origin positions in the active camera's view plane.
 * Origins lie beyond the globe and viewport perimeter, distributed around an
 * organic ring rather than fixed edge lines.
 */
export function createFromEdgesOrigins(
  particleCount: number,
  cameraPosition: Vector3,
  globeRadius: number,
): Float32Array {
  const origins = new Float32Array(particleCount * 3);
  const forward = normalize({
    x: -cameraPosition.x,
    y: -cameraPosition.y,
    z: -cameraPosition.z,
  });
  const preferredUp = Math.abs(forward.y) > 0.99 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(forward, preferredUp));
  const up = normalize(cross(right, forward));

  for (let index = 0; index < particleCount; index++) {
    const angle = deterministicUnit(index, 0xc2b2ae35) * Math.PI * 2;
    const perimeterRadius = globeRadius * (1.3 + deterministicUnit(index, 0x27d4eb2f) * 0.45);
    const horizontal = Math.cos(angle) * perimeterRadius;
    const vertical = Math.sin(angle) * perimeterRadius;
    const offset = index * 3;

    origins[offset] = right.x * horizontal + up.x * vertical;
    origins[offset + 1] = right.y * horizontal + up.y * vertical;
    origins[offset + 2] = right.z * horizontal + up.z * vertical;
  }

  return origins;
}

/** Controls one global GPU build-progress uniform without per-particle animation work. */
export function createBuildController(options: ResolvedBuildOptions): BuildController {
  if (options.animation === 'south-to-north' && options.direction !== 'south-to-north') {
    throw new Error('Only build.direction "south-to-north" is currently supported');
  }
  if (!Number.isFinite(options.duration) || options.duration <= 0) {
    throw new RangeError('build.duration must be a positive finite number of milliseconds');
  }
  if (!Number.isFinite(options.randomness) || options.randomness < 0 || options.randomness > 1) {
    throw new RangeError('build.randomness must be a finite number between 0 and 1');
  }

  let phase: BuildPhase = options.enabled ? 'idle' : 'complete';
  let progress = options.enabled ? 0 : 1;
  let running = false;

  return {
    start() {
      if (phase !== 'complete') {
        running = true;
        if (phase === 'idle') {
          phase = 'building';
        }
      }
    },
    stop() {
      running = false;
    },
    reset() {
      phase = options.enabled ? 'idle' : 'complete';
      progress = options.enabled ? 0 : 1;
      running = false;
    },
    advance(deltaMilliseconds: number) {
      if (!running || !Number.isFinite(deltaMilliseconds) || deltaMilliseconds <= 0) {
        return progress;
      }

      if (phase === 'building') {
        const remainingBuildTime = (1 - progress) * options.duration;
        const buildStep = Math.min(deltaMilliseconds, remainingBuildTime);
        progress = Math.min(1, progress + buildStep / options.duration);
        if (progress === 1) {
          phase = 'complete';
          running = false;
        }
      }

      return progress;
    },
    getProgress() {
      return progress;
    },
    isComplete() {
      return phase === 'complete';
    },
  };
}

function deterministicUnit(index: number, seed = 0): number {
  let value = (index ^ seed) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(vector: Vector3): Vector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}
