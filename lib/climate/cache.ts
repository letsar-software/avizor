import type { ClimateSeriesResult } from "./contract";

const TTL_MS = Number(process.env.CLIMATE_CACHE_TTL_SECONDS ?? 10800) * 1000;
const MAX_ENTRIES = Math.max(1, Number(process.env.CLIMATE_CACHE_MAX_ENTRIES ?? 500));
const cache = new Map<string, { expiresAt: number; value: ClimateSeriesResult }>();

export function getClimateCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) { cache.delete(key); return null; }
  return entry.value;
}
export function setClimateCache(key: string, value: ClimateSeriesResult) {
  const now = Date.now();
  cache.forEach((entry, cachedKey) => { if (entry.expiresAt <= now) cache.delete(cachedKey); });
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { expiresAt: now + TTL_MS, value });
}
export function buildClimateCacheKey(latitud: number, longitud: number, desde: string, hasta: string) { return `${latitud},${longitud}:${desde}:${hasta}`; }
export function clearClimateCache() { cache.clear(); }
