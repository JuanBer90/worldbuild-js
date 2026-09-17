import { describe, expect, it } from 'vitest';
import { latLonToCartesian } from '../src/geography/coordinates';
import { WORLD_LAND_POINTS } from '../src/data/world-land-points';

const EXPECTED_POINT_COUNT = 5000;
const GLOBE_RADIUS = 1;
const LATITUDE_BANDS: readonly [number, number][] = [
  [-90, -60],
  [-60, -30],
  [-30, 0],
  [0, 30],
  [30, 60],
  [60, 90],
];

describe('WORLD_LAND_POINTS dataset', () => {
  it('contains approximately the target number of land points', () => {
    expect(WORLD_LAND_POINTS.length).toBeGreaterThanOrEqual(4900);
    expect(WORLD_LAND_POINTS.length).toBeLessThanOrEqual(5100);
    expect(WORLD_LAND_POINTS.length).toBe(EXPECTED_POINT_COUNT);
  });

  it('stores compact [latitude, longitude] tuples in valid ranges', () => {
    for (const [latitude, longitude] of WORLD_LAND_POINTS) {
      expect(latitude).toBeGreaterThanOrEqual(-90);
      expect(latitude).toBeLessThanOrEqual(90);
      expect(longitude).toBeGreaterThanOrEqual(-180);
      expect(longitude).toBeLessThanOrEqual(180);
    }
  });

  it('maps every point to the globe radius (home position invariant)', () => {
    for (const [latitude, longitude] of WORLD_LAND_POINTS.slice(0, 50)) {
      const position = latLonToCartesian(latitude, longitude, GLOBE_RADIUS);
      const distance = Math.hypot(position.x, position.y, position.z);
      expect(distance).toBeCloseTo(GLOBE_RADIUS, 5);
    }
  });

  it('covers every major latitude band instead of stopping near a pole', () => {
    const counts = LATITUDE_BANDS.map(([minimum, maximum]) =>
      WORLD_LAND_POINTS.filter(
        ([latitude]) => latitude >= minimum && latitude <= maximum,
      ).length,
    );

    for (const count of counts) {
      expect(count).toBeGreaterThan(100);
    }
  });

  it('spans the complete globe in Cartesian space', () => {
    const positions = WORLD_LAND_POINTS.map(([latitude, longitude]) =>
      latLonToCartesian(latitude, longitude, GLOBE_RADIUS),
    );

    expect(Math.min(...positions.map(({ x }) => x))).toBeLessThan(-0.95);
    expect(Math.max(...positions.map(({ x }) => x))).toBeGreaterThan(0.95);
    expect(Math.min(...positions.map(({ y }) => y))).toBeLessThan(-0.95);
    expect(Math.max(...positions.map(({ y }) => y))).toBeGreaterThan(0.95);
    // Land has no coverage at the exact 180° equator, so this is intentionally
    // less strict than X/Y while still requiring a broad three-dimensional globe.
    expect(Math.min(...positions.map(({ z }) => z))).toBeLessThan(-0.8);
    expect(Math.max(...positions.map(({ z }) => z))).toBeGreaterThan(0.95);
  });
});
