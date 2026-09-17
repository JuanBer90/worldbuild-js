import {
  PerspectiveCamera,
  Points,
  Scene,
  WebGLRenderer,
} from 'three';
import { latLonToCartesian } from '../geography/coordinates';
import type { Renderer } from './Renderer';

/** Camera latitude/longitude (degrees) for the initial static view. */
const INITIAL_VIEW_LATITUDE = -22;
/** Atlantic-centered longitude: Africa, Europe, and the Americas are visible. */
const INITIAL_VIEW_LONGITUDE = 15;

export class ThreeRenderer implements Renderer {
  private readonly container: HTMLElement;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private webglRenderer: WebGLRenderer | null = null;
  private particlePoints: Points | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  initialize(): void {
    if (this.webglRenderer) {
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.01, 100);

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

  frameGlobe(radius: number): void {
    if (!this.camera) {
      return;
    }
    const fovRadians = (this.camera.fov * Math.PI) / 180;
    const fitMargin = 0.86;
    // Fit a sphere's silhouette inside the vertical field of view with margin.
    const distance = radius / Math.sin(Math.atan(Math.tan(fovRadians / 2) * fitMargin));

    const eye = latLonToCartesian(INITIAL_VIEW_LATITUDE, INITIAL_VIEW_LONGITUDE, distance);
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
}
