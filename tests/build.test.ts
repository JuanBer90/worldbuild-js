import { describe, expect, it } from 'vitest';
import {
  BUILD_SETTLE_DURATION_MS,
  createBuildController,
  createBuildStartProgress,
} from '../src/animation/build';
import { createRotationController } from '../src/animation/rotate';
import type { ResolvedBuildOptions, ResolvedRotationOptions } from '../src/core/types';

const BUILD_OPTIONS: ResolvedBuildOptions = {
  enabled: true,
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

  it('reaches a fully visible globe before completing its settle phase', () => {
    const build = createBuildController(BUILD_OPTIONS);
    build.start();

    expect(build.advance(BUILD_OPTIONS.duration)).toBe(1);
    expect(build.isComplete()).toBe(false);
    build.advance(BUILD_SETTLE_DURATION_MS);
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
    build.advance(BUILD_OPTIONS.duration + BUILD_SETTLE_DURATION_MS);
    build.reset();

    expect(build.getProgress()).toBe(0);
    expect(build.isComplete()).toBe(false);
  });

  it('does not advance rotation until construction and settling have completed', () => {
    const build = createBuildController(BUILD_OPTIONS);
    const rotation = createRotationController(ROTATION_OPTIONS);
    build.start();

    build.advance(BUILD_OPTIONS.duration);
    expect(rotation.advance(1000)).toBe(0);
    build.advance(BUILD_SETTLE_DURATION_MS);
    rotation.start();

    expect(rotation.advance(1000)).toBeGreaterThan(0);
  });
});
