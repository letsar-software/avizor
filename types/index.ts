import type {
  PLAGA_ESTADOS_CATALOGO,
  REGIONAL_ESTADOS,
  REGIONAL_PRIORIDADES,
  SPEC_AGGREGATORS,
  SPEC_OPERATORS,
  SPEC_VARIABLES,
  TIPOS_REGLA,
  ZONA_MODOS_APLICABILIDAD,
} from "@/lib/rules/condition-spec";

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
export type AggregatorKey = typeof SPEC_AGGREGATORS[number];
export type SpecOperator = typeof SPEC_OPERATORS[number];
export type SpecVariable = typeof SPEC_VARIABLES[number];
export interface CondicionDefinicion { variable: SpecVariable; agregador: AggregatorKey; operador: SpecOperator; valor: number | [number, number]; unidad: string; cobertura_minima?: number; subcondicion?: { operador: SpecOperator; valor: number; unidad: string }; provisorio?: boolean; }
export interface NivelRegla { orden: number; clave: string; orden_visual: number; etiqueta: string; explicacion?: string; recomendacion?: string; condiciones: CondicionDefinicion[]; }

// Aplicabilidad (plan §3.1): paso previo a la evaluación climática, exclusivo de
// reglas con tipo_regla !== 'climatica' o que además de clima requieren zona/fenología/período.
// Vive dentro de definicion (jsonb), no como columnas rígidas: el modo prioridad/exclusión
// de zona y el resto de las dimensiones son decisión agronómica (PEND-15), no de schema.
export type TipoRegla = typeof TIPOS_REGLA[number];
export type ZonaModoAplicabilidad = typeof ZONA_MODOS_APLICABILIDAD[number];
export interface AplicabilidadZona { modo: ZonaModoAplicabilidad; zonas: string[] }
export interface AplicabilidadFenologia { desde: string; hasta: string }
export interface AplicabilidadPeriodo { meses_desde: number; meses_hasta: number }
export interface AplicabilidadDefinicion { zona?: AplicabilidadZona; fenologia?: AplicabilidadFenologia; periodo?: AplicabilidadPeriodo }

export interface ReglaAgronomicaV2 {
  id: string; clave: string; version: string; cultivo: string;
  estado: "experimental" | "revisada" | "vigente" | "retirada";
  nombre?: string; categoria?: string;
  evaluabilidad?: "EVALUABLE" | "PARCIALMENTE_EVALUABLE" | "NO_EVALUABLE" | "PENDIENTE_EVIDENCIA";
  ventana_dias: number; fuente_tecnica: string | null; limitaciones_declaradas: string | null;
  validado_por: string | null; validado_en: string | null; condiciones_revision: string | null;
  decisiones_pendientes: string[];
  tipo_regla?: TipoRegla; grupo_plaga?: string | null; especie?: string | null;
  nivel_evidencia_climatica?: "alto" | "medio" | "bajo" | "muy_bajo" | null;
  definicion: { niveles: NivelRegla[]; sin_coincidencia?: { estado: string; motivo?: string }; aplicabilidad?: AplicabilidadDefinicion };
}

// Contexto que necesita resolverAplicabilidad para evaluar una regla de plaga.
// zona y fenologiaEstadio quedan opcionales a propósito: el motor tiene que poder
// evaluar reglas puramente climáticas sin que nadie los provea (ver engine-v2.ts).
export interface ContextoEvaluacion { zona?: string; fenologiaEstadio?: string; fechaRef?: string }
export interface ResultadoAplicabilidad { aplica: boolean; submotivo?: string; fenologiaNoEstimable?: boolean }

export type PlagaEstadoCatalogo = typeof PLAGA_ESTADOS_CATALOGO[number];
export interface CatalogoPlaga {
  id: string; cultivo: string; grupo_plaga: string; especie: string | null;
  nombre: string; nombre_cientifico: string | null; tipo_regla: TipoRegla;
  estado_catalogo: PlagaEstadoCatalogo; version: string;
  created_at: string; updated_at: string;
}

export interface DashboardMetrics {
  consultas: { total: number; ultimos_7_dias: number; ultimos_30_dias: number };
  por_estado_general: { estado_general: string; total: number }[];
  por_confianza: { confianza: string; total: number }[];
  reglas_activas: number;
  cultivos_activos: number;
}

export interface Cultivo {
  id: string; clave: string; nombre: string; activo: boolean;
  feature_flag: string | null; created_at: string; updated_at: string;
}

export interface ZonaAgronomica {
  id: string; clave: string; nombre: string;
  definicion_geografica: Record<string, unknown> | null;
  activa: boolean; created_at: string; updated_at: string;
}

export type RegionalPrioridad = typeof REGIONAL_PRIORIDADES[number];
export type RegionalEstado = typeof REGIONAL_ESTADOS[number];
export interface PlagaRegional {
  id: string; plaga_id: string; zona_id: string; zona_clave?: string; zona_nombre?: string;
  prioridad: RegionalPrioridad; meses_desde: number | null; meses_hasta: number | null;
  fuente_id: string | null; fecha_fuente: string | null;
  validado_por: string | null; fecha_validacion: string | null;
  vigencia_desde: string; vigencia_hasta: string | null;
  estado: RegionalEstado; observaciones: string | null;
  created_at: string; updated_at: string;
}
export interface EvaluacionObservada { variable: SpecVariable; agregador: AggregatorKey; valor: number; unidad: string; umbral: string; cumple: boolean; cobertura: number; }
export interface ResultadoReglaV2 { riesgo: string; regla: { clave: string; version: string; estado: ReglaAgronomicaV2["estado"]; modo?: "estable" | "experimental"; nombre?: string; categoria?: string; evaluabilidad?: ReglaAgronomicaV2["evaluabilidad"] }; estado: string; etiqueta?: string; explicacion?: string; recomendacion?: string; fuente_tecnica?: string | null; limitaciones_declaradas?: string | null; orden_visual?: number; ventana: { desde: string; hasta: string; dias: number }; observado: EvaluacionObservada[]; calidad_dato: { cobertura_min: number; dias_faltantes: number; distancia_punto_km: number | null }; motivo?: string; detalle?: Record<string, unknown>; evaluado_en: string; }
export interface ContextoFenologico { disponible: boolean; detalle?: FenologiaEstimada; motivo?: "proveedor_no_configurado" | "entradas_insuficientes" | "error_proveedor"; estadio_estimado?: string; descripcion?: string; fuente?: string; entradas?: Record<string, string | null>; incertidumbre?: { nota: string }; modifica_reglas: false; }
export interface ResultadoConsultaV2Publica { id: string | null; request_id: string; share_token: string; estado_general: EstadoGeneral; explicacion: string; resumen_consulta?: { descripcion: string; destaque: string }; localidad: LocalidadNormalizada | null; cultivo: string; fecha_ref: string; generado_en: string; proveedor_climatico: string; reglas: ResultadoReglaV2[]; plagas?: { evaluaciones: EvaluacionPlaga[]; disponibilidad: "disponible" | "zona_no_resuelta" }; contexto_fenologico: ContextoFenologico; duracion_ms: number; clima: { serie: SerieClimaticaDiaria[]; rango_temporal: { desde: string; hasta: string }; cobertura: number; variables_disponibles: string[]; variables_faltantes?: string[]; dias_solicitados?: number; dias_disponibles?: number; obtenido_en?: string; adapter_version: string }; }

export type TipoReglaPlaga = "climatica" | "prioridad_monitoreo";
export type EstadoEvaluacionPlaga = "favorabilidad_alta" | "favorabilidad_moderada" | "periodo_relevante_monitoreo" | "sin_condiciones_destacadas" | "indeterminado" | "no_evaluada";
export type MotivoEvaluacionPlaga = "fuera_zona" | "fuera_fenologia" | "fuera_periodo" | "fenologia_no_disponible" | "datos_insuficientes" | "configuracion_incompleta" | "sin_nivel_coincidente";
export type PrioridadRegionalPlaga = "principal" | "variable" | "sin_evidencia_suficiente";
export type NivelEvidenciaClimatica = "alto" | "medio" | "bajo" | "muy_bajo";

export interface NivelPlagaClimatico {
  orden: number;
  estado: Extract<EstadoEvaluacionPlaga, "favorabilidad_alta" | "favorabilidad_moderada" | "sin_condiciones_destacadas">;
  combinador: "all" | "any";
  condiciones: Array<{ indicador: IndicadorPlaga; operador: SpecOperator; valor: number }>;
}

export type IndicadorPlaga = "temp_media_7d" | "temp_media_10d" | "temp_max_media_10d" | "dias_calidos_10d" | "precip_7d" | "precip_10d" | "dias_con_lluvia_7d" | "dias_consecutivos_sin_lluvia";

export interface ReglaPlaga {
  id: string;
  version: string;
  cultivo: "soja";
  grupo_plaga: string;
  especies: string[];
  tipo_regla: TipoReglaPlaga;
  estado: "experimental" | "revisada" | "vigente" | "retirada";
  activa: boolean;
  nivel_evidencia_climatica: NivelEvidenciaClimatica;
  variables_requeridas: IndicadorPlaga[];
  fenologia_desde: string | null;
  fenologia_hasta: string | null;
  configuracion: { niveles?: NivelPlagaClimatico[]; umbral_dia_lluvia_mm: number; tipo_agregacion_termica?: "temp_media" | "temp_max_media" | "dias_calidos"; umbral_termico?: number; cantidad_dias_minima?: number };
  textos: { por_que_se_muestra: string; estado: string; que_significa: string; que_observar: string; seguimiento: string; evidencia_tecnica: string };
}

export interface AsociacionRegionalPlaga {
  id: string;
  zona_agronomica: string;
  prioridad: PrioridadRegionalPlaga;
  meses_desde: number | null;
  meses_hasta: number | null;
  aplicable: boolean;
  version: string;
}

export interface EvaluacionPlaga {
  grupo: string;
  especies: string[];
  tipo_regla: TipoReglaPlaga;
  estado: EstadoEvaluacionPlaga;
  motivo?: MotivoEvaluacionPlaga;
  zona: string;
  prioridad_regional: PrioridadRegionalPlaga;
  fenologia: { estado: string; tipo: "estimada" } | null;
  regla: string;
  version: string;
  nivel_evidencia_climatica: NivelEvidenciaClimatica;
  calidad_dato: "alta" | "media" | "baja";
  fuera_periodo_habitual?: boolean;
  indicadores: Partial<Record<IndicadorPlaga, number>>;
  cobertura: Partial<Record<IndicadorPlaga, number>>;
  textos: ReglaPlaga["textos"];
  evaluado_en: string;
}
