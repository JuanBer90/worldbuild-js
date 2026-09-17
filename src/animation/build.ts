import type { ResolvedBuildOptions } from '../core/types';

export interface BuildController {
  start(): void;
  stop(): void;
  reset(): void;
}

/** Reserved for south-to-north (and other) construction animation. */
export function createBuildController(_options: ResolvedBuildOptions): BuildController {
  return {
    start() {
      /* not implemented */
    },
    stop() {
      /* not implemented */
    },
    reset() {
      /* not implemented */
    },
  };
}
