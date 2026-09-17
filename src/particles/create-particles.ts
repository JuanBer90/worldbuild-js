import { latLonToCartesian, type Vector3 } from '../geography/coordinates';
import type { LandPointTuple } from '../data/world-land-points';

export interface Particle {
  latitude: number;
  longitude: number;
  home: Vector3;
  current: Vector3;
  size: number;
  opacity: number;
  color: string;
}

export interface CreateParticlesInput {
  size: number;
  opacity: number;
  color: string;
}

function cloneVector3(vector: Vector3): Vector3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function createParticlesFromLandTuples(
  landTuples: readonly LandPointTuple[],
  radius: number,
  options: CreateParticlesInput,
): Particle[] {
  return landTuples.map(([latitude, longitude]) => {
    const home = latLonToCartesian(latitude, longitude, radius);
    return {
      latitude,
      longitude,
      home: cloneVector3(home),
      current: cloneVector3(home),
      size: options.size,
      opacity: options.opacity,
      color: options.color,
    };
  });
}

export function createParticles(
  samples: readonly { latitude: number; longitude: number }[],
  radius: number,
  options: CreateParticlesInput,
): Particle[] {
  const tuples: LandPointTuple[] = samples.map((sample) => [sample.latitude, sample.longitude]);
  return createParticlesFromLandTuples(tuples, radius, options);
}
