import { describe, expect, it } from 'vitest';
import { resolveWorldBuildOptions } from '../src/core/WorldBuild';
import { latLonToCartesian } from '../src/geography/coordinates';
import {
  getCameraEyePosition,
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

  it('centers the 0° meridian by default', () => {
    expect(resolve().camera.longitude).toBe(0);
  });

  it('preserves explicit positive and negative camera latitudes', () => {
    expect(resolve(undefined, { latitude: 25 }).camera.latitude).toBe(25);
    expect(resolve(undefined, { latitude: -25 }).camera.latitude).toBe(-25);
  });

  it('preserves explicit positive and negative camera longitudes', () => {
    expect(resolve(undefined, { longitude: 90 }).camera.longitude).toBe(90);
    expect(resolve(undefined, { longitude: -60 }).camera.longitude).toBe(-60);
  });

  it('rejects camera latitudes outside the valid degree range', () => {
    expect(() => resolve(undefined, { latitude: 91 })).toThrow(RangeError);
    expect(() => resolve(undefined, { latitude: -91 })).toThrow(RangeError);
  });

  it('rejects non-finite and out-of-range camera longitudes', () => {
    expect(() => resolve(undefined, { longitude: 181 })).toThrow(RangeError);
    expect(() => resolve(undefined, { longitude: -181 })).toThrow(RangeError);
    expect(() => resolve(undefined, { longitude: Number.NaN })).toThrow(RangeError);
  });

  it('positions latitude zero on the equatorial outside view without changing globe geometry', () => {
    const equatorialEye = getCameraEyePosition(0, 0, 3);
    const northernEye = getCameraEyePosition(25, 0, 3);
    const southernEye = getCameraEyePosition(-25, 0, 3);
    const africa = latLonToCartesian(10, 20, 1);

    expect(equatorialEye.y).toBeCloseTo(0);
    expect(northernEye.y).toBeGreaterThan(0);
    expect(southernEye.y).toBeLessThan(0);
    expect(africa).toEqual(latLonToCartesian(10, 20, 1));
  });

  it('uses longitude to position the outside camera without changing globe geometry', () => {
    const primeMeridianEye = getCameraEyePosition(0, 0, 3);
    const easternEye = getCameraEyePosition(0, 90, 3);
    const southernEye = getCameraEyePosition(-20, 135, 3);
    const africa = latLonToCartesian(10, 20, 1);

    expect(primeMeridianEye.z).toBeCloseTo(3);
    expect(primeMeridianEye.x).toBeCloseTo(0);
    expect(easternEye.x).toBeCloseTo(3);
    expect(easternEye.z).toBeCloseTo(0);
    expect(southernEye.y).toBeLessThan(0);
    expect(africa).toEqual(latLonToCartesian(10, 20, 1));
  });

  it('keeps backside facing relative to the configured camera position', () => {
    const eye = getCameraEyePosition(25, 15, 3);
    const cameraDir = { x: eye.x / 3, y: eye.y / 3, z: eye.z / 3 };
    const front = latLonToCartesian(25, 15, 1);
    const back = latLonToCartesian(-25, -165, 1);
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

  it('preserves an explicit north-to-south build direction', () => {
    expect(resolve(undefined, undefined, { direction: 'north-to-south' }).build.direction).toBe(
      'north-to-south',
    );
  });

  it('rejects invalid build directions at runtime', () => {
    expect(() =>
      resolve(undefined, undefined, { direction: 'east-to-west' as BuildOptions['direction'] }),
    ).toThrow(RangeError);
  });
});
