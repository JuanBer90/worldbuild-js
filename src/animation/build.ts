import type { ResolvedBuildOptions } from '../core/types';

export const BUILD_REVEAL_SPAN = 0.14;
export const BUILD_SETTLE_DURATION_MS = 500;

export type BuildPhase = 'idle' | 'building' | 'settling' | 'complete';

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

/** Controls one global GPU build-progress uniform without per-particle animation work. */
export function createBuildController(options: ResolvedBuildOptions): BuildController {
  if (options.direction !== 'south-to-north') {
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
  let settleElapsed = 0;

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
      settleElapsed = 0;
    },
    advance(deltaMilliseconds: number) {
      if (!running || !Number.isFinite(deltaMilliseconds) || deltaMilliseconds <= 0) {
        return progress;
      }

      let remaining = deltaMilliseconds;
      if (phase === 'building') {
        const remainingBuildTime = (1 - progress) * options.duration;
        const buildStep = Math.min(remaining, remainingBuildTime);
        progress = Math.min(1, progress + buildStep / options.duration);
        remaining -= buildStep;
        if (progress === 1) {
          phase = 'settling';
        }
      }

      if (phase === 'settling' && remaining > 0) {
        const settleStep = Math.min(remaining, BUILD_SETTLE_DURATION_MS - settleElapsed);
        settleElapsed += settleStep;
        if (settleElapsed >= BUILD_SETTLE_DURATION_MS) {
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

function deterministicUnit(index: number): number {
  let value = index >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
