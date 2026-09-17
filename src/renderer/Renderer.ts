export type FrameCallback = (deltaMilliseconds: number) => void;

export interface Renderer {
  initialize(): void;
  setFrameCallback(callback: FrameCallback | null): void;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  render(): void;
  resize(): void;
  destroy(): void;
}
