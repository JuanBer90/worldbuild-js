import {
  PerspectiveCamera,
  Points,
  Scene,
  WebGLRenderer,
} from 'three';
import { latLonToCartesian } from '../geography/coordinates';
import type { ResolvedCameraOptions } from '../core/types';
import type { FrameCallback, Renderer } from './Renderer';

export const DEFAULT_CAMERA_LONGITUDE = 0;

const GLOBE_FOV_DEGREES = 45;
const GLOBE_FIT_MARGIN = 0.86;

/** Returns an outside camera position at the configured latitude. */
export function getCameraEyePosition(latitude: number, longitude: number, distance: number) {
  return latLonToCartesian(latitude, longitude, distance);
}

export function getGlobeFrameDistance(radius: number): number {
  const fovRadians = (GLOBE_FOV_DEGREES * Math.PI) / 180;
  return radius / Math.sin(Math.atan(Math.tan(fovRadians / 2) * GLOBE_FIT_MARGIN));
}

export class ThreeRenderer implements Renderer {
  private readonly container: HTMLElement;
  private readonly cameraOptions: ResolvedCameraOptions;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private webglRenderer: WebGLRenderer | null = null;
  private particlePoints: Points | null = null;
  private frameCallback: FrameCallback | null = null;
  private frameRequestId: number | null = null;
  private previousFrameTime: number | null = null;
  private renderLoopActive = false;

  constructor(container: HTMLElement, cameraOptions: ResolvedCameraOptions) {
    this.container = container;
    this.cameraOptions = cameraOptions;
  }

  initialize(): void {
    if (this.webglRenderer) {
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(GLOBE_FOV_DEGREES, 1, 0.01, 100);

    const webglRenderer = new WebGLRenderer({ alpha: true, antialias: true });
    webglRenderer.setPixelRatio(window.devicePixelRatio);
    webglRenderer.setClearColor(0x000000, 0);

    this.container.appendChild(webglRenderer.domElement);

    this.scene = scene;
    this.camera = camera;
    this.webglRenderer = webglRenderer;

    this.resize();
    this.render();
  }

  setParticlePoints(points: Points): void {
    if (!this.scene) {
      throw new Error('ThreeRenderer is not initialized');
    }
    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
    }
    this.particlePoints = points;
    this.scene.add(points);
  }

  setFrameCallback(callback: FrameCallback | null): void {
    this.frameCallback = callback;
  }

  startRenderLoop(): void {
    if (this.renderLoopActive || !this.webglRenderer) {
      return;
    }
    this.renderLoopActive = true;
    this.previousFrameTime = null;
    this.frameRequestId = window.requestAnimationFrame(this.onFrame);
  }

  stopRenderLoop(): void {
    this.renderLoopActive = false;
    if (this.frameRequestId !== null) {
      window.cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
    this.previousFrameTime = null;
  }

  frameGlobe(radius: number): void {
    if (!this.camera) {
      return;
    }
    // Fit a sphere's silhouette inside the vertical field of view with margin.
    const distance = getGlobeFrameDistance(radius);

    const eye = getCameraEyePosition(
      this.cameraOptions.latitude,
      this.cameraOptions.longitude,
      distance,
    );
    this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.near = Math.max(0.01, distance - radius * 3);
    this.camera.far = distance + radius * 3;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    if (!this.scene || !this.camera || !this.webglRenderer) {
      return;
    }
    this.webglRenderer.render(this.scene, this.camera);
  }

  resize(): void {
    if (!this.camera || !this.webglRenderer) {
      return;
    }

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.webglRenderer.setSize(width, height);
  }

  destroy(): void {
    this.stopRenderLoop();
    this.frameCallback = null;
    if (this.scene && this.particlePoints) {
      this.scene.remove(this.particlePoints);
    }
    this.particlePoints = null;

    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      if (this.webglRenderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.webglRenderer.domElement);
      }
    }
    this.scene = null;
    this.camera = null;
    this.webglRenderer = null;
  }

  private readonly onFrame = (time: number): void => {
    this.frameRequestId = null;
    if (!this.renderLoopActive || !this.webglRenderer) {
      this.frameRequestId = null;
      return;
    }

    const previousFrameTime = this.previousFrameTime ?? time;
    this.previousFrameTime = time;
    this.frameCallback?.(time - previousFrameTime);
    this.render();
    if (this.renderLoopActive) {
      this.frameRequestId = window.requestAnimationFrame(this.onFrame);
    }
  };
}
