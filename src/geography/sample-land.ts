import { latLonToCartesian, type Vector3 } from './coordinates.js';

/** Placeholder for a future land-point sampler (GeoJSON / TopoJSON). */
export interface LandSamplePoint {
  latitude: number;
  longitude: number;
}

export interface LandSamplerOptions {
  /** Target number of points (not implemented). */
  density?: number;
}

/**
 * Reserved API for sampling land coordinates from geographic data.
 * Not implemented in the skeleton.
 */
export function sampleLandPoints(_options?: LandSamplerOptions): LandSamplePoint[] {
  return [];
}

/** Reserved helper for converting samples to Cartesian positions. */
export function landSampleToPosition(
  sample: LandSamplePoint,
  radius: number,
): Vector3 {
  return latLonToCartesian(sample.latitude, sample.longitude, radius);
}
