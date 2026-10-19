/**
 * Catálogo reutilizable de variables agronómicas. La tabla variables_agronomicas
 * (migración 032) es la fuente administrable; este catálogo base es su semilla y el
 * respaldo cuando la tabla todavía no existe. Ninguna variable está atada a un cultivo:
 * qué datos se piden lo deciden las reglas (variables críticas y complementarias).
 */
export const VARIABLE_ORIGINS = ["clima", "fenologia", "campo", "modelo"] as const;
export const VARIABLE_VALUE_TYPES = ["numero", "texto", "booleano", "opcion", "fecha"] as const;
export const FIELD_DATA_SOURCES = ["manual", "sensor", "import", "calculated"] as const;

export type VariableOrigin = (typeof VARIABLE_ORIGINS)[number];
export type VariableValueType = (typeof VARIABLE_VALUE_TYPES)[number];
export type FieldDataSource = (typeof FIELD_DATA_SOURCES)[number];

export interface AgronomicVariable {
  clave: string;
  etiqueta: string;
  descripcion: string;
  unidad: string | null;
  tipo_valor: VariableValueType;
  origen: VariableOrigin;
  /** Proveedores climáticos que entregan la variable (p. ej. open_meteo). */
  proveedores: string[];
  /** Días que un dato de campo se considera vigente si no trae vencimiento propio. */
  vigencia_dias: number | null;
  activa: boolean;
}

/** MVP: el ClimateProvider apunta exclusivamente a Open-Meteo (AGENTS.md). */
export const CONFIGURED_CLIMATE_PROVIDER = "open_meteo";

const climate = (clave: string, etiqueta: string, descripcion: string, unidad: string, proveedores = [CONFIGURED_CLIMATE_PROVIDER]): AgronomicVariable =>
  ({ clave, etiqueta, descripcion, unidad, tipo_valor: "numero", origen: "clima", proveedores, vigencia_dias: 1, activa: true });
const field = (clave: string, etiqueta: string, descripcion: string, tipo_valor: VariableValueType, vigencia_dias: number | null, unidad: string | null = null): AgronomicVariable =>
  ({ clave, etiqueta, descripcion, unidad, tipo_valor, origen: "campo", proveedores: [], vigencia_dias, activa: true });

export const BASE_VARIABLES: AgronomicVariable[] = [
  climate("temperatura_media", "Temperatura media del lote o estación cercana", "Promedio diario de temperatura del aire.", "°C"),
  climate("temperatura_min", "Temperatura mínima del lote o estación cercana", "Mínima diaria de temperatura del aire.", "°C"),
  climate("temperatura_max", "Temperatura máxima del lote o estación cercana", "Máxima diaria de temperatura del aire.", "°C"),
  climate("humedad_relativa", "Humedad relativa del lote o estación cercana", "Humedad relativa media diaria.", "%"),
  climate("precipitacion", "Precipitaciones y riegos recientes", "Lluvia diaria acumulada.", "mm"),
  climate("viento_medio", "Velocidad del viento", "Viento medio diario a 10 m.", "km/h"),
  climate("punto_rocio", "Punto de rocío", "Temperatura de rocío media diaria.", "°C"),
  climate("deficit_presion_vapor", "Déficit de presión de vapor", "DPV medio diario.", "kPa"),
  climate("evapotranspiracion", "Evapotranspiración", "Evapotranspiración diaria estimada.", "mm"),
  climate("et0_fao_56", "Evapotranspiración de referencia", "ET0 FAO-56 diaria.", "mm"),
  climate("humedad_suelo_0_1cm", "Humedad de suelo o balance hídrico", "Humedad volumétrica 0–1 cm. Un dato medido en el lote prevalece sobre la estimación.", "m³/m³"),
  climate("humedad_suelo_1_3cm", "Humedad de suelo o balance hídrico", "Humedad volumétrica 1–3 cm.", "m³/m³"),
  climate("humedad_suelo_3_9cm", "Humedad de suelo o balance hídrico", "Humedad volumétrica 3–9 cm.", "m³/m³"),
  climate("humedad_suelo_9_27cm", "Humedad de suelo o balance hídrico", "Humedad volumétrica 9–27 cm.", "m³/m³"),
  climate("humedad_suelo_27_81cm", "Humedad de suelo o balance hídrico", "Humedad volumétrica 27–81 cm.", "m³/m³"),
  climate("temperatura_suelo_0cm", "Temperatura de suelo", "Temperatura de suelo en superficie.", "°C"),
  climate("temperatura_suelo_6cm", "Temperatura de suelo", "Temperatura de suelo a 6 cm.", "°C"),
  climate("temperatura_suelo_18cm", "Temperatura de suelo", "Temperatura de suelo a 18 cm.", "°C"),
  climate("temperatura_suelo_54cm", "Temperatura de suelo", "Temperatura de suelo a 54 cm.", "°C"),
  climate("radiacion_solar", "Radiación solar", "Radiación de onda corta media diaria.", "W/m²"),
  climate("leaf_wetness_hours", "Horas de mojado foliar medidas o calculadas por un modelo calibrado", "Horas diarias con hoja mojada. Open-Meteo no las provee: requieren sensor o modelo calibrado.", "h", []),
  { clave: "codigo_zadoks", etiqueta: "Etapa fenológica actual", descripcion: "Etapa del cultivo (Zadoks u otra escala configurada), informada o estimada.", unidad: null, tipo_valor: "numero", origen: "fenologia", proveedores: [], vigencia_dias: 10, activa: true },
  field("cultivar", "Cultivar sembrado", "Nombre comercial del cultivar del lote.", "texto", null),
  field("cultivar_susceptibilidad", "Cultivar y susceptibilidad", "Susceptibilidad varietal a la enfermedad o plaga evaluada.", "opcion", null),
  field("observacion_manual", "Observaciones de campo", "Síntomas, presencia o daño observados en el lote.", "texto", 7),
  field("estado_drenaje", "Estado de drenaje del lote", "Drenaje observado del lote (bueno, regular, malo).", "opcion", 30),
  field("anegamiento_observado", "Presencia de anegamiento observada en campo", "Si hay sectores anegados en el lote.", "booleano", 7),
  field("saturacion_suelo", "Humedad o saturación de suelo", "Saturación observada del perfil.", "opcion", 7),
  field("tipo_suelo", "Tipo de suelo o capacidad de almacenamiento de agua", "Textura o serie de suelo del lote.", "texto", null),
  field("capacidad_agua_suelo", "Tipo de suelo o capacidad de almacenamiento de agua", "Agua útil del perfil.", "numero", null, "mm"),
  field("rastrojo", "Rastrojo en superficie", "Cobertura y cultivo del rastrojo presente.", "texto", 180),
  field("antecesor_rotacion", "Antecesor y rotación", "Cultivo antecesor y esquema de rotación del lote.", "texto", null),
  field("hospedantes_puentes_verdes", "Cultivares, hospedantes o puentes verdes, cuando aplique", "Hospedantes o puentes verdes cercanos al lote.", "texto", 30),
  field("monitoreo_presencia_densidad", "Monitoreo de presencia y densidad", "Conteo o densidad observada en el monitoreo.", "numero", 7),
  field("antecedentes_plagas_lote", "Antecedentes de plagas en el lote", "Plagas registradas en campañas anteriores.", "texto", null),
  field("fecha_ultima_lluvia_riego", "Fecha de última lluvia o riego", "Último evento de agua registrado en el lote.", "fecha", 30),
  field("duracion_exposicion_frio", "Duración de la exposición a temperaturas bajas, cuando aplique", "Horas bajo el umbral de daño medidas en el lote.", "numero", 3, "h"),
];

export function catalogByKey(variables: AgronomicVariable[] = BASE_VARIABLES) {
  return new Map(variables.map((variable) => [variable.clave, variable]));
}

/** ¿El proveedor configurado entrega la variable? Las de campo/fenología se cargan aparte. */
export function providerCoverage(variable: AgronomicVariable | undefined, provider = CONFIGURED_CLIMATE_PROVIDER) {
  if (!variable) return "desconocida" as const;
  if (variable.origen === "campo") return "dato_de_campo" as const;
  if (variable.origen === "fenologia") return "fenologia" as const;
  return variable.proveedores.includes(provider) ? ("proveedor" as const) : ("no_disponible" as const);
}

export const VARIABLE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,62}$/;

export interface VariableUsage {
  regla_id: string;
  clave: string;
  version: string;
  cultivo: string;
  lista: "critica" | "complementaria";
}

/** Entrada del catálogo para el panel: variable + cobertura del proveedor + uso en reglas. */
export interface CatalogEntry extends AgronomicVariable {
  cobertura_proveedor: ReturnType<typeof providerCoverage>;
  uso: VariableUsage[];
}

export function catalogEntries(variables: AgronomicVariable[], usage: ReadonlyMap<string, VariableUsage[]>): CatalogEntry[] {
  return variables.map((variable) => ({ ...variable, cobertura_proveedor: providerCoverage(variable), uso: usage.get(variable.clave) ?? [] }));
}
