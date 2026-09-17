import { describe, expect, it } from 'vitest';
import { latLonToCartesian } from '../src/geography/coordinates';
import { createParticlesFromLandTuples } from '../src/particles/create-particles';

describe('createParticlesFromLandTuples', () => {
  it('keeps home and current positions equal initially', () => {
    const particles = createParticlesFromLandTuples(
      [[0, 0], [45, 90]],
      2,
      { size: 1, color: '#fff', opacity: 1 },
    );

    for (const particle of particles) {
      expect(particle.current).toEqual(particle.home);
      expect(particle.home).toEqual(
        latLonToCartesian(particle.latitude, particle.longitude, 2),
      );
    }
  });

  it('allows current position to diverge from home for future animation', () => {
    const particles = createParticlesFromLandTuples([[0, 0]], 1, {
      size: 1,
      color: '#fff',
      opacity: 1,
    });
    const particle = particles[0]!;
    particle.current = { x: 0, y: 0, z: 0 };
    expect(particle.home.z).toBe(1);
    expect(particle.current.z).toBe(0);
  });
});
