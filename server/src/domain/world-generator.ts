import { createRng, hashSeed } from './engine.js';
import { generatedWorldSchema, type GeneratedWorld, type WorldGenerationRequest } from '@neuralcartographer/shared';

type LandSeed = { x: number; y: number; radius: number; strength: number };

const BIOMES = ['ocean', 'polar_ice', 'tundra', 'desert', 'grassland', 'temperate_forest', 'rainforest', 'alpine'] as const;
const PREFIXES = ['Ael', 'Bry', 'Cor', 'Dun', 'Ely', 'Fen', 'Gal', 'Ith', 'Kel', 'Lyr', 'Mor', 'Nym', 'Pyr', 'Syl', 'Thal', 'Vey'];
const SUFFIXES = ['ara', 'or', 'eth', 'is', 'um', 'vale', 'reach', 'spire', 'mere', 'wold', 'deep', 'crown'];

function round(value: number, digits = 1): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function choose<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)] ?? values[0]!;
}

/**
 * Generates a fictional, globally gridded world from one stable seed.
 * This is a procedural art/design tool, not a physical climate or terrain model.
 */
export function generateWorld(request: WorldGenerationRequest): GeneratedWorld {
  const seed = request.seed.trim();
  const seedHash = hashSeed(seed);
  const random = createRng(seedHash);
  const width = request.width;
  const height = request.height;
  const continents: LandSeed[] = Array.from({ length: 8 }, () => ({
    x: random(), y: random(), radius: 0.08 + random() * 0.22, strength: 0.48 + random() * 0.42
  }));
  const name = `${choose(PREFIXES, random)}${choose(SUFFIXES, random)} ${choose(SUFFIXES, random)}`;
  const biomeCounts: Record<string, number> = Object.fromEntries(BIOMES.map((biome) => [biome, 0]));
  const cells: GeneratedWorld['cells'] = [];
  let landCells = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      let continentField = -1;
      for (const continent of continents) {
        const dx = Math.min(Math.abs(nx - continent.x), 1 - Math.abs(nx - continent.x)) * Math.cos((ny - 0.5) * Math.PI);
        const dy = (ny - continent.y) * 1.4;
        const distance = Math.sqrt(dx * dx + dy * dy);
        continentField = Math.max(continentField, continent.strength - distance / continent.radius);
      }
      const detail = 0.12 * Math.sin(nx * 42 + seedHash % 31) + 0.08 * Math.cos(ny * 37 + seedHash % 19) +
        0.05 * Math.sin((nx + ny) * 71 + seedHash % 13);
      const elevationSignal = continentField + detail - 0.30;
      const isLand = elevationSignal > 0;
      const lat = round(90 - ny * 180, 2);
      const lon = round(-180 + nx * 360, 2);
      const latitudeFactor = Math.abs(lat) / 90;
      const temperatureC = round(30 - latitudeFactor * 46 - Math.max(0, elevationSignal) * 18 + 3 * Math.sin(nx * 18 + seedHash));
      const rainfallMm = round(Math.max(0, Math.min(4200, 180 + 1600 * (1 - latitudeFactor) + 900 * Math.sin(nx * 11 + ny * 9 + seedHash) - Math.max(0, elevationSignal) * 700)), 0);
      const elevationM = round(isLand ? Math.min(7200, Math.max(5, elevationSignal * 7200)) : -Math.min(8200, Math.max(20, Math.abs(elevationSignal) * 5100)), 0);
      const biome = !isLand ? 'ocean'
        : elevationM > 3600 ? 'alpine'
          : temperatureC < -12 ? 'polar_ice'
            : temperatureC < 2 ? 'tundra'
              : rainfallMm < 260 ? 'desert'
                : rainfallMm > 1900 && temperatureC > 18 ? 'rainforest'
                  : rainfallMm > 850 ? 'temperate_forest' : 'grassland';
      biomeCounts[biome] = (biomeCounts[biome] ?? 0) + 1;
      if (isLand) landCells += 1;
      cells.push({ id: `${x}-${y}`, x, y, lon, lat, elevationM, temperatureC, rainfallMm, biome });
    }
  }

  return generatedWorldSchema.parse({
    seed,
    hash: `0x${seedHash.toString(16).toUpperCase().padStart(8, '0')}`,
    name,
    width,
    height,
    landPercent: round(landCells / (width * height) * 100, 1),
    biomeCounts,
    cells
  });
}
