import {
  WorldBuild,
  type ColorDistribution,
  type WorldBuildOptions,
} from 'worldbuild-js';
import './style.css';

const XION_PALETTE = [
  '#FF4057',
  '#FF9D32',
  '#F6D83B',
  '#22E68A',
  '#1EDBE5',
  '#35A7FF',
  '#9A4DFF',
] as const;

const DEFAULT_SINGLE_COLOR = '#c8e6ff';
const DEFAULT_BACKGROUND = '#0a0c10';
const PALETTE_SIZE = XION_PALETTE.length;

type ColorMode = 'palette' | 'single';

type DemoState = {
  buildDirection: 'south-to-north' | 'north-to-south';
  colorDistribution: ColorDistribution;
  colorMode: ColorMode;
  paletteColors: string[];
  singleColor: string;
  particleSize: number;
  rotationEnabled: boolean;
};

const globeHost = document.querySelector<HTMLElement>('#globe');
const controlsForm = document.querySelector<HTMLFormElement>('#controls-form');
const colorForm = document.querySelector<HTMLFormElement>('#color-controls-form');
const buildDirectionSelect = document.querySelector<HTMLSelectElement>('#build-direction');
const colorDistributionSelect = document.querySelector<HTMLSelectElement>('#color-distribution');
const colorModeSelect = document.querySelector<HTMLSelectElement>('#color-mode');
const particleColorInput = document.querySelector<HTMLInputElement>('#particle-color');
const backgroundColorInput = document.querySelector<HTMLInputElement>('#background-color');
const resetColorsButton = document.querySelector<HTMLButtonElement>('#reset-colors');
const particleSizeInput = document.querySelector<HTMLInputElement>('#particle-size');
const particleSizeValue = document.querySelector<HTMLOutputElement>('#particle-size-value');
const rotationEnabledInput = document.querySelector<HTMLInputElement>('#rotation-enabled');
const replayButton = document.querySelector<HTMLButtonElement>('#replay');

const paletteInputs = Array.from({ length: PALETTE_SIZE }, (_, index) => {
  const input = document.querySelector<HTMLInputElement>(`#palette-${index}`);
  if (!input) {
    throw new Error(`Palette color input palette-${index} not found`);
  }
  return input;
});

if (
  !globeHost ||
  !controlsForm ||
  !colorForm ||
  !buildDirectionSelect ||
  !colorDistributionSelect ||
  !colorModeSelect ||
  !particleColorInput ||
  !backgroundColorInput ||
  !resetColorsButton ||
  !particleSizeInput ||
  !particleSizeValue ||
  !rotationEnabledInput ||
  !replayButton
) {
  throw new Error('Demo markup is missing required elements');
}

let world: WorldBuild | undefined;

const normalizeHex = (value: string): string => value.toLowerCase();

const readPaletteColors = (): string[] =>
  paletteInputs.map((input) => normalizeHex(input.value));

const readState = (): DemoState => ({
  buildDirection: buildDirectionSelect.value === 'north-to-south' ? 'north-to-south' : 'south-to-north',
  colorDistribution: colorDistributionSelect.value as ColorDistribution,
  colorMode: colorModeSelect.value === 'single' ? 'single' : 'palette',
  paletteColors: readPaletteColors(),
  singleColor: normalizeHex(particleColorInput.value),
  particleSize: Number(particleSizeInput.value),
  rotationEnabled: rotationEnabledInput.checked,
});

const applyBackground = (color: string): void => {
  document.documentElement.style.setProperty('--demo-bg', color);
};

const syncColorModeUi = (): void => {
  const paletteMode = colorModeSelect.value === 'palette';
  colorForm.classList.toggle('mode-palette', paletteMode);
  colorForm.classList.toggle('mode-single', !paletteMode);
  colorDistributionSelect.disabled = !paletteMode;
};

const optionsFromState = (state: DemoState): WorldBuildOptions => {
  const particles =
    state.colorMode === 'palette'
      ? {
          size: state.particleSize,
          colors: [...state.paletteColors],
          colorDistribution: state.colorDistribution,
          opacity: 0.88,
        }
      : {
          size: state.particleSize,
          color: state.singleColor,
          opacity: 0.88,
        };

  return {
    container: globeHost,
    globe: { radius: 1, hideBackside: false },
    camera: { latitude: 0, longitude: 0 },
    particles,
    build: {
      enabled: true,
      animation: 'south-to-north',
      direction: state.buildDirection,
      duration: 3200,
      randomness: 0.14,
    },
    rotation: {
      enabled: state.rotationEnabled,
      duration: 22000,
      direction: 'clockwise',
    },
  };
};

const mount = (state: DemoState): void => {
  world?.destroy();
  world = undefined;
  world = new WorldBuild(optionsFromState(state));
};

const remountFromControls = (): void => {
  mount(readState());
};

const resetColorDefaults = (): void => {
  XION_PALETTE.forEach((color, index) => {
    paletteInputs[index]!.value = color;
  });
  particleColorInput.value = DEFAULT_SINGLE_COLOR;
  backgroundColorInput.value = DEFAULT_BACKGROUND;
  colorModeSelect.value = 'palette';
  colorDistributionSelect.value = 'continent';
  syncColorModeUi();
  applyBackground(DEFAULT_BACKGROUND);
  remountFromControls();
};

const syncParticleSizeLabel = (): void => {
  particleSizeValue.textContent = Number(particleSizeInput.value).toFixed(1);
};

syncColorModeUi();
applyBackground(normalizeHex(backgroundColorInput.value));
mount(readState());
syncParticleSizeLabel();

const onResize = (): void => {
  world?.resize();
};

window.addEventListener('resize', onResize);

controlsForm.addEventListener('change', () => {
  remountFromControls();
});

colorForm.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === 'color-mode') {
    syncColorModeUi();
  }
  if (target instanceof HTMLInputElement && target.id === 'background-color') {
    applyBackground(normalizeHex(target.value));
    return;
  }
  remountFromControls();
});

colorForm.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'color') {
    return;
  }
  if (target.id === 'background-color') {
    applyBackground(normalizeHex(target.value));
  }
});

resetColorsButton.addEventListener('click', () => {
  resetColorDefaults();
});

particleSizeInput.addEventListener('input', () => {
  syncParticleSizeLabel();
});

particleSizeInput.addEventListener('change', () => {
  remountFromControls();
});

replayButton.addEventListener('click', () => {
  world?.replay();
});

window.addEventListener('beforeunload', () => {
  window.removeEventListener('resize', onResize);
  world?.destroy();
});
