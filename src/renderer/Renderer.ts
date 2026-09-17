export interface Renderer {
  initialize(): void;
  render(): void;
  resize(): void;
  destroy(): void;
}
