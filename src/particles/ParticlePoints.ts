import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  PointsMaterial,
} from 'three';
import type { Particle } from './create-particles';

export interface ParticlePointsStyle {
  /** World-space point diameter scale (multiplier on globe radius). */
  size: number;
  globeRadius: number;
  color: string;
  opacity: number;
}

/** Base point diameter as a fraction of globe radius (world units). */
const BASE_POINT_SIZE_FRACTION = 0.01;

export class ParticlePoints {
  readonly object: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: PointsMaterial;
  private readonly positionBuffer: Float32Array;

  constructor(particles: readonly Particle[], style: ParticlePointsStyle) {
    this.positionBuffer = new Float32Array(particles.length * 3);
    this.writePositions(particles);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positionBuffer, 3));

    const worldSize = style.globeRadius * BASE_POINT_SIZE_FRACTION * style.size;

    this.material = new PointsMaterial({
      color: new Color(style.color),
      size: worldSize,
      opacity: style.opacity,
      transparent: true,
      depthWrite: true,
      depthTest: true,
      sizeAttenuation: true,
    });

    this.object = new Points(this.geometry, this.material);
  }

  /** Sync GPU positions from each particle's current position. */
  syncFromParticles(particles: readonly Particle[]): void {
    this.writePositions(particles);
    const position = this.geometry.getAttribute('position');
    position.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }

  private writePositions(particles: readonly Particle[]): void {
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!;
      const offset = i * 3;
      this.positionBuffer[offset] = particle.current.x;
      this.positionBuffer[offset + 1] = particle.current.y;
      this.positionBuffer[offset + 2] = particle.current.z;
    }
  }
}
