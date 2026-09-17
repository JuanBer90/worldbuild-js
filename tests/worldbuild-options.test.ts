import { describe, expect, it } from 'vitest';
import { resolveWorldBuildOptions } from '../src/core/WorldBuild';
import { latLonToCartesian } from '../src/geography/coordinates';
import {
  getCameraEyePosition,
  INITIAL_VIEW_LONGITUDE,
} from '../src/renderer/ThreeRenderer';
import type {
  BuildOptions,
  CameraOptions,
  GlobeOptions,
  WorldBuildOptions,
} from '../src/core/types';

const container = {} as HTMLElement;

function resolve(globe?: GlobeOptions, camera?: CameraOptions, build?: BuildOptions) {
  return resolveWorldBuildOptions({ container, globe, camera, build } as WorldBuildOptions);
}

describe('WorldBuild globe options', () => {
  it('hides the backside by default', () => {
    expect(resolve().globe.hideBackside).toBe(true);
  });

  it('preserves an explicit x-ray globe option', () => {
    expect(resolve({ hideBackside: false }).globe.hideBackside).toBe(false);
  });

  it('uses an equatorial camera latitude by default', () => {
    expect(resolve().camera.latitude).toBe(0);
  });

  it('preserves explicit positive and negative camera latitudes', () => {
    expect(resolve(undefined, { latitude: 25 }).camera.latitude).toBe(25);
    expect(resolve(undefined, { latitude: -25 }).camera.latitude).toBe(-25);
  });

  it('rejects camera latitudes outside the valid degree range', () => {
    expect(() => resolve(undefined, { latitude: 91 })).toThrow(RangeError);
    expect(() => resolve(undefined, { latitude: -91 })).toThrow(RangeError);
  });

  it('positions latitude zero on the equatorial outside view without changing globe geometry', () => {
    const equatorialEye = getCameraEyePosition(0, 3);
    const northernEye = getCameraEyePosition(25, 3);
    const southernEye = getCameraEyePosition(-25, 3);
    const africa = latLonToCartesian(10, 20, 1);

    expect(equatorialEye.y).toBeCloseTo(0);
    expect(northernEye.y).toBeGreaterThan(0);
    expect(southernEye.y).toBeLessThan(0);
    expect(africa).toEqual(latLonToCartesian(10, 20, 1));
  });

  it('keeps backside facing relative to the configured camera position', () => {
    const eye = getCameraEyePosition(25, 3);
    const cameraDir = { x: eye.x / 3, y: eye.y / 3, z: eye.z / 3 };
    const front = latLonToCartesian(25, INITIAL_VIEW_LONGITUDE, 1);
    const back = latLonToCartesian(-25, INITIAL_VIEW_LONGITUDE - 180, 1);
    const dot = (point: typeof front) =>
      point.x * cameraDir.x + point.y * cameraDir.y + point.z * cameraDir.z;

    expect(dot(front)).toBeGreaterThan(0);
    expect(dot(back)).toBeLessThan(0);
  });

  it('uses the south-to-north build defaults', () => {
    expect(resolve().build).toEqual({
      enabled: true,
      animation: 'south-to-north',
      direction: 'south-to-north',
      duration: 4000,
      randomness: 0.12,
    });
  });

  it('preserves a disabled build option', () => {
    expect(resolve(undefined, undefined, { enabled: false }).build.enabled).toBe(false);
  });

  it('preserves an explicit from-edges build animation', () => {
    expect(resolve(undefined, undefined, { animation: 'from-edges' }).build.animation).toBe('from-edges');
  });
});
