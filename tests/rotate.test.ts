import { describe, expect, it } from 'vitest';
import { createRotationController, FULL_TURN_RADIANS } from '../src/animation/rotate';
import type { ResolvedRotationOptions } from '../src/core/types';

const CLOCKWISE_OPTIONS: ResolvedRotationOptions = {
  enabled: true,
  duration: 22_000,
  direction: 'clockwise',
};

describe('rotation controller', () => {
  it('uses elapsed time for constant full-turn rotation', () => {
    const rotation = createRotationController(CLOCKWISE_OPTIONS);
    rotation.start();

    expect(rotation.advance(5_500)).toBeCloseTo(FULL_TURN_RADIANS / 4);
    expect(rotation.advance(5_500)).toBeCloseTo(FULL_TURN_RADIANS / 2);
    expect(rotation.advance(11_000)).toBeCloseTo(0);
  });

  it('is frame-rate independent', () => {
    const inOneFrame = createRotationController(CLOCKWISE_OPTIONS);
    const acrossFrames = createRotationController(CLOCKWISE_OPTIONS);
    inOneFrame.start();
    acrossFrames.start();

    const oneFrameAngle = inOneFrame.advance(4_000);
    for (let frame = 0; frame < 240; frame++) {
      acrossFrames.advance(4_000 / 240);
    }

    expect(acrossFrames.advance(0)).toBeCloseTo(oneFrameAngle, 10);
  });

  it('pauses without changing the current angle and resumes from it', () => {
    const rotation = createRotationController(CLOCKWISE_OPTIONS);
    rotation.start();
    const beforePause = rotation.advance(1_000);
    rotation.stop();

    expect(rotation.advance(5_000)).toBe(beforePause);
    rotation.start();
    expect(rotation.advance(1_000)).toBeCloseTo(beforePause * 2);
  });

  it('uses the opposite Y-axis direction for counterclockwise rotation', () => {
    const rotation = createRotationController({
      ...CLOCKWISE_OPTIONS,
      direction: 'counterclockwise',
    });
    rotation.start();

    expect(rotation.advance(5_500)).toBeCloseTo(FULL_TURN_RADIANS * 0.75);
  });

  it('rejects invalid durations', () => {
    expect(() => createRotationController({ ...CLOCKWISE_OPTIONS, duration: 0 })).toThrow(
      RangeError,
    );
  });
});
