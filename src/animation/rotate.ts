import type { ResolvedRotationOptions } from '../core/types';

export interface RotationController {
  start(): void;
  stop(): void;
}

/** Reserved for continuous globe rotation. */
export function createRotationController(_options: ResolvedRotationOptions): RotationController {
  return {
    start() {
      /* not implemented */
    },
    stop() {
      /* not implemented */
    },
  };
}
