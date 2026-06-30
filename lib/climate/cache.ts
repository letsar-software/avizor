import type { ClimateData } from "@/types";

const TTL_MS = 3 * 60 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  value: ClimateData;
}

const cache = new Map<string, CacheEntry>();

export function getClimateCache(key: string): ClimateData | null {
  const entry = cache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setClimateCache(key: string, value: ClimateData) {
  cache.set(key, {
    expiresAt: Date.now() + TTL_MS,
    value,
  });
}

export function buildClimateCacheKey(localidad: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `${localidad.toLowerCase()}:${today}`;
}
