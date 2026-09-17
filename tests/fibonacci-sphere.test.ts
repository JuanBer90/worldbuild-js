import { describe, expect, it } from 'vitest';
import { fibonacciLatLon, GOLDEN_ANGLE } from '../src/geography/fibonacci-sphere';

describe('fibonacciLatLon', () => {
  const candidateCount = 10_000;

  it('is deterministic for the same index', () => {
    const a = fibonacciLatLon(42, candidateCount);
    const b = fibonacciLatLon(42, candidateCount);
    expect(a).toEqual(b);
  });

  it('returns latitude and longitude within valid ranges', () => {
    for (let index = 0; index < 200; index++) {
      const { latitude, longitude } = fibonacciLatLon(index, candidateCount);
      expect(latitude).toBeGreaterThanOrEqual(-90);
      expect(latitude).toBeLessThanOrEqual(90);
      expect(longitude).toBeGreaterThanOrEqual(-180);
      expect(longitude).toBeLessThanOrEqual(180);
    }
  });

  it('uses distinct samples across indices', () => {
    const first = fibonacciLatLon(0, candidateCount);
    const second = fibonacciLatLon(1, candidateCount);
    expect(first).not.toEqual(second);
  });

  it('exposes a stable golden angle constant', () => {
    expect(GOLDEN_ANGLE).toBeCloseTo(Math.PI * (3 - Math.sqrt(5)));
  });
});
