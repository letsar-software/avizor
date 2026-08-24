export type Condicion = "favorable" | "moderada" | "desfavorable";

export type Confianza = "Alta" | "Media" | "Baja";

export type EstadoRegla = "validada" | "experimental" | "pendiente";

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
  fenologia?: FenologiaEstimada;
}

export interface ConsultaRequest {
  localidad: string;
  cultivo: string;
  session_id?: string;
  fecha_siembra?: string;
  grupo_madurez?: GrupoMadurez;
  cultivar_id?: string;
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

export type GrupoMadurez = "III" | "IV corto" | "IV largo" | "V";

export interface HitoFenologico {
  codigo: "E" | "R1" | "R3" | "R5" | "R7";
  nombre: string;
  fecha_estimada: string;
}

export interface FenologiaEstimada {
  estadio_actual_estimado: string;
  nombre_estadio: string;
  fecha_estimada: string;
  fecha_inicio_estimada: string;
  fecha_fin_estimada: string;
  margen_dias: number;
  confianza: "alta" | "media" | "baja";
  metodo: "modelo_calendario_grupo_madurez";
  version: "v1.0";
  fecha_siembra: string;
  grupo_madurez: GrupoMadurez;
  cultivar_id?: string;
  hitos: HitoFenologico[];
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
  estado_regla: EstadoRegla;
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


export type CanalConsulta = "web" | "whatsapp" | "api_empresa" | "admin";
export interface ConsultaInput { cultivo: string; localidad: string; fechaSiembra?: string; grupoMadurez?: string; cultivar?: string; sessionId?: string; canal?: CanalConsulta; fechaRef?: string; }
export interface SerieClimaticaDiaria {
  fecha: string;
  temperaturaMedia: number | null;
  temperaturaMinima: number | null;
  temperaturaMaxima: number | null;
  humedadRelativa: number | null;
  precipitacion: number | null;
  vientoMedio: number | null;
  puntoRocio: number | null;
  deficitPresionVapor: number | null;
  evapotranspiracion: number | null;
  et0: number | null;
  humedadSuelo: { profundidad0a1cm: number | null; profundidad1a3cm: number | null; profundidad3a9cm: number | null; profundidad9a27cm: number | null; profundidad27a81cm: number | null; };
  temperaturaSuelo: { profundidad0cm: number | null; profundidad6cm: number | null; profundidad18cm: number | null; profundidad54cm: number | null; };
  radiacionSolar: number | null;
}
export type AggregatorKey = "media_ventana" | "min_ventana" | "suma_ventana" | "dias_con_condicion";
export type SpecOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "between";
export type SpecVariable =
  | "humedad_relativa" | "precipitacion" | "temperatura_media" | "temperatura_min" | "temperatura_max"
  | "viento_medio" | "punto_rocio" | "deficit_presion_vapor" | "evapotranspiracion" | "et0_fao_56"
  | "humedad_suelo_0_1cm" | "humedad_suelo_1_3cm" | "humedad_suelo_3_9cm" | "humedad_suelo_9_27cm" | "humedad_suelo_27_81cm"
  | "temperatura_suelo_0cm" | "temperatura_suelo_6cm" | "temperatura_suelo_18cm" | "temperatura_suelo_54cm"
  | "radiacion_solar";
export interface CondicionDefinicion { variable: SpecVariable; agregador: AggregatorKey; operador: SpecOperator; valor: number | [number, number]; unidad: string; cobertura_minima?: number; subcondicion?: { operador: SpecOperator; valor: number; unidad: string }; provisorio?: boolean; }
export interface NivelRegla { orden: number; clave: string; orden_visual: number; etiqueta: string; explicacion?: string; recomendacion?: string; condiciones: CondicionDefinicion[]; }
export interface ReglaAgronomicaV2 { id: string; clave: string; version: string; cultivo: string; estado: "experimental" | "revisada" | "vigente" | "retirada"; ventana_dias: number; fuente_tecnica: string | null; limitaciones_declaradas: string | null; validado_por: string | null; validado_en: string | null; condiciones_revision: string | null; decisiones_pendientes: string[]; definicion: { niveles: NivelRegla[]; sin_coincidencia?: { estado: string; motivo?: string } }; }
export interface EvaluacionObservada { variable: SpecVariable; agregador: AggregatorKey; valor: number; unidad: string; umbral: string; cumple: boolean; cobertura: number; }
export interface ResultadoReglaV2 { riesgo: string; regla: { clave: string; version: string; estado: ReglaAgronomicaV2["estado"] }; estado: string; etiqueta?: string; explicacion?: string; recomendacion?: string; fuente_tecnica?: string | null; limitaciones_declaradas?: string | null; orden_visual?: number; ventana: { desde: string; hasta: string; dias: number }; observado: EvaluacionObservada[]; calidad_dato: { cobertura_min: number; dias_faltantes: number; distancia_punto_km: number | null }; motivo?: string; detalle?: Record<string, unknown>; evaluado_en: string; }
export interface ContextoFenologico { disponible: boolean; detalle?: FenologiaEstimada; motivo?: "proveedor_no_configurado" | "entradas_insuficientes" | "error_proveedor"; estadio_estimado?: string; descripcion?: string; fuente?: string; entradas?: Record<string, string | null>; incertidumbre?: { nota: string }; modifica_reglas: false; }
export interface ResultadoConsultaV2Publica { id: string | null; request_id: string; share_token: string; estado_general: EstadoGeneral; explicacion: string; resumen_consulta?: { descripcion: string; destaque: string }; localidad: LocalidadNormalizada | null; cultivo: string; fecha_ref: string; generado_en: string; proveedor_climatico: string; reglas: ResultadoReglaV2[]; contexto_fenologico: ContextoFenologico; duracion_ms: number; clima: { serie: SerieClimaticaDiaria[]; rango_temporal: { desde: string; hasta: string }; cobertura: number; variables_disponibles: string[]; variables_faltantes?: string[]; dias_solicitados?: number; dias_disponibles?: number; obtenido_en?: string; adapter_version: string }; }
