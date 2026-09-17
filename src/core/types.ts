export type BuildDirection = 'south-to-north' | 'north-to-south';
export type BuildAnimation = 'south-to-north' | 'from-edges';

export interface BuildOptions {
  /** Construct the globe before rotation. Defaults to true. */
  enabled?: boolean;
  /** Construction strategy. Defaults to south-to-north. */
  animation?: BuildAnimation;
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
}

export interface ResolvedWorldBuildOptions {
  container: HTMLElement;
  build: ResolvedBuildOptions;
  particles: ResolvedParticleOptions;
  rotation: ResolvedRotationOptions;
  globe: ResolvedGlobeOptions;
  camera: ResolvedCameraOptions;
}
