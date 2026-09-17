import { Color } from 'three';
import type { Particle } from './create-particles';

const FIRST_VALIDATION_COLOR = 0x123456;
const SECOND_VALIDATION_COLOR = 0xabcdef;

/** Validates a CSS-style color through the same Three.js Color parser used for rendering. */
export function validateParticleColor(value: unknown, optionName: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${optionName} must be a color string supported by Three.js Color`);
  }

  // Invalid styles leave a Color unchanged. Starting from two distinct colors lets
  // us distinguish that case from a valid color that happens to be either sentinel.
  const first = new Color(FIRST_VALIDATION_COLOR).set(value);
  const second = new Color(SECOND_VALIDATION_COLOR).set(value);
  if (!first.equals(second)) {
    throw new RangeError(`${optionName} must be a color string supported by Three.js Color`);
  }
}

/** Resolves an empty palette to the existing single-color path. */
export function resolveParticlePalette(colors: readonly string[], fallbackColor: string): readonly string[] {
  return colors.length > 0 ? colors : [fallbackColor];
}

/**
 * Creates stable RGB vertex data. The hash combines particle identity and canonical
 * geography, so palette order is mixed without depending on animation state.
 */
export function createParticleColorBuffer(
  particles: readonly Particle[],
  colors: readonly string[],
  fallbackColor: string,
): Float32Array {
  const palette = resolveParticlePalette(colors, fallbackColor);
  const paletteColors = palette.map((value) => new Color(value));
  const buffer = new Float32Array(particles.length * 3);

  for (let index = 0; index < particles.length; index++) {
    const particle = particles[index]!;
    const color = paletteColors[paletteIndex(index, particle.latitude, particle.longitude, paletteColors.length)]!;
    const offset = index * 3;
    buffer[offset] = color.r;
    buffer[offset + 1] = color.g;
    buffer[offset + 2] = color.b;
  }

  return buffer;
}

function paletteIndex(index: number, latitude: number, longitude: number, paletteLength: number): number {
  let value = index >>> 0;
  value ^= Math.round((latitude + 90) * 10_000) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= Math.round((longitude + 180) * 10_000) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) % paletteLength;
}
