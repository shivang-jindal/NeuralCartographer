import { CATEGORIES, REGIONS, STATUSES, type Category, type EntityStatus, type Region } from '@neuralcartographer/shared';

/** FNV-1a. Mirrors the server so a seed fingerprints identically everywhere. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 is compact, fast, and stable across platforms. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedPreview {
  seed: string;
  hash: number;
  hex: string;
  name: string;
  category: Category;
  region: Region;
  status: EntityStatus;
  habitability: number;
  biomeDiversity: number;
  seedComplexity: number;
  tectonicActivity: number;
  waterCoverage: number;
  population: number;
  risk: number;
  land: number;
}

const PREFIXES = [
  'Ael',
  'Bry',
  'Cor',
  'Dun',
  'Ely',
  'Fen',
  'Gal',
  'Hal',
  'Ith',
  'Jor',
  'Kel',
  'Lyr',
  'Mor',
  'Nym',
  'Or',
  'Pyr',
  'Quel',
  'Rho',
  'Syl',
  'Thal',
  'Ul',
  'Vey',
  'Wyn',
  'Xan',
  'Yr',
  'Zeph'
];

const SUFFIXES = [
  'ia',
  'ara',
  'or',
  'eth',
  'is',
  'um',
  'vale',
  'reach',
  'spire',
  'fall',
  'mere',
  'wold',
  'deep',
  'crown'
];

function pick<T>(items: readonly T[], rng: () => number): T {
  const index = Math.floor(rng() * items.length);
  return items[index] ?? items[0]!;
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Client-side preview of a world from a seed. The catalogue is server-owned,
 * but this preview makes the determinism visible before you commit a seed.
 */
export function previewSeed(rawSeed: string): SeedPreview {
  const seed = rawSeed.trim() || 'uncharted';
  const hash = hashSeed(seed);
  const rng = createRng(hash);

  const category = pick(CATEGORIES, rng);
  const region = pick(REGIONS, rng);
  const status = pick(STATUSES, rng);
  const name = `${pick(PREFIXES, rng)}${pick(SUFFIXES, rng)} ${pick(SUFFIXES, rng)}`.replace(
    /\b([a-z])/g,
    (_match, letter: string) => letter.toUpperCase()
  );

  const habitability = round(
    Math.min(98, Math.max(6, (category === 'Desert' ? 28 : category === 'Polar' ? 34 : 62) + rng() * 38))
  );
  const waterCoverage = round(
    Math.min(99, Math.max(1, (category === 'Ocean' ? 88 : category === 'Terrestrial' ? 38 : 14) + rng() * 26))
  );
  const biomeDiversity = round(Math.min(18, Math.max(2, 3 + rng() * 14)));
  const seedComplexity = round(Math.min(99, Math.max(20, 38 + rng() * 62)));
  const tectonicActivity = round(
    Math.min(
      99,
      Math.max(2, (status === 'anomalous' ? 68 : status === 'evolving' ? 38 : 16) + rng() * 26)
    )
  );
  const population = Math.round((habitability / 100) * (2_000_000 + rng() * 22_000_000));
  const riskBase = status === 'anomalous' ? 72 : status === 'evolving' ? 42 : 18;
  const risk = round(Math.min(100, Math.max(0, riskBase + rng() * 20 - 10)));

  return {
    seed,
    hash,
    hex: `0x${hash.toString(16).toUpperCase().padStart(8, '0')}`,
    name,
    category,
    region,
    status,
    habitability,
    biomeDiversity,
    seedComplexity,
    tectonicActivity,
    waterCoverage,
    population,
    risk,
    land: rng()
  };
}

export const SEED_SUGGESTIONS = ['pangaea', 'emerald-drift', 'solaris', 'cascadia', 'titanfall', 'aeon'];

/** Mirrors the server risk formula so list and dossier agree without a request. */
export function riskScoreFor(entity: { id: string; status: string }): number {
  const base = entity.status === 'anomalous' ? 72 : entity.status === 'evolving' ? 42 : 18;
  return Math.round((base + (hashSeed(entity.id) % 100) / 5 - 10) * 10) / 10;
}
