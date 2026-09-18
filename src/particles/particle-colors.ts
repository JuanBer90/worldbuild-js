import { Color } from 'three';
import type { Particle } from './create-particles';

const FIRST_VALIDATION_COLOR = 0x123456;
const SECOND_VALIDATION_COLOR = 0xabcdef;
const SPATIAL_FREQUENCY_MULTIPLIER = 20;

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
  distribution: 'random' | 'spatial' = 'random',
  colorScale = 0.25,
): Float32Array {
  const palette = resolveParticlePalette(colors, fallbackColor);
  const paletteColors = palette.map((value) => new Color(value));
  const buffer = new Float32Array(particles.length * 3);

  for (let index = 0; index < particles.length; index++) {
    const particle = particles[index]!;
    const colorIndex = distribution === 'spatial'
      ? spatialPaletteIndex(particle, paletteColors.length, colorScale)
      : randomPaletteIndex(index, particle.latitude, particle.longitude, paletteColors.length);
    const color = paletteColors[colorIndex]!;
    const offset = index * 3;
    buffer[offset] = color.r;
    buffer[offset + 1] = color.g;
    buffer[offset + 2] = color.b;
  }

  return buffer;
}

function randomPaletteIndex(index: number, latitude: number, longitude: number, paletteLength: number): number {
  let value = index >>> 0;
  value ^= Math.round((latitude + 90) * 10_000) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= Math.round((longitude + 180) * 10_000) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) % paletteLength;
}

function spatialPaletteIndex(particle: Particle, paletteLength: number, colorScale: number): number {
  const homeLength = Math.hypot(particle.home.x, particle.home.y, particle.home.z);
  const frequency = colorScale * SPATIAL_FREQUENCY_MULTIPLIER;
  const noise = spatialNoise(
    (particle.home.x / homeLength) * frequency,
    (particle.home.y / homeLength) * frequency,
    (particle.home.z / homeLength) * frequency,
  );
  return Math.min(paletteLength - 1, Math.floor(noise * paletteLength));
}

/** Smooth deterministic 3D value noise with no longitude seam on a sphere. */
function spatialNoise(x: number, y: number, z: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const xWeight = smoothstep(x - x0);
  const yWeight = smoothstep(y - y0);
  const zWeight = smoothstep(z - z0);

  const x00 = interpolate(latticeValue(x0, y0, z0), latticeValue(x0 + 1, y0, z0), xWeight);
  const x10 = interpolate(latticeValue(x0, y0 + 1, z0), latticeValue(x0 + 1, y0 + 1, z0), xWeight);
  const x01 = interpolate(latticeValue(x0, y0, z0 + 1), latticeValue(x0 + 1, y0, z0 + 1), xWeight);
  const x11 = interpolate(latticeValue(x0, y0 + 1, z0 + 1), latticeValue(x0 + 1, y0 + 1, z0 + 1), xWeight);
  return interpolate(interpolate(x00, x10, yWeight), interpolate(x01, x11, yWeight), zWeight);
}

function latticeValue(x: number, y: number, z: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
