/** Stable compact continent identifiers stored alongside generated land points. */
export const CONTINENT_ID = {
  NORTH_AMERICA: 0,
  SOUTH_AMERICA: 1,
  EUROPE: 2,
  AFRICA: 3,
  ASIA: 4,
  OCEANIA: 5,
  ANTARCTICA: 6,
} as const;

export type ContinentId = (typeof CONTINENT_ID)[keyof typeof CONTINENT_ID];

/** Stable palette assignment order for continent distribution. */
export const CONTINENT_IDS: readonly ContinentId[] = [
  CONTINENT_ID.NORTH_AMERICA,
  CONTINENT_ID.SOUTH_AMERICA,
  CONTINENT_ID.EUROPE,
  CONTINENT_ID.AFRICA,
  CONTINENT_ID.ASIA,
  CONTINENT_ID.OCEANIA,
  CONTINENT_ID.ANTARCTICA,
];

export const CONTINENT_NAME_BY_ID: Record<ContinentId, string> = {
  [CONTINENT_ID.NORTH_AMERICA]: 'North America',
  [CONTINENT_ID.SOUTH_AMERICA]: 'South America',
  [CONTINENT_ID.EUROPE]: 'Europe',
  [CONTINENT_ID.AFRICA]: 'Africa',
  [CONTINENT_ID.ASIA]: 'Asia',
  [CONTINENT_ID.OCEANIA]: 'Oceania',
  [CONTINENT_ID.ANTARCTICA]: 'Antarctica',
};

const CONTINENT_ID_BY_NATURAL_EARTH_NAME: Record<string, ContinentId> = {
  'North America': CONTINENT_ID.NORTH_AMERICA,
  'South America': CONTINENT_ID.SOUTH_AMERICA,
  Europe: CONTINENT_ID.EUROPE,
  Africa: CONTINENT_ID.AFRICA,
  Asia: CONTINENT_ID.ASIA,
  Oceania: CONTINENT_ID.OCEANIA,
  Antarctica: CONTINENT_ID.ANTARCTICA,
};

export function continentIdFromNaturalEarth(name: string): ContinentId {
  const continentId = CONTINENT_ID_BY_NATURAL_EARTH_NAME[name];
  if (continentId === undefined) {
    throw new Error(`Unsupported Natural Earth continent: ${name}`);
  }
  return continentId;
}
