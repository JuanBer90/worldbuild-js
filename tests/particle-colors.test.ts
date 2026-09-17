import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { resolveWorldBuildOptions } from '../src/core/WorldBuild';
import { createParticlesFromLandTuples } from '../src/particles/create-particles';
import { createParticleColorBuffer } from '../src/particles/particle-colors';
import type { WorldBuildOptions } from '../src/core/types';

const container = {} as HTMLElement;

function resolve(particles: WorldBuildOptions['particles']) {
  return resolveWorldBuildOptions({ container, particles });
}

describe('particle palettes', () => {
  it('keeps the existing single-color mode when colors is absent or empty', () => {
    expect(resolve({ color: '#123456' }).particles.colors).toEqual([]);
    expect(resolve({ color: '#123456', colors: [] }).particles.colors).toEqual([]);

    const particles = createParticlesFromLandTuples([[0, 0]], 1, {
      size: 1,
      color: '#123456',
      opacity: 1,
    });
    const colors = createParticleColorBuffer(particles, [], '#123456');
    const expected = new Color('#123456');

    expect(colors[0]).toBeCloseTo(expected.r);
    expect(colors[1]).toBeCloseTo(expected.g);
    expect(colors[2]).toBeCloseTo(expected.b);
  });

  it('preserves a one-color palette and gives non-empty palettes precedence over color', () => {
    expect(resolve({ color: '#ffffff', colors: ['#ff4057'] }).particles.colors).toEqual(['#ff4057']);
    expect(resolve({ color: '#ffffff', colors: ['#ff4057', '#22e68a'] }).particles.colors)
      .toEqual(['#ff4057', '#22e68a']);
  });

  it('assigns deterministic mixed colors from the palette', () => {
    const particles = createParticlesFromLandTuples(
      Array.from({ length: 64 }, (_, index) => [index - 32, index * 5 - 160] as [number, number]),
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const palette = ['#ff4057', '#ff9d32', '#22e68a', '#35a7ff'];
    const first = createParticleColorBuffer(particles, palette, '#ffffff');
    const second = createParticleColorBuffer(particles, palette, '#ffffff');
    const represented = new Set<string>();

    for (let index = 0; index < particles.length; index++) {
      const offset = index * 3;
      represented.add(`${first[offset]}:${first[offset + 1]}:${first[offset + 2]}`);
    }

    expect(first).toEqual(second);
    expect(represented.size).toBe(palette.length);
  });

  it('rejects invalid palette entries instead of generating shader data for them', () => {
    expect(() => resolve({ colors: ['#ff4057', 'not-a-color'] })).toThrow(RangeError);
    expect(() => resolve({ colors: [42 as unknown as string] })).toThrow(TypeError);
  });
});
