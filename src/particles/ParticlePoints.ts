import {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';
import {
  createBuildStartProgress,
  createFromEdgesStartProgress,
  BUILD_REVEAL_SPAN,
} from '../animation/build';
import type { ColorDistribution, ResolvedBuildOptions } from '../core/types';
import type { Particle } from './create-particles';
import { createParticleColorBuffer } from './particle-colors';

export interface ParticlePointsStyle {
  /** World-space point diameter scale (multiplier on globe radius). */
  size: number;
  globeRadius: number;
  color: string;
  colors: readonly string[];
  colorDistribution?: ColorDistribution;
  colorScale?: number;
  opacity: number;
  hideBackside: boolean;
  build: ResolvedBuildOptions;
  buildOrigins: Float32Array;
}

/** Base point diameter as a fraction of globe radius (world units). */
const BASE_POINT_SIZE_FRACTION = 0.01;

const PARTICLE_VERTEX_SHADER = `
uniform float pointSize;
uniform float pointScale;
uniform float buildProgress;
uniform float buildRevealSpan;
uniform float buildAnimation;

attribute float buildStart;
attribute vec3 buildOrigin;
attribute vec3 particleColor;
varying float vFacing;
varying float vReveal;
varying vec3 vColor;

void main() {
  float localProgress = clamp((buildProgress - buildStart) / buildRevealSpan, 0.0, 1.0);
  vReveal = smoothstep(0.0, 1.0, localProgress);
  vColor = particleColor;
  vec3 edgePosition = mix(buildOrigin, position, vReveal);
  vec3 particlePosition = mix(position, edgePosition, buildAnimation);
  vec4 worldPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec3 worldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 surfaceDir = normalize(worldPosition.xyz - worldCenter);
  vec3 cameraDir = normalize(cameraPosition - worldCenter);
  vFacing = dot(surfaceDir, cameraDir);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = pointSize * max(vReveal, 0.001) * pointScale * projectionMatrix[1][1] / -mvPosition.z;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
uniform float opacity;
uniform float hideBackside;
uniform float buildAnimation;

varying float vFacing;
varying float vReveal;
varying vec3 vColor;

void main() {
  if (vReveal <= 0.0) discard;
  if (hideBackside > 0.5 && (buildAnimation < 0.5 || vReveal >= 1.0) && vFacing < 0.0) discard;

  vec2 pointCenter = gl_PointCoord - vec2(0.5);
  if (dot(pointCenter, pointCenter) > 0.25) discard;

  gl_FragColor = vec4(vColor, opacity * vReveal);
}
`;

export class ParticlePoints {
  readonly object: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;
  private readonly positionBuffer: Float32Array;
  private readonly buildStartBuffer: Float32Array;
  private readonly buildOriginBuffer: Float32Array;
  private readonly colorBuffer: Float32Array;
  private readonly drawingBufferSize = new Vector2();

  constructor(particles: readonly Particle[], style: ParticlePointsStyle) {
    this.positionBuffer = new Float32Array(particles.length * 3);
    this.buildStartBuffer = new Float32Array(particles.length);
    this.buildOriginBuffer = new Float32Array(style.buildOrigins);
    this.colorBuffer = createParticleColorBuffer(
      particles,
      style.colors,
      style.color,
      style.colorDistribution,
      style.colorScale,
    );
    this.writePositions(particles);
    this.writeBuildStarts(particles, style.build);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positionBuffer, 3));
    this.geometry.setAttribute('buildStart', new BufferAttribute(this.buildStartBuffer, 1));
    this.geometry.setAttribute('buildOrigin', new BufferAttribute(this.buildOriginBuffer, 3));
    this.geometry.setAttribute('particleColor', new BufferAttribute(this.colorBuffer, 3));

    const worldSize = style.globeRadius * BASE_POINT_SIZE_FRACTION * style.size;

    this.material = new ShaderMaterial({
      uniforms: {
        opacity: { value: style.opacity },
        pointSize: { value: worldSize },
        pointScale: { value: 1 },
        hideBackside: { value: style.hideBackside ? 1 : 0 },
        buildProgress: { value: style.build.enabled ? 0 : 1 },
        buildRevealSpan: { value: BUILD_REVEAL_SPAN },
        buildAnimation: { value: style.build.animation === 'from-edges' ? 1 : 0 },
      },
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });

    this.object = new Points(this.geometry, this.material);
    this.object.onBeforeRender = (renderer) => {
      renderer.getDrawingBufferSize(this.drawingBufferSize);
      this.material.uniforms.pointScale!.value = this.drawingBufferSize.y / 2;
    };
  }

  /** Sync GPU positions from each particle's current position. */
  syncFromParticles(particles: readonly Particle[]): void {
    this.writePositions(particles);
    const position = this.geometry.getAttribute('position');
    position.needsUpdate = true;
  }

  /** Update the single global reveal uniform; particle attributes remain static. */
  setBuildProgress(progress: number): void {
    this.material.uniforms.buildProgress!.value = Math.min(1, Math.max(0, progress));
  }

  dispose(): void {
    this.object.onBeforeRender = () => undefined;
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

  private writeBuildStarts(particles: readonly Particle[], build: ResolvedBuildOptions): void {
    for (let index = 0; index < particles.length; index++) {
      const particle = particles[index]!;
      this.buildStartBuffer[index] = build.animation === 'from-edges'
        ? createFromEdgesStartProgress(index, build.randomness)
        : createBuildStartProgress(particle.latitude, index, build.randomness);
    }
  }
}
