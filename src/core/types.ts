export type BuildDirection = 'south-to-north' | 'north-to-south';
export type BuildAnimation = 'south-to-north' | 'from-edges';
export type ColorDistribution = 'random' | 'spatial' | 'continent';

export interface BuildOptions {
  /** Construct the globe before rotation. Defaults to true. */
  enabled?: boolean;
  /** Construction strategy. Defaults to south-to-north. */
  animation?: BuildAnimation;
  /** Latitude reveal order for `animation: 'south-to-north'`. Defaults to south-to-north. */
  direction?: BuildDirection;
  /** Milliseconds for the selected construction animation. Defaults to 4,000. */
  duration?: number;
  /** Deterministic timing variation around latitude order. Defaults to 0.12. */
  randomness?: number;
}

export interface ParticleOptions {
  density?: number;
  size?: number;
  color?: string;
  /** Deterministic per-particle palette. Takes precedence over color when non-empty. */
  colors?: string[];
  /** Palette assignment strategy. Defaults to deterministic per-particle random mixing. */
  colorDistribution?: ColorDistribution;
  /** Spatial palette region scale. Smaller values create larger regions. Defaults to 0.25. */
  colorScale?: number;
  opacity?: number;
}

export interface RotationOptions {
  /** Defaults to true; set false to initialize a static globe. */
  enabled?: boolean;
  /** Milliseconds per full 360° revolution. Defaults to 22,000. */
  duration?: number;
  /** Direction when viewed from above the north pole. Defaults to clockwise. */
  direction?: 'clockwise' | 'counterclockwise';
}

export interface GlobeOptions {
  radius?: number;
  /** Hide particles on the hemisphere facing away from the camera. Defaults to true. */
  hideBackside?: boolean;
}

export interface CameraOptions {
  /** Observer latitude in degrees. Defaults to an equatorial outside view (0). */
  latitude?: number;
  /** Observer longitude in degrees. Defaults to the 0° meridian. */
  longitude?: number;
}

export interface WorldBuildOptions {
  container: HTMLElement;
  build?: BuildOptions;
  particles?: ParticleOptions;
  rotation?: RotationOptions;
  globe?: GlobeOptions;
  camera?: CameraOptions;
}

export interface ResolvedBuildOptions {
  enabled: boolean;
  animation: BuildAnimation;
  direction: BuildDirection;
  duration: number;
  randomness: number;
}

export interface ResolvedParticleOptions {
  density: number;
  size: number;
  color: string;
  colors: string[];
  colorDistribution: ColorDistribution;
  colorScale: number;
  opacity: number;
}

export interface ResolvedRotationOptions {
  enabled: boolean;
  duration: number;
  direction: 'clockwise' | 'counterclockwise';
}

export interface ResolvedGlobeOptions {
  radius: number;
  hideBackside: boolean;
}

export interface ResolvedCameraOptions {
  latitude: number;
  longitude: number;
}

export interface ResolvedWorldBuildOptions {
  container: HTMLElement;
  build: ResolvedBuildOptions;
  particles: ResolvedParticleOptions;
  rotation: ResolvedRotationOptions;
  globe: ResolvedGlobeOptions;
  camera: ResolvedCameraOptions;
}
