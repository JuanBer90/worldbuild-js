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

  it('keeps default and explicit random assignments identical to the existing palette algorithm', () => {
    const particles = createParticlesFromLandTuples(
      [[0, 0], [10, 20], [-20, 45], [40, -90], [60, 120], [-45, -135]],
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const palette = ['#ff0000', '#00ff00', '#0000ff'];
    const defaultColors = createParticleColorBuffer(particles, palette, '#ffffff');
    const explicitRandomColors = createParticleColorBuffer(particles, palette, '#ffffff', 'random', 0.25);

    expect(Array.from(defaultColors)).toEqual([1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0]);
    expect(explicitRandomColors).toEqual(defaultColors);
    expect(resolve({ colors: palette }).particles.colorDistribution).toBe('random');
  });

  it('creates deterministic, coherent spatial palette regions from canonical home positions', () => {
    const particles = createParticlesFromLandTuples(
      [[0, 0], [0, 0.1], [0, 0.2], [0, 0.3], [0, 90], [30, 45], [-30, -45]],
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const palette = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
    const first = createParticleColorBuffer(particles, palette, '#ffffff', 'spatial', 0.25);
    const second = createParticleColorBuffer(particles, palette, '#ffffff', 'spatial', 0.25);
    const colorAt = (buffer: Float32Array, index: number) => Array.from(buffer.slice(index * 3, index * 3 + 3)).join(':');

    expect(first).toEqual(second);
    expect(colorAt(first, 0)).toBe(colorAt(first, 1));
    expect(colorAt(first, 1)).toBe(colorAt(first, 2));
    expect(colorAt(first, 2)).toBe(colorAt(first, 3));
    expect(colorAt(first, 0)).not.toBe(colorAt(first, 5));
  });

  it('keeps spatial color continuous across the longitude seam and changes frequency with scale', () => {
    const seamParticles = createParticlesFromLandTuples(
      [[0, 180], [0, -179.9]],
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const nearbyParticles = createParticlesFromLandTuples(
      Array.from({ length: 41 }, (_, index) => [10, index * 0.5] as [number, number]),
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const palette = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
    const seamColors = createParticleColorBuffer(seamParticles, palette, '#ffffff', 'spatial', 0.25);
    const largeRegions = createParticleColorBuffer(nearbyParticles, palette, '#ffffff', 'spatial', 0.1);
    const smallRegions = createParticleColorBuffer(nearbyParticles, palette, '#ffffff', 'spatial', 0.5);
    const transitions = (buffer: Float32Array) => {
      let total = 0;
      for (let index = 1; index < nearbyParticles.length; index++) {
        const previous = Array.from(buffer.slice((index - 1) * 3, index * 3)).join(':');
        const current = Array.from(buffer.slice(index * 3, index * 3 + 3)).join(':');
        if (previous !== current) total++;
      }
      return total;
    };

    expect(Array.from(seamColors.slice(0, 3))).toEqual(Array.from(seamColors.slice(3, 6)));
    expect(transitions(largeRegions)).toBeLessThan(transitions(smallRegions));
  });

  it('validates spatial distribution settings only when a palette is active', () => {
    expect(resolve({ colorDistribution: 'spatial', colorScale: 0.25 }).particles.colorDistribution).toBe('random');
    expect(() => resolve({ colors: ['#ff4057'], colorDistribution: 'unknown' as 'random' }))
      .toThrow(RangeError);
    expect(() => resolve({ colors: ['#ff4057'], colorScale: 0 })).toThrow(RangeError);
    expect(() => resolve({ colors: ['#ff4057'], colorScale: Number.NaN })).toThrow(RangeError);
  });

  it('rejects invalid palette entries instead of generating shader data for them', () => {
    expect(() => resolve({ colors: ['#ff4057', 'not-a-color'] })).toThrow(RangeError);
    expect(() => resolve({ colors: [42 as unknown as string] })).toThrow(TypeError);
  });
});
