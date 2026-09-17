/** Golden-angle increment for Fibonacci sphere sampling. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Deterministic Fibonacci (golden-angle) sample on a unit sphere.
 * `candidateCount` is the virtual sample size used for latitude spacing (fixed per generation run).
 */
export function fibonacciLatLon(
  index: number,
  candidateCount: number,
): { latitude: number; longitude: number } {
  if (index < 0 || candidateCount < 1) {
    throw new RangeError('index must be >= 0 and candidateCount must be >= 1');
  }
  if (index >= candidateCount) {
    throw new RangeError('index must be less than candidateCount');
  }

  const y = 1 - (2 * (index + 0.5)) / candidateCount;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN_ANGLE * index;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;

  const latitude = Math.asin(clamp(y, -1, 1)) * RAD_TO_DEG;
  const longitude = Math.atan2(x, z) * RAD_TO_DEG;

  return { latitude, longitude };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
