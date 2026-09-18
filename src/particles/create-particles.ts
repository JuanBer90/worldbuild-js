import { latLonToCartesian, type Vector3 } from '../geography/coordinates';
import type { LandPointTuple } from '../data/world-land-points';
import { CONTINENT_ID, type ContinentId } from '../data/continents';

export interface Particle {
  latitude: number;
  longitude: number;
  continentId: ContinentId;
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
  return landTuples.map(([latitude, longitude, continentId]) => {
    const home = latLonToCartesian(latitude, longitude, radius);
    return {
      latitude,
      longitude,
      continentId: continentId ?? CONTINENT_ID.NORTH_AMERICA,
      home: cloneVector3(home),
      current: cloneVector3(home),
      size: options.size,
      opacity: options.opacity,
      color: options.color,
    };
  });
}

export function createParticles(
  samples: readonly { latitude: number; longitude: number; continentId?: ContinentId }[],
  radius: number,
  options: CreateParticlesInput,
): Particle[] {
  const tuples: LandPointTuple[] = samples.map((sample) => [
    sample.latitude,
    sample.longitude,
    sample.continentId ?? CONTINENT_ID.NORTH_AMERICA,
  ]);
  return createParticlesFromLandTuples(tuples, radius, options);
}
