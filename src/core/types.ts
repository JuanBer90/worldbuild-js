export type BuildDirection = 'south-to-north' | 'north-to-south';

export interface BuildOptions {
  direction?: BuildDirection;
  duration?: number;
}

export interface ParticleOptions {
  density?: number;
  size?: number;
  color?: string;
  opacity?: number;
}

export interface RotationOptions {
  enabled?: boolean;
  duration?: number;
  direction?: 'clockwise' | 'counterclockwise';
}

export interface GlobeOptions {
  radius?: number;
}

export interface WorldBuildOptions {
  container: HTMLElement;
  build?: BuildOptions;
  particles?: ParticleOptions;
  rotation?: RotationOptions;
  globe?: GlobeOptions;
}

export interface ResolvedBuildOptions {
  direction: BuildDirection;
  duration: number;
}

export interface ResolvedParticleOptions {
  density: number;
  size: number;
  color: string;
  opacity: number;
}

export interface ResolvedRotationOptions {
  enabled: boolean;
  duration: number;
  direction: 'clockwise' | 'counterclockwise';
}

export interface ResolvedGlobeOptions {
  radius: number;
}

export interface ResolvedWorldBuildOptions {
  container: HTMLElement;
  build: ResolvedBuildOptions;
  particles: ResolvedParticleOptions;
  rotation: ResolvedRotationOptions;
  globe: ResolvedGlobeOptions;
}
