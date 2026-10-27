/**
 * NeuralCartographer domain constants.
 *
 * The catalogue is the single source of truth for the client, the API, and the
 * tests. Every generated world is described by the same six metrics so that
 * comparisons and simulations stay meaningful across the whole catalogue.
 */

export interface CatalogMetric {
  key: string;
  label: string;
  unit: string;
  format: 'number' | 'percent' | 'compact';
  higherIsBetter: boolean;
}

export interface CatalogEntity {
  id: string;
  name: string;
  category: Category;
  region: Region;
  status: EntityStatus;
  summary: string;
  metrics: Record<string, number>;
  tags: string[];
}

export interface SimulationAction {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const PRODUCT = {
  name: 'NeuralCartographer',
  tagline: 'Infinite, deterministic world generation — from planet to pebble.',
  description:
    'Give it a seed and it dreams a complete, consistent world: tectonics, climate, biomes, rivers, settlements, and the stories inside them.',
  entityLabel: 'worlds',
  entitySingular: 'world',
  repo: 'NeuralCartographer',
  accent: 'emerald'
} as const;

export const STATUSES = ['stable', 'evolving', 'anomalous'] as const;
export type EntityStatus = (typeof STATUSES)[number];

export const CATEGORIES = [
  'Terrestrial',
  'Ocean',
  'Archipelago',
  'Desert',
  'Tundra',
  'Volcanic',
  'Alpine',
  'Wetland',
  'Polar'
] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = [
  'Equatorial Belt',
  'Northern Cap',
  'Pacific Rim',
  'Central Range',
  'Coral Belt',
  'Delta Basin',
  'Subduction Zone',
  'Trade Winds',
  'Ice Margin',
  'Terraformed',
  'Rift Valley',
  'Rain Shadow'
] as const;
export type Region = (typeof REGIONS)[number];

export const METRICS: CatalogMetric[] = [
  { key: 'seedComplexity', label: 'Seed complexity', unit: 'index', format: 'number', higherIsBetter: false },
  { key: 'habitability', label: 'Habitability', unit: '%', format: 'percent', higherIsBetter: true },
  { key: 'biomeDiversity', label: 'Biome diversity', unit: 'zones', format: 'number', higherIsBetter: true },
  { key: 'tectonicActivity', label: 'Tectonic activity', unit: 'index', format: 'number', higherIsBetter: false },
  { key: 'waterCoverage', label: 'Water coverage', unit: '%', format: 'percent', higherIsBetter: true },
  { key: 'populationEstimate', label: 'Population', unit: 'people', format: 'compact', higherIsBetter: true }
];

export const ACTIONS: SimulationAction[] = [
  {
    id: 'regenerate_world',
    label: 'Regenerate world',
    description: 'Re-roll the same seed with fresh tectonic and climate constraints.',
    severity: 'medium'
  },
  {
    id: 'climate_shift',
    label: 'Climate shift',
    description: 'Push the world into a warmer climate band and watch biomes migrate.',
    severity: 'high'
  },
  {
    id: 'sea_level_rise',
    label: 'Sea level rise',
    description: 'Flood shelves and deltas, forcing settlements to relocate inland.',
    severity: 'high'
  },
  {
    id: 'civilization_bloom',
    label: 'Civilisation bloom',
    description: 'Accelerate settlement growth along rivers and coastlines.',
    severity: 'medium'
  },
  {
    id: 'tectonic_event',
    label: 'Tectonic event',
    description: 'Trigger a boundary rupture, volcanic arc, and tsunami cascade.',
    severity: 'critical'
  },
  {
    id: 'seed_fork',
    label: 'Fork seed',
    description: 'Branch a parallel universe from the current world state.',
    severity: 'low'
  }
];

export const ACTION_IDS = ACTIONS.map((action) => action.id) as [string, ...string[]];

export const SUGGESTIONS = [
  'Which worlds are most at risk?',
  'Simulate a tectonic event on Ashen Crown',
  'Show me the archipelagos',
  'How does the deterministic seed work?'
];

export const ENTITIES: CatalogEntity[] = [
  {
    id: 'verdant-reach',
    name: 'Verdant Reach',
    category: 'Terrestrial',
    region: 'Equatorial Belt',
    status: 'stable',
    summary:
      'A river-fed supercontinent interior with closed-canopy forest and megafauna corridors that stitch the biomes together.',
    metrics: {
      seedComplexity: 78,
      habitability: 86,
      biomeDiversity: 14,
      tectonicActivity: 22,
      waterCoverage: 41,
      populationEstimate: 12_400_000
    },
    tags: ['forest', 'rivers', 'megafauna']
  },
  {
    id: 'ashen-crown',
    name: 'Ashen Crown',
    category: 'Volcanic',
    region: 'Pacific Rim',
    status: 'evolving',
    summary:
      'A young arc of shield volcanoes and black-sand coasts, still rewriting its own coastline every few centuries.',
    metrics: {
      seedComplexity: 91,
      habitability: 38,
      biomeDiversity: 6,
      tectonicActivity: 88,
      waterCoverage: 12,
      populationEstimate: 320_000
    },
    tags: ['volcanoes', 'arc', 'young']
  },
  {
    id: 'nereid-deep',
    name: 'Nereid Deep',
    category: 'Ocean',
    region: 'Subduction Zone',
    status: 'stable',
    summary:
      'A world of connected seas over a drowned craton, with hydrothermal vent cities and abyssal migration lanes.',
    metrics: {
      seedComplexity: 64,
      habitability: 21,
      biomeDiversity: 9,
      tectonicActivity: 46,
      waterCoverage: 97,
      populationEstimate: 180_000
    },
    tags: ['ocean', 'vents', 'abyss']
  },
  {
    id: 'solace-dunes',
    name: 'Solace Dunes',
    category: 'Desert',
    region: 'Equatorial Belt',
    status: 'stable',
    summary:
      'A rain-shadow desert with fossil rivers, salt flats, and caravans that follow the old water courses.',
    metrics: {
      seedComplexity: 52,
      habitability: 33,
      biomeDiversity: 4,
      tectonicActivity: 18,
      waterCoverage: 3,
      populationEstimate: 950_000
    },
    tags: ['desert', 'fossil rivers', 'caravans']
  },
  {
    id: 'frostfall-expanse',
    name: 'Frostfall Expanse',
    category: 'Tundra',
    region: 'Northern Cap',
    status: 'evolving',
    summary:
      'Permafrost plains interrupted by pingos and meltwater lakes, warming fast enough to expose buried forests.',
    metrics: {
      seedComplexity: 69,
      habitability: 44,
      biomeDiversity: 5,
      tectonicActivity: 31,
      waterCoverage: 18,
      populationEstimate: 2_400_000
    },
    tags: ['tundra', 'permafrost', 'warming']
  },
  {
    id: 'cinderfall',
    name: 'Cinderfall',
    category: 'Volcanic',
    region: 'Rift Valley',
    status: 'anomalous',
    summary:
      'A rift world where the crust is pulling apart faster than the models allow, opening fresh seas of basalt.',
    metrics: {
      seedComplexity: 88,
      habitability: 12,
      biomeDiversity: 3,
      tectonicActivity: 96,
      waterCoverage: 7,
      populationEstimate: 60_000
    },
    tags: ['rift', 'basalt', 'unstable']
  },
  {
    id: 'lumen-archipelago',
    name: 'Lumen Archipelago',
    category: 'Archipelago',
    region: 'Coral Belt',
    status: 'stable',
    summary:
      'A thousand low islands ringed by reefs, where navigation is a cultural inheritance and the sea is the map.',
    metrics: {
      seedComplexity: 73,
      habitability: 79,
      biomeDiversity: 11,
      tectonicActivity: 27,
      waterCoverage: 88,
      populationEstimate: 4_100_000
    },
    tags: ['islands', 'reefs', 'navigation']
  },
  {
    id: 'highspire-massif',
    name: 'Highspire Massif',
    category: 'Alpine',
    region: 'Central Range',
    status: 'evolving',
    summary:
      'A collision belt of sharp ridgelines and glacial valleys, where every river begins in the same snowfield.',
    metrics: {
      seedComplexity: 81,
      habitability: 57,
      biomeDiversity: 8,
      tectonicActivity: 63,
      waterCoverage: 9,
      populationEstimate: 1_200_000
    },
    tags: ['mountains', 'glaciers', 'watershed']
  },
  {
    id: 'mire-of-whispers',
    name: 'Mire of Whispers',
    category: 'Wetland',
    region: 'Delta Basin',
    status: 'stable',
    summary:
      'A vast tidal wetland: mangrove labyrinths, floating markets, and a delta that moves a little every year.',
    metrics: {
      seedComplexity: 61,
      habitability: 72,
      biomeDiversity: 12,
      tectonicActivity: 14,
      waterCoverage: 64,
      populationEstimate: 3_300_000
    },
    tags: ['wetland', 'delta', 'mangroves']
  },
  {
    id: 'obsidian-reach',
    name: 'Obsidian Reach',
    category: 'Terrestrial',
    region: 'Subduction Zone',
    status: 'anomalous',
    summary:
      'A dark continental margin where an unusually deep slab is dragging the surface down, drowning the lowlands.',
    metrics: {
      seedComplexity: 94,
      habitability: 29,
      biomeDiversity: 7,
      tectonicActivity: 84,
      waterCoverage: 22,
      populationEstimate: 780_000
    },
    tags: ['subduction', 'lowlands', 'subsidence']
  },
  {
    id: 'halcyon-atolls',
    name: 'Halcyon Atolls',
    category: 'Archipelago',
    region: 'Trade Winds',
    status: 'evolving',
    summary:
      'A young atoll chain built on a stationary hotspot, with lagoons bright enough to be seen from orbit.',
    metrics: {
      seedComplexity: 58,
      habitability: 68,
      biomeDiversity: 10,
      tectonicActivity: 12,
      waterCoverage: 93,
      populationEstimate: 1_500_000
    },
    tags: ['atolls', 'hotspot', 'lagoons']
  },
  {
    id: 'basalt-wastes',
    name: 'Basalt Wastes',
    category: 'Desert',
    region: 'Rain Shadow',
    status: 'stable',
    summary:
      'A cold desert locked behind a mountain wall: gravel plains, salt pans, and wind-carved monoliths.',
    metrics: {
      seedComplexity: 47,
      habitability: 18,
      biomeDiversity: 2,
      tectonicActivity: 41,
      waterCoverage: 1,
      populationEstimate: 240_000
    },
    tags: ['desert', 'rain shadow', 'monoliths']
  },
  {
    id: 'aurora-shelf',
    name: 'Aurora Shelf',
    category: 'Polar',
    region: 'Ice Margin',
    status: 'evolving',
    summary:
      'An ice shelf the size of a continent, buttressed by islands, calving icebergs into a dark polar sea.',
    metrics: {
      seedComplexity: 66,
      habitability: 39,
      biomeDiversity: 4,
      tectonicActivity: 24,
      waterCoverage: 71,
      populationEstimate: 510_000
    },
    tags: ['ice', 'shelf', 'polar']
  },
  {
    id: 'titans-garden',
    name: "Titan's Garden",
    category: 'Terrestrial',
    region: 'Terraformed',
    status: 'stable',
    summary:
      'A deliberately seeded garden world: engineered soil, pollinator corridors, and cities grown into the canopy.',
    metrics: {
      seedComplexity: 84,
      habitability: 92,
      biomeDiversity: 16,
      tectonicActivity: 9,
      waterCoverage: 36,
      populationEstimate: 18_700_000
    },
    tags: ['terraformed', 'canopy cities', 'engineered']
  }
];

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'overview' },
  { to: '/catalog', label: 'Worlds', icon: 'catalog' },
  { to: '/generator', label: 'World generator', icon: 'generator' },
  { to: '/simulator', label: 'Simulator', icon: 'simulator' },
  { to: '/workspaces', label: 'World projects', icon: 'projects' },
  { to: '/assistant', label: 'Architect', icon: 'assistant' },
  { to: '/settings', label: 'Settings', icon: 'settings' }
] as const;
