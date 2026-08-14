import type { LocalidadNormalizada } from "@/types";

const LOCALIDADES: LocalidadNormalizada[] = [
  {
    nombre: "Tandil",
    provincia: "Buenos Aires",
    pais: "Argentina",
    latitud: -37.3217,
    longitud: -59.1332,
  },
  {
    nombre: "Pergamino",
    provincia: "Buenos Aires",
    pais: "Argentina",
    latitud: -33.8899,
    longitud: -60.5736,
  },
  {
    nombre: "Azul",
    provincia: "Buenos Aires",
    pais: "Argentina",
    latitud: -36.7769,
    longitud: -59.8585,
  },
  {
    nombre: "General Pico",
    provincia: "La Pampa",
    pais: "Argentina",
    latitud: -35.6593,
    longitud: -63.7568,
  },
];

const ALIASES: Record<string, string> = {
  tandil: "Tandil",
  pergamino: "Pergamino",
  azul: "Azul",
  "gral pico": "General Pico",
  "gral. pico": "General Pico",
  "general pico": "General Pico",
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(",")[0]
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

interface GeocodingResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
  admin1?: string;
  admin2?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export function normalizeLocalidad(input: string): LocalidadNormalizada | null {
  const key = normalizeKey(input);
  const canonicalName = ALIASES[key];

  if (!canonicalName) return null;

  return LOCALIDADES.find((localidad) => localidad.nombre === canonicalName) ?? null;
}

export async function resolveLocalidad(
  input: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LocalidadNormalizada | null> {
  const known = normalizeLocalidad(input);
  if (known) return known;

  return (await searchLocalidades(input, fetchImpl))[0] ?? null;
}

export async function searchLocalidades(
  input: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LocalidadNormalizada[]> {

  const query = input.trim().replace(/\s+/g, " ");
  if (query.length < 2) return [];

  const params = new URLSearchParams({
    name: query,
    count: "10",
    language: "es",
    format: "json",
    countryCode: "AR",
  });
  const response = await fetchImpl(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Open-Meteo Geocoding respondio ${response.status}`);

  const payload = await response.json() as GeocodingResponse;
  const matches = payload.results?.filter((result) =>
    result.country_code === "AR" &&
    typeof result.name === "string" &&
    typeof result.latitude === "number" &&
    typeof result.longitude === "number"
  ) ?? [];

  return matches.map((match) => ({
    nombre: match.name!,
    provincia: match.admin1 ?? match.admin2 ?? "Argentina",
    pais: "Argentina" as const,
    latitud: match.latitude!,
    longitud: match.longitude!,
  }));
}

export function formatLocalidad(localidad: LocalidadNormalizada) {
  return `${localidad.nombre}, ${localidad.provincia}`;
}
