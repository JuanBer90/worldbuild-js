import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FULL_TURN_RADIANS } from '../src/animation/rotate';
import { latLonToCartesian } from '../src/geography/coordinates';
import { INITIAL_VIEW_LONGITUDE } from '../src/renderer/ThreeRenderer';

const CAMERA_DISTANCE = 3;

function createOutsideCamera(latitude: number, longitude: number): PerspectiveCamera {
  const eye = latLonToCartesian(latitude, longitude, CAMERA_DISTANCE);
  const camera = new PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(eye.x, eye.y, eye.z);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

function projectFromOutside(
  camera: PerspectiveCamera,
  latitude: number,
  longitude: number,
): Vector3 {
  const point = latLonToCartesian(latitude, longitude, 1);
  return new Vector3(point.x, point.y, point.z).project(camera);
}

describe('outside-view geographic orientation', () => {
  it('projects east to screen-right and west to screen-left at the facing meridian', () => {
    const camera = createOutsideCamera(0, 0);
    const west = projectFromOutside(camera, 0, -30);
    const east = projectFromOutside(camera, 0, 30);

    expect(west.x).toBeLessThan(0);
    expect(east.x).toBeGreaterThan(0);
  });

  it('keeps known continents in their correct outside-view relationships', () => {
    const camera = createOutsideCamera(0, INITIAL_VIEW_LONGITUDE);
    // Representative interior coordinates, not coastline samples.
    const northAmerica = projectFromOutside(camera, 40, -75);
    const southAmerica = projectFromOutside(camera, -15, -60);
    const africa = projectFromOutside(camera, 10, 20);
    const europe = projectFromOutside(camera, 50, 15);
    const asia = projectFromOutside(camera, 35, 90);
    const australia = projectFromOutside(camera, -25, 135);

    expect(northAmerica.x).toBeLessThan(africa.x);
    expect(southAmerica.x).toBeLessThan(africa.x);
    expect(asia.x).toBeGreaterThan(africa.x);
    expect(europe.y).toBeGreaterThan(africa.y);
    expect(australia.x).toBeGreaterThan(africa.x);
    expect(australia.y).toBeLessThan(asia.y);
  });

  it('moves a camera-facing feature eastward to screen-right under default Y rotation', () => {
    const camera = createOutsideCamera(0, 0);
    const point = new Vector3(0, 0, 1);
    point.applyAxisAngle(new Vector3(0, 1, 0), FULL_TURN_RADIANS / 4);
    const projected = point.project(camera);

    expect(projected.x).toBeGreaterThan(0);
    expect(projected.y).toBeCloseTo(0);
  });
});
