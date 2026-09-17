import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';
import type { Particle } from './create-particles';

export interface ParticlePointsStyle {
  /** World-space point diameter scale (multiplier on globe radius). */
  size: number;
  globeRadius: number;
  color: string;
  opacity: number;
  hideBackside: boolean;
}

/** Base point diameter as a fraction of globe radius (world units). */
const BASE_POINT_SIZE_FRACTION = 0.01;

const PARTICLE_VERTEX_SHADER = `
uniform float pointSize;
uniform float pointScale;

varying float vFacing;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec3 worldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 surfaceDir = normalize(worldPosition.xyz - worldCenter);
  vec3 cameraDir = normalize(cameraPosition - worldCenter);
  vFacing = dot(surfaceDir, cameraDir);

  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = pointSize * pointScale * projectionMatrix[1][1] / -mvPosition.z;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
uniform vec3 color;
uniform float opacity;
uniform float hideBackside;

varying float vFacing;

void main() {
  if (hideBackside > 0.5 && vFacing < 0.0) discard;

  vec2 pointCenter = gl_PointCoord - vec2(0.5);
  if (dot(pointCenter, pointCenter) > 0.25) discard;

  gl_FragColor = vec4(color, opacity);
}
`;

export class ParticlePoints {
  readonly object: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;
  private readonly positionBuffer: Float32Array;
  private readonly drawingBufferSize = new Vector2();

  constructor(particles: readonly Particle[], style: ParticlePointsStyle) {
    this.positionBuffer = new Float32Array(particles.length * 3);
    this.writePositions(particles);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positionBuffer, 3));

    const worldSize = style.globeRadius * BASE_POINT_SIZE_FRACTION * style.size;

    this.material = new ShaderMaterial({
      uniforms: {
        color: { value: new Color(style.color) },
        opacity: { value: style.opacity },
        pointSize: { value: worldSize },
        pointScale: { value: 1 },
        hideBackside: { value: style.hideBackside ? 1 : 0 },
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
}
