import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { continentIdFromNaturalEarth, type ContinentId } from '../src/data/continents.js';
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
const countriesSourcePath = resolve(projectRoot, 'data/source/world-countries.geojson');
const outputPath = resolve(projectRoot, 'src/data/world-land-points.json');

function loadLandFeatures(): LandGeometryFeature[] {
  const raw = readFileSync(sourcePath, 'utf8');
  const collection = JSON.parse(raw) as FeatureCollection;
  return collection.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon> =>
      feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon',
  );
}

interface CountryProperties {
  CONTINENT?: string;
}

type CountryGeometryFeature = Feature<Polygon | MultiPolygon, CountryProperties>;

function loadCountryFeatures(): CountryGeometryFeature[] {
  const raw = readFileSync(countriesSourcePath, 'utf8');
  const collection = JSON.parse(raw) as FeatureCollection<Polygon | MultiPolygon, CountryProperties>;
  return collection.features.filter(
    (feature): feature is CountryGeometryFeature =>
      (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon')
      && typeof feature.properties?.CONTINENT === 'string',
  );
}

function generateLandPoints(features: readonly LandGeometryFeature[]) {
  const landCandidates = collectLandCandidates(CANDIDATE_COUNT, features);
  return selectEvenlyDistributedLandPoints(landCandidates, TARGET_LAND_POINTS);
}

function addContinentIds(
  points: ReturnType<typeof generateLandPoints>,
  countryFeatures: readonly CountryGeometryFeature[],
): [latitude: number, longitude: number, continentId: ContinentId][] {
  return points.map(([latitude, longitude]) => {
    const country = countryFeatures.find((feature) =>
      booleanPointInPolygon([longitude, latitude], feature.geometry),
    );
    if (!country?.properties.CONTINENT) {
      throw new Error(`Could not classify land point at ${latitude}, ${longitude} with Natural Earth countries`);
    }
    return [latitude, longitude, continentIdFromNaturalEarth(country.properties.CONTINENT)];
  });
}

function main(): void {
  const features = loadLandFeatures();
  const landPoints = addContinentIds(generateLandPoints(features), loadCountryFeatures());
  writeFileSync(outputPath, JSON.stringify(landPoints));
  console.log(`Wrote ${landPoints.length} land points to ${outputPath}`);
}

main();
