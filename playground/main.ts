import { WorldBuild } from '../src/index';

const container = document.getElementById('worldbuild-container');
if (!container) {
  throw new Error('Playground container not found');
}

const world = new WorldBuild({
  container,
  globe: { radius: 1, hideBackside: false },
  camera: { latitude: 0, longitude: 0 },
  particles: {
    size: 2,
    color: '#b8d4f0',
    colors: ['#FF4057', '#FF9D32', '#F6D83B', '#22E68A', '#1EDBE5', '#35A7FF', '#9A4DFF'],
    colorDistribution: 'continent',
    opacity: 0.85,
  },
  build: { enabled: true, animation: 'from-edges', duration: 8000, randomness: 0.15 },
  rotation: { enabled: true, duration: 22000 },
});

const onResize = () => {
  world.resize();
};

window.addEventListener('resize', onResize);

window.addEventListener('beforeunload', () => {
  window.removeEventListener('resize', onResize);
  world.destroy();
});
