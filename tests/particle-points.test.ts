import { Color, ShaderMaterial } from 'three';
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
      colors: [],
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
    expect(material.vertexShader).toContain('attribute vec3 particleColor;');
    expect(material.fragmentShader).toContain('vec4(vColor, opacity * vReveal)');
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
      colors: [],
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
      colors: ['#ff4057', '#22e68a', '#35a7ff'],
      opacity: 1,
      hideBackside: true,
      build: { ...BUILD_OPTIONS, animation: 'from-edges' },
      buildOrigins: new Float32Array([2, 0, 0]),
    });
    const material = particlePoints.object.material as ShaderMaterial;

    expect(material.uniforms.buildAnimation!.value).toBe(1);
    expect(particlePoints.object.geometry.getAttribute('buildOrigin').getX(0)).toBe(2);
    expect(particlePoints.object.geometry.getAttribute('particleColor')).toBeDefined();
    expect(material.vertexShader).toContain('mix(buildOrigin, position, vReveal)');

    const homePosition = { ...particles[0]!.home };
    particlePoints.setBuildProgress(0.5);
    expect(particles[0]!.home).toEqual(homePosition);

    particlePoints.dispose();
  });

  it('uses stable palette colors that take precedence over the fallback color', () => {
    const particles = createParticlesFromLandTuples(
      [[0, 0], [10, 20], [-20, 45], [40, -90], [60, 120], [-45, -135]],
      1,
      { size: 1, color: '#ffffff', opacity: 1 },
    );
    const palette = ['#ff4057', '#22e68a', '#35a7ff'];
    const particlePoints = new ParticlePoints(particles, {
      size: 1,
      globeRadius: 1,
      color: '#ffffff',
      colors: palette,
      opacity: 1,
      hideBackside: true,
      build: BUILD_OPTIONS,
      buildOrigins: new Float32Array(particles.length * 3),
    });
    const colorAttribute = particlePoints.object.geometry.getAttribute('particleColor');
    const beforeBuild = Array.from(colorAttribute.array);
    const paletteRgb = palette.map((value) => new Color(value));
    const assignedColors = new Set<number>();

    for (let index = 0; index < colorAttribute.count; index++) {
      const assigned = paletteRgb.findIndex((color) =>
        Math.abs(color.r - colorAttribute.getX(index)) < 0.000001
        && Math.abs(color.g - colorAttribute.getY(index)) < 0.000001
        && Math.abs(color.b - colorAttribute.getZ(index)) < 0.000001,
      );
      expect(assigned).toBeGreaterThanOrEqual(0);
      assignedColors.add(assigned);
    }
    expect(assignedColors.size).toBeGreaterThan(1);

    particlePoints.setBuildProgress(0.5);
    particlePoints.setBuildProgress(0);
    expect(Array.from(colorAttribute.array)).toEqual(beforeBuild);

    particlePoints.dispose();
  });
});
