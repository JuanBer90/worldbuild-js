import type { ResolvedRotationOptions } from '../core/types.js';

export const FULL_TURN_RADIANS = Math.PI * 2;

export interface RotationController {
  start(): void;
  stop(): void;
  reset(): void;
  /** Advance by elapsed milliseconds and return the absolute Y-axis angle in radians. */
  advance(deltaMilliseconds: number): number;
}

/**
 * Maintains a frame-rate-independent, constant-speed rotation angle. The angle
 * is wrapped at one full turn, which is visually identical to its starting pose.
 */
export function createRotationController(options: ResolvedRotationOptions): RotationController {
  if (!Number.isFinite(options.duration) || options.duration <= 0) {
    throw new RangeError('rotation.duration must be a positive finite number of milliseconds');
  }

  const direction = options.direction === 'clockwise' ? 1 : -1;
  const radiansPerMillisecond = (FULL_TURN_RADIANS / options.duration) * direction;
  let running = false;
  let angle = 0;

  return {
    start() {
      running = true;
    },
    stop() {
      running = false;
    },
    reset() {
      running = false;
      angle = 0;
    },
    advance(deltaMilliseconds: number) {
      if (!running || !Number.isFinite(deltaMilliseconds) || deltaMilliseconds <= 0) {
        return angle;
      }

      angle = positiveModulo(angle + radiansPerMillisecond * deltaMilliseconds, FULL_TURN_RADIANS);
      return angle;
    },
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
