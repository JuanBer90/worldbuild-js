import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import {
  collectLandCandidates,
  selectEvenlyDistributedLandPoints,
  type LandGeometryFeature,
} from './land-point-generation.js';

const TARGET_LAND_POINTS = 5000;
const CANDIDATE_COUNT = 120_000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const sourcePath = resolve(projectRoot, 'data/source/world-land.geojson');
const outputPath = resolve(projectRoot, 'src/data/world-land-points.json');

function loadLandFeatures(): LandGeometryFeature[] {
  const raw = readFileSync(sourcePath, 'utf8');
  const collection = JSON.parse(raw) as FeatureCollection;
  return collection.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon> =>
      feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon',
  );
}

function generateLandPoints(features: readonly LandGeometryFeature[]) {
  const landCandidates = collectLandCandidates(CANDIDATE_COUNT, features);
  return selectEvenlyDistributedLandPoints(landCandidates, TARGET_LAND_POINTS);
}

function main(): void {
  const features = loadLandFeatures();
  const landPoints = generateLandPoints(features);
  writeFileSync(outputPath, JSON.stringify(landPoints));
  console.log(`Wrote ${landPoints.length} land points to ${outputPath}`);
}

main();
