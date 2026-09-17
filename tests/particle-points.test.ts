import { ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { createParticlesFromLandTuples } from '../src/particles/create-particles';
import { ParticlePoints } from '../src/particles/ParticlePoints';

const BUILD_OPTIONS = {
  enabled: true,
  animation: 'south-to-north' as const,
  direction: 'south-to-north' as const,
  duration: 4000,
  randomness: 0.12,
};

describe('ParticlePoints', () => {
  it('uses a dedicated GPU shader with an optional center-based hemisphere discard', () => {
    const particles = createParticlesFromLandTuples([[0, 0]], 1, {
      size: 1,
      color: '#ffffff',
      opacity: 0.75,
    });
    const particlePoints = new ParticlePoints(particles, {
      size: 2,
      globeRadius: 3,
      color: '#123456',
      opacity: 0.75,
      hideBackside: true,
      build: BUILD_OPTIONS,
      buildOrigins: new Float32Array([0, 0, 0]),
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material).toBeInstanceOf(ShaderMaterial);
    expect(material.vertexShader).toContain('normalize(worldPosition.xyz - worldCenter)');
    expect(material.vertexShader).toContain('normalize(cameraPosition - worldCenter)');
    expect(material.vertexShader).not.toContain('cameraPosition - worldPosition');
    expect(material.fragmentShader).toContain('if (hideBackside > 0.5 && (buildAnimation < 0.5 || vReveal >= 1.0) && vFacing < 0.0) discard;');
    expect(material.fragmentShader).toContain('gl_PointCoord');
    expect(material.uniforms.pointSize!.value).toBeCloseTo(0.06);
    expect(material.uniforms.opacity!.value).toBe(0.75);
    expect(material.uniforms.hideBackside!.value).toBe(1);
    expect(material.uniforms.buildProgress!.value).toBe(0);
    expect(particlePoints.object.geometry.getAttribute('buildStart')).toBeDefined();

    particlePoints.dispose();
  });

  it('keeps the x-ray rendering path in the same shader when the backside is shown', () => {
    const particles = createParticlesFromLandTuples([[0, 0]], 1, {
      size: 1,
      color: '#ffffff',
      opacity: 1,
    });
    const particlePoints = new ParticlePoints(particles, {
      size: 1,
      globeRadius: 1,
      color: '#ffffff',
      opacity: 1,
      hideBackside: false,
      build: { ...BUILD_OPTIONS, enabled: false },
      buildOrigins: new Float32Array([0, 0, 0]),
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material.uniforms.hideBackside!.value).toBe(0);
    expect(material.uniforms.buildProgress!.value).toBe(1);

    particlePoints.dispose();
  });

  it('uses edge origins and a shader mode uniform for from-edges builds', () => {
    const particles = createParticlesFromLandTuples([[0, 0]], 1, {
      size: 1,
      color: '#ffffff',
      opacity: 1,
    });
    const particlePoints = new ParticlePoints(particles, {
      size: 1,
      globeRadius: 1,
      color: '#ffffff',
      opacity: 1,
      hideBackside: true,
      build: { ...BUILD_OPTIONS, animation: 'from-edges' },
      buildOrigins: new Float32Array([2, 0, 0]),
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material.uniforms.buildAnimation!.value).toBe(1);
    expect(particlePoints.object.geometry.getAttribute('buildOrigin').getX(0)).toBe(2);
    expect(material.vertexShader).toContain('mix(buildOrigin, position, vReveal)');

    const homePosition = { ...particles[0]!.home };
    particlePoints.setBuildProgress(0.5);
    expect(particles[0]!.home).toEqual(homePosition);

    particlePoints.dispose();
  });
});
