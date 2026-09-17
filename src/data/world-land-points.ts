import landPoints from './world-land-points.json';

/** Compact land samples as `[latitude, longitude]` in degrees. */
export type LandPointTuple = [latitude: number, longitude: number];

export const WORLD_LAND_POINTS: readonly LandPointTuple[] = landPoints as LandPointTuple[];
