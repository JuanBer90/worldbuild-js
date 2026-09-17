import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { fibonacciLatLon } from '../src/geography/fibonacci-sphere.js';

export type LandGeometryFeature = Feature<Polygon | MultiPolygon>;
export type LandPointTuple = [latitude: number, longitude: number];

/**
 * Tests a longitude/latitude point against every land geometry in the source.
 * Turf accepts both Polygon and MultiPolygon geometries, including polygon holes.
 */
export function isOnLand(
  longitude: number,
  latitude: number,
  features: readonly LandGeometryFeature[],
): boolean {
  const point: [number, number] = [longitude, latitude];

  return features.some((feature) => booleanPointInPolygon(point, feature.geometry));
}

/** Generate and filter the entire global Fibonacci candidate set before selecting samples. */
export function collectLandCandidates(
  candidateCount: number,
  features: readonly LandGeometryFeature[],
): LandPointTuple[] {
  const landCandidates: LandPointTuple[] = [];

  for (let index = 0; index < candidateCount; index++) {
    const { latitude, longitude } = fibonacciLatLon(index, candidateCount);
    if (isOnLand(longitude, latitude, features)) {
      landCandidates.push([latitude, longitude]);
    }
  }

  return landCandidates;
}

/**
 * Deterministically take evenly spaced accepted samples. Candidate order sweeps
 * north-to-south, so this preserves the full latitude range while Fibonacci's
 * golden-angle sequence preserves longitudinal coverage within each band.
 */
export function selectEvenlyDistributedLandPoints(
  landCandidates: readonly LandPointTuple[],
  targetCount: number,
): LandPointTuple[] {
  if (targetCount < 1 || !Number.isInteger(targetCount)) {
    throw new RangeError('targetCount must be a positive integer');
  }
  if (landCandidates.length < targetCount) {
    throw new Error(
      `Only found ${landCandidates.length} land candidates (target ${targetCount}). Increase candidateCount.`,
    );
  }

  return Array.from({ length: targetCount }, (_, index) => {
    const candidateIndex = Math.floor(((index + 0.5) * landCandidates.length) / targetCount);
    return landCandidates[candidateIndex]!;
  });
}
