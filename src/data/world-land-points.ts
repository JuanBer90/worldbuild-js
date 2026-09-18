import landPoints from './world-land-points.json';
import type { ContinentId } from './continents.js';

/** Compact land samples as `[latitude, longitude, continentId]` in degrees. */
export type LandPointTuple = [latitude: number, longitude: number, continentId?: ContinentId];

export const WORLD_LAND_POINTS: readonly LandPointTuple[] = landPoints as LandPointTuple[];
