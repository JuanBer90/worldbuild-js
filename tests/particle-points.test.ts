import { ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { createParticlesFromLandTuples } from '../src/particles/create-particles';
import { ParticlePoints } from '../src/particles/ParticlePoints';

const BUILD_OPTIONS = {
  enabled: true,
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
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material).toBeInstanceOf(ShaderMaterial);
    expect(material.vertexShader).toContain('normalize(worldPosition.xyz - worldCenter)');
    expect(material.vertexShader).toContain('normalize(cameraPosition - worldCenter)');
    expect(material.vertexShader).not.toContain('cameraPosition - worldPosition');
    expect(material.fragmentShader).toContain('if (hideBackside > 0.5 && vFacing < 0.0) discard;');
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
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material.uniforms.hideBackside!.value).toBe(0);
    expect(material.uniforms.buildProgress!.value).toBe(1);

    particlePoints.dispose();
  });
});
