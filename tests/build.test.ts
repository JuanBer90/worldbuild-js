import { describe, expect, it } from 'vitest';
import {
  createBuildController,
  createFromEdgesOrigins,
  createFromEdgesStartProgress,
  createBuildStartProgress,
} from '../src/animation/build';
import { latLonToCartesian } from '../src/geography/coordinates';
import { getCameraEyePosition } from '../src/renderer/ThreeRenderer';
import { createRotationController } from '../src/animation/rotate';
import type { ResolvedBuildOptions, ResolvedRotationOptions } from '../src/core/types';

const BUILD_OPTIONS: ResolvedBuildOptions = {
  enabled: true,
  animation: 'south-to-north',
  direction: 'south-to-north',
  duration: 4000,
  randomness: 0.12,
};

const ROTATION_OPTIONS: ResolvedRotationOptions = {
  enabled: true,
  duration: 22000,
  direction: 'clockwise',
};

describe('build controller', () => {
  it('keeps disabled builds immediately complete', () => {
    const build = createBuildController({ ...BUILD_OPTIONS, enabled: false });

    expect(build.getProgress()).toBe(1);
    expect(build.isComplete()).toBe(true);
  });

  it('orders southern particles before northern particles', () => {
    const southernStart = createBuildStartProgress(-60, 10, BUILD_OPTIONS.randomness);
    const northernStart = createBuildStartProgress(60, 10, BUILD_OPTIONS.randomness);

    expect(southernStart).toBeLessThan(northernStart);
  });

  it('uses deterministic organic timing offsets', () => {
    const first = createBuildStartProgress(-10, 42, BUILD_OPTIONS.randomness);
    const second = createBuildStartProgress(-10, 42, BUILD_OPTIONS.randomness);
    const differentParticle = createBuildStartProgress(-10, 43, BUILD_OPTIONS.randomness);

    expect(first).toBe(second);
    expect(differentParticle).not.toBe(first);
  });

  it('keeps south-to-north selected by default while supporting from-edges', () => {
    expect(BUILD_OPTIONS.animation).toBe('south-to-north');
    expect(createBuildController({ ...BUILD_OPTIONS, animation: 'from-edges' }).getProgress()).toBe(0);
  });

  it('creates deterministic edge origins outside the globe from multiple directions', () => {
    const eye = getCameraEyePosition(0, 0, 3);
    const first = createFromEdgesOrigins(32, eye, 1);
    const second = createFromEdgesOrigins(32, eye, 1);
    const directions = new Set<string>();

    for (let index = 0; index < 32; index++) {
      const offset = index * 3;
      const radius = Math.hypot(first[offset]!, first[offset + 1]!, first[offset + 2]!);
      expect(radius).toBeGreaterThan(1);
      directions.add(`${Math.sign(first[offset]!)}:${Math.sign(first[offset + 1]!)}`);
    }

    expect(first).toEqual(second);
    expect(directions.size).toBeGreaterThan(3);
  });

  it('supports a non-equatorial, non-zero-longitude camera while retaining deterministic edge origins', () => {
    const equatorial = createFromEdgesOrigins(8, getCameraEyePosition(0, 0, 3), 1);
    const northern = createFromEdgesOrigins(8, getCameraEyePosition(25, 90, 3), 1);

    expect(northern).not.toEqual(equatorial);
    expect(createFromEdgesStartProgress(12, 0.15)).toBe(createFromEdgesStartProgress(12, 0.15));
  });

  it('interpolates from an edge origin to the untouched canonical home position', () => {
    const home = latLonToCartesian(10, 20, 1);
    const origin = createFromEdgesOrigins(1, getCameraEyePosition(0, 0, 3), 1);
    const atCompletion = {
      x: origin[0]! + (home.x - origin[0]!),
      y: origin[1]! + (home.y - origin[1]!),
      z: origin[2]! + (home.z - origin[2]!),
    };

    expect(atCompletion.x).toBeCloseTo(home.x);
    expect(atCompletion.y).toBeCloseTo(home.y);
    expect(atCompletion.z).toBeCloseTo(home.z);
  });

  it('completes immediately when build progress reaches one', () => {
    const build = createBuildController(BUILD_OPTIONS);
    build.start();

    expect(build.advance(BUILD_OPTIONS.duration)).toBe(1);
    expect(build.isComplete()).toBe(true);
  });

  it('pauses and resumes build progress', () => {
    const build = createBuildController(BUILD_OPTIONS);
    build.start();
    const beforePause = build.advance(1000);
    build.stop();

    expect(build.advance(1000)).toBe(beforePause);
    build.start();
    expect(build.advance(1000)).toBeGreaterThan(beforePause);
  });

  it('resets construction for replay', () => {
    const build = createBuildController(BUILD_OPTIONS);
    build.start();
    build.advance(BUILD_OPTIONS.duration);
    build.reset();

    expect(build.getProgress()).toBe(0);
    expect(build.isComplete()).toBe(false);
  });

  it.each(['south-to-north', 'from-edges'] as const)(
    'starts rotation immediately when the %s build completes',
    (animation) => {
      const build = createBuildController({ ...BUILD_OPTIONS, animation });
      const rotation = createRotationController(ROTATION_OPTIONS);
      build.start();

      build.advance(BUILD_OPTIONS.duration);
      expect(build.isComplete()).toBe(true);
      rotation.start();

      expect(rotation.advance(1000)).toBeGreaterThan(0);
    },
  );
});
