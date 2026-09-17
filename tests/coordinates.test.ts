import { describe, expect, it } from 'vitest';
import { latLonToCartesian } from '../src/geography/coordinates';

const R = 1;

function expectClose(actual: number, expected: number, epsilon = 1e-10): void {
  expect(Math.abs(actual - expected)).toBeLessThan(epsilon);
}

describe('latLonToCartesian', () => {
  it('places equator at longitude 0 on the positive Z axis', () => {
    const p = latLonToCartesian(0, 0, R);
    expectClose(p.x, 0);
    expectClose(p.y, 0);
    expectClose(p.z, R);
  });

  it('places the north pole on the positive Y axis', () => {
    const p = latLonToCartesian(90, 0, R);
    expectClose(p.x, 0);
    expectClose(p.y, R);
    expectClose(p.z, 0);
  });

  it('places the south pole on the negative Y axis', () => {
    const p = latLonToCartesian(-90, 0, R);
    expectClose(p.x, 0);
    expectClose(p.y, -R);
    expectClose(p.z, 0);
  });

  it('places equator at longitude 90°E on the positive X axis', () => {
    const p = latLonToCartesian(0, 90, R);
    expectClose(p.x, R);
    expectClose(p.y, 0);
    expectClose(p.z, 0);
  });

  it('places equator at longitude 90°W on the negative X axis', () => {
    const p = latLonToCartesian(0, -90, R);
    expectClose(p.x, -R);
    expectClose(p.y, 0);
    expectClose(p.z, 0);
  });

  it('scales with radius', () => {
    const p = latLonToCartesian(0, 0, 5);
    expectClose(p.z, 5);
  });
});
