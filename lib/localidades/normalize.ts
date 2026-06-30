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

export function normalizeLocalidad(input: string): LocalidadNormalizada | null {
  const key = normalizeKey(input);
  const canonicalName = ALIASES[key];

  if (!canonicalName) return null;

  return LOCALIDADES.find((localidad) => localidad.nombre === canonicalName) ?? null;
}

export function formatLocalidad(localidad: LocalidadNormalizada) {
  return `${localidad.nombre}, ${localidad.provincia}`;
}
