import { describe, expect, it } from 'vitest';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import {
  isOnLand,
  selectEvenlyDistributedLandPoints,
} from '../scripts/land-point-generation';

describe('land point generation', () => {
  it('recognizes both Polygon and MultiPolygon source geometries', () => {
    const polygon: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
      },
    };
    const multiPolygon: Feature<MultiPolygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]]],
      },
    };

    expect(isOnLand(5, 5, [polygon, multiPolygon])).toBe(true);
    expect(isOnLand(25, 25, [polygon, multiPolygon])).toBe(true);
    expect(isOnLand(15, 15, [polygon, multiPolygon])).toBe(false);
  });

  it('selects evenly across the full candidate order', () => {
    const candidates: [number, number][] = Array.from(
      { length: 100 },
      (_, index) => [90 - index * 1.8, index] as [number, number],
    );

    const selected = selectEvenlyDistributedLandPoints(candidates, 5);

    expect(selected.map(([latitude]) => latitude)).toEqual([72, 36, 0, -36, -72]);
  });
});
