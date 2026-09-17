import { WorldBuild } from '../src/index';

const container = document.getElementById('worldbuild-container');
if (!container) {
  throw new Error('Playground container not found');
}

const world = new WorldBuild({
  container,
  globe: { radius: 1 },
  particles: {
    size: 1,
    color: '#b8d4f0',
    opacity: 0.85,
  },
  build: {},
  rotation: { enabled: false },
});

const onResize = () => {
  world.resize();
};

window.addEventListener('resize', onResize);

window.addEventListener('beforeunload', () => {
  window.removeEventListener('resize', onResize);
  world.destroy();
});
