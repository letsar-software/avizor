export type Condicion = "favorable" | "moderada" | "desfavorable";

export type Confianza = "Alta" | "Media" | "Baja";

export type EstadoGeneral =
  | "Atención recomendada"
  | "Monitoreo preventivo sugerido"
  | "Sin alertas activas";

export interface CategoriaResultado {
  nombre: string;
  condicion: Condicion;
  causas: string[];
  recomendacion: string;
  regla_version: string;
}

export interface ResultadoConsulta {
  estado_general: EstadoGeneral;
  confianza: Confianza;
  dias_datos: number;
  categorias: CategoriaResultado[];
  share_token: string;
  localidad?: LocalidadNormalizada;
  clima_resumen?: ClimateMetrics;
}

export interface ConsultaRequest {
  localidad: string;
  cultivo: string;
  session_id?: string;
  fecha_siembra?: string;
  observacion?: string;
  email?: string;
}

export interface LocalidadNormalizada {
  nombre: string;
  provincia: string;
  pais: "Argentina";
  latitud: number;
  longitud: number;
}

export interface DiaClimatico {
  fecha: string;
  temp_media: number | null;
  humedad_media: number | null;
  lluvia_mm: number;
  viento_medio_kmh: number | null;
}

export interface ClimateData {
  localidad: LocalidadNormalizada;
  dias: DiaClimatico[];
  resumen: ClimateMetrics;
  fuente: "Open-Meteo";
}

export interface ClimateMetrics {
  dias_datos: number;
  humedad_media_14d: number | null;
  lluvia_5d_mm: number;
  lluvia_7d_mm: number;
  lluvia_14d_mm: number;
  temp_media_14d: number | null;
  viento_medio_14d_kmh: number | null;
  dias_lluvia_14d: number;
  temp_min_14d: number | null;
}

export type RuleOperator = ">" | ">=" | "<" | "<=" | "==" | "!=";

export interface RuleCondition {
  metric: keyof ClimateMetrics;
  operator: RuleOperator;
  value: number | string;
}

export interface ReglaAgronomica {
  id: string;
  cultivo: string;
  categoria_nombre: string;
  condicion: Condicion;
  causas: string[];
  recomendacion: string;
  regla_version: string;
  prioridad: number;
  activa: boolean;
  combinador: "all" | "any";
  condiciones: RuleCondition[];
}

export type ConsultaErrorCode =
  | "CLIMA_NO_DISPONIBLE"
  | "LOCALIDAD_NO_RECONOCIDA"
  | "CULTIVO_NO_SOPORTADO"
  | "REGLAS_NO_DISPONIBLES"
  | "REQUEST_INVALIDO";

export interface ConsultaErrorResponse {
  error: string;
  code: ConsultaErrorCode;
}

