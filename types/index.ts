import type { AdminRole } from "@/lib/admin/auth";
import type { ADMIN_USER_ESTADOS } from "@/lib/admin/user-spec";
import type { API_KEY_SCOPES, EMPRESA_ESTADOS } from "@/lib/empresas/spec";
import type {
  PLAGA_ESTADOS_CATALOGO,
  REGIONAL_ESTADOS,
  REGIONAL_PRIORIDADES,
  REGLA_ESTADOS,
  SPEC_AGGREGATORS,
  SPEC_OPERATORS,
  SPEC_VARIABLES,
  TIPOS_REGLA,
} from "@/lib/rules/condition-spec";
import type { GRUPOS_MADUREZ } from "@/lib/phenology/spec";

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
  share_token: string; interaction_token?: string;
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

export type GrupoMadurez = (typeof GRUPOS_MADUREZ)[number];

export interface HitoFenologico {
  codigo: string;
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
export interface ConsultaInput {
  cultivo: string;
  localidad: string;
  fechaSiembra?: string;
  grupoMadurez?: string;
  cultivar?: string;
  etapaFenologica?: string;
  sessionId?: string;
  canal?: CanalConsulta;
  fechaRef?: string;
  /** Lote cuyos datos de campo vigentes se aplican (requiere acceso). */
  lotId?: string;
}
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
  humedadSuelo: {
    profundidad0a1cm: number | null;
    profundidad1a3cm: number | null;
    profundidad3a9cm: number | null;
    profundidad9a27cm: number | null;
    profundidad27a81cm: number | null;
  };
  temperaturaSuelo: {
    profundidad0cm: number | null;
    profundidad6cm: number | null;
    profundidad18cm: number | null;
    profundidad54cm: number | null;
  };
  radiacionSolar: number | null;
  /** Horas de mojado foliar medidas por sensor o modelo calibrado. */
  leafWetnessHours?: number | null;
}
/** Información futura complementaria. No participa de la evaluación agronómica. */
export interface PrevisionClimaticaDiaria {
  fecha: string;
  codigoMeteorologico: number | null;
  temperaturaMinima: number | null;
  temperaturaMaxima: number | null;
  precipitacion: number | null;
  humedadRelativa: number | null;
  vientoMedio: number | null;
}
export type AggregatorKey = (typeof SPEC_AGGREGATORS)[number];
export type SpecOperator = (typeof SPEC_OPERATORS)[number];
export type SpecVariable = (typeof SPEC_VARIABLES)[number];
export type EstadoResultadoRegla =
  | "no_evaluable"
  | "sin_condiciones"
  | "informativo"
  | "vigilancia"
  | "moderado"
  | "alto"
  | "critico"
  | "favorable"
  | "requiere_validacion_agronoma";
/** Estado normalizado para reglas, avisos técnicos y su consolidación. */
export type RiskStatus = EstadoResultadoRegla;
export type ValidationStatus =
  | "validada"
  | "requiere_calibracion_local"
  | "requiere_validacion_agronoma";
export type EvidenceLevel = "alta" | "media" | "limitada";
export interface CondicionDefinicion {
  variable: SpecVariable;
  agregador: AggregatorKey;
  operador: SpecOperator;
  valor: number | [number, number];
  unidad: string;
  cobertura_minima?: number;
  subcondicion?: { operador: SpecOperator; valor: number; unidad: string };
  provisorio?: boolean;
}
export interface NivelRegla {
  orden: number;
  clave: string;
  orden_visual: number;
  etiqueta: string;
  explicacion?: string;
  recomendacion?: string;
  condiciones: CondicionDefinicion[];
}
export interface CondicionesLogicasRegla {
  niveles?: NivelRegla[];
  all?: CondicionDefinicion[];
  sin_coincidencia?: { estado: string; motivo?: string };
}

// tipo_regla es del catálogo administrable de plagas (catalogo_plagas), no de
// reglas_agronomicas: el motor de plagas que corre en producción es lib/pests/engine.ts
// sobre reglas_plagas, no engine-v2.ts (ver docs/panel-admin-fase-0-1.md, "Hallazgo").
export type TipoRegla = (typeof TIPOS_REGLA)[number];

export interface ReglaAgronomicaV2 {
  id: string;
  clave: string;
  version: string;
  cultivo: string;
  estado: "experimental" | "revisada" | "vigente" | "retirada";
  nombre?: string;
  categoria?: string;
  nombre_cientifico?: string | null;
  /** Clave de categorias_agronomicas vinculada por categoria_id; agrupa la regla en el resumen. */
  categoria_clave?: string | null;
  cultivo_id?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  nombre_regla?: string | null;
  evaluabilidad?:
    | "EVALUABLE"
    | "PARCIALMENTE_EVALUABLE"
    | "NO_EVALUABLE"
    | "PENDIENTE_EVIDENCIA";
  ventana_dias: number;
  fuente_tecnica: string | null;
  limitaciones_declaradas: string | null;
  validado_por: string | null;
  validado_en: string | null;
  condiciones_revision: string | null;
  decisiones_pendientes: string[];
  definicion: {
    niveles: NivelRegla[];
    sin_coincidencia?: { estado: string; motivo?: string };
  };
  variables_requeridas?: string[];
  /** Indispensables para calcular la regla; si falta una, la regla no eleva el riesgo. */
  critical_required_variables?: string[] | null;
  /** Mejoran la recomendación; si faltan, la regla se evalúa igual y se piden como dato. */
  complementary_required_variables?: string[] | null;
  condiciones_logicas?: CondicionesLogicasRegla;
  etapa_fenologica_desde?: string | null;
  etapa_fenologica_hasta?: string | null;
  zadoks_desde?: number | null;
  zadoks_hasta?: number | null;
  texto_alerta?: string | null;
  texto_no_evaluable?: string | null;
  accion_sugerida?: string | null;
  requiere_validacion_agronomica?: boolean;
  url_fuente?: string | null;
  nivel_evidencia?: string | null;
  prioridad?: number;
  validation_status?: ValidationStatus | null;
  evidence_level?: EvidenceLevel | null;
  source_name?: string | null;
  source_url?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  nivel_resultado?:
    | "no_evaluable"
    | "sin_condiciones"
    | "informativo"
    | "vigilancia"
    | "moderado"
    | "alto"
    | "critico"
    | "favorable"
    | null;
}

export type PlagaEstadoCatalogo = (typeof PLAGA_ESTADOS_CATALOGO)[number];
export interface CatalogoPlaga {
  id: string;
  cultivo: string;
  grupo_plaga: string;
  especie: string | null;
  nombre: string;
  nombre_cientifico: string | null;
  tipo_regla: TipoRegla;
  estado_catalogo: PlagaEstadoCatalogo;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  consultas: { total: number; ultimos_7_dias: number; ultimos_30_dias: number };
  por_estado_general: { estado_general: string; total: number }[];
  por_confianza: { confianza: string; total: number }[];
  reglas_activas: number;
  cultivos_activos: number;
}

export interface Cultivo {
  id: string;
  clave: string;
  nombre: string;
  activo: boolean;
  feature_flag: string | null;
  created_at: string;
  updated_at: string;
}

export type EmpresaEstado = (typeof EMPRESA_ESTADOS)[number];
export interface Empresa {
  id: string;
  nombre: string;
  contacto_nombre: string | null;
  contacto_email: string | null;
  estado: EmpresaEstado;
  created_at: string;
  updated_at: string;
}

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

// Nunca incluye key_hash — ver lib/empresas/api-keys-repository.ts.
export interface ApiKeyAdmin {
  id: string;
  nombre: string;
  empresa_id: string | null;
  scopes: ApiKeyScope[];
  activa: boolean;
  revocada_at: string | null;
  expira_at: string | null;
  limite_mensual: number | null;
  created_at: string;
}

export interface ApiKeyConUso extends ApiKeyAdmin {
  uso_mes_actual: number;
}

// La clave en texto plano solo existe en la respuesta del alta — no se puede
// volver a consultar después (mismo patrón que cualquier API key real).
export interface ApiKeyCreada extends ApiKeyAdmin {
  key: string;
}

export type AdminUserEstado = (typeof ADMIN_USER_ESTADOS)[number];

// Nunca incluye password_hash — ver lib/usuarios/repository.ts.
export interface AdminUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: AdminRole;
  estado: AdminUserEstado;
  invitado_por: string | null;
  invitado_por_nombre?: string | null;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditoriaEntry {
  id: string;
  actor_id: string;
  actor_tipo: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  valor_anterior: unknown;
  valor_nuevo: unknown;
  request_id: string;
  created_at: string;
}

export interface ZonaAgronomica {
  id: string;
  clave: string;
  nombre: string;
  definicion_geografica: Record<string, unknown> | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

// Coeficientes administrables del modelo de fenología (plan §3.3): el set de hitos
// en sí, cuántos días después de la siembra ocurre cada uno por grupo de madurez,
// y el margen de error. offsets_dias[grupo] siempre tiene la misma longitud que
// hitos, en el mismo orden (ver lib/security/validation.ts).
export interface HitoModeloFenologico {
  codigo: string;
  nombre: string;
}
export interface ModeloFenologicoParametros {
  hitos: HitoModeloFenologico[];
  offsets_dias: Record<GrupoMadurez, number[]>;
  margen_dias: number;
}

export type ModeloFenologicoEstado = (typeof REGLA_ESTADOS)[number];
export interface ModeloFenologico {
  id: string;
  cultivo: string;
  version: string;
  estado: ModeloFenologicoEstado;
  proveedor: string;
  parametros: ModeloFenologicoParametros;
  fuente_tecnica: string | null;
  validado_por: string | null;
  validado_en: string | null;
  created_at: string;
  updated_at: string;
}

export type RegionalPrioridad = (typeof REGIONAL_PRIORIDADES)[number];
export type RegionalEstado = (typeof REGIONAL_ESTADOS)[number];
export interface PlagaRegional {
  id: string;
  plaga_id: string;
  zona_id: string;
  zona_clave?: string;
  zona_nombre?: string;
  prioridad: RegionalPrioridad;
  meses_desde: number | null;
  meses_hasta: number | null;
  fuente_id: string | null;
  fecha_fuente: string | null;
  validado_por: string | null;
  fecha_validacion: string | null;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  estado: RegionalEstado;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}
export interface EvaluacionObservada {
  variable: SpecVariable;
  agregador: AggregatorKey;
  valor: number;
  unidad: string;
  umbral: string;
  cumple: boolean;
  cobertura: number;
  /** Origen cuando el valor viene de un dato de lote vigente; ausente = estimación climática. */
  fuente?: FieldValueSource;
}
export interface ResultadoReglaV2 {
  riesgo: string;
  regla: {
    clave: string;
    version: string;
    estado: ReglaAgronomicaV2["estado"];
    modo?: "estable" | "experimental";
    nombre?: string;
    categoria?: string;
    categoria_clave?: string | null;
    evaluabilidad?: ReglaAgronomicaV2["evaluabilidad"];
    prioridad?: number;
    validation_status?: ValidationStatus | null;
    evidence_level?: EvidenceLevel | null;
    source_name?: string | null;
    source_url?: string | null;
    reviewed_at?: string | null;
    notes?: string | null;
    critical_required_variables?: string[];
    complementary_required_variables?: string[];
    /** id de reglas_agronomicas (para trazabilidad del detalle). */
    id?: string;
    nombre_cientifico?: string | null;
  };
  estado: EstadoResultadoRegla;
  etiqueta?: string;
  explicacion?: string;
  recomendacion?: string;
  fuente_tecnica?: string | null;
  limitaciones_declaradas?: string | null;
  orden_visual?: number;
  ventana: { desde: string; hasta: string; dias: number };
  observado: EvaluacionObservada[];
  calidad_dato: {
    cobertura_min: number;
    dias_faltantes: number;
    distancia_punto_km: number | null;
  };
  motivo?: string;
  detalle?: Record<string, unknown>;
  /** Críticas sin dato en esta consulta (sólo en resultados incompletos). */
  missing_critical_variables?: string[];
  /** Datos complementarios sin valor en esta consulta; no afectan el estado. */
  missing_complementary_variables?: string[];
  evaluado_en: string;
}
export type AdvisoryScopeType = "global" | "region" | "farm" | "field";
export type AdvisorySourceType =
  | "agronomic_validation"
  | "official_alert"
  | "field_observation"
  | "technical_report";
export interface AgronomicAdvisory {
  id: string;
  crop_id: string | null;
  category_id: string;
  category_key?: string;
  scope_type: AdvisoryScopeType;
  scope_id: string | null;
  status: Extract<RiskStatus, "informativo" | "vigilancia" | "moderado" | "alto" | "critico">;
  title: string;
  message: string;
  recommended_action: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  priority: number;
  source_type: AdvisorySourceType;
  source_name: string;
  source_url: string | null;
  validated_by: string;
  reviewed_at: string;
  notes: string | null;
}
export interface RiskCategory {
  id: string;
  key: string;
  name: string;
}
/** Origen de un valor usado por una regla. */
export type FieldValueSource = "field_data" | "sensor" | "import" | "calculated";
export type VariableValueSource = FieldValueSource | "weather";
/** Una regla cuyas condiciones se cumplieron, tal como se muestra en el detalle. */
export interface MatchedRule {
  rule_id: string;
  rule_name: string;
  scientific_name?: string;
  internal_status: RiskStatus;
  display_status: string;
  message: string;
  recommended_action: string;
  variables_used: Array<{ key: string; source: VariableValueSource }>;
  required_data: Array<{ variable: string; label: string }>;
  source_name?: string;
  source_url?: string;
  reviewed_at?: string;
}
/** Qué datos usó una consulta y de dónde salieron (sólo cuando se envía lot_id). */
export interface DataProvenance {
  lot_id: string;
  variables: Array<{ key: string; source: VariableValueSource; observed_at?: string; field_datum_id?: string }>;
  advisories: Array<{ category: string; advisory_id: string; title: string }>;
}
export interface RequiredDataItem {
  variable: string;
  label: string;
  reason?: string;
}
export type CalculationCompleteness = "complete" | "partial" | "needs_data";
export type CategoryResolutionSource =
  | "automatic_rule"
  | "agronomic_advisory"
  | "monitoring_fallback"
  /** Alerta técnica vigente + reglas automáticas con coincidencias. */
  | "combined";
/** Valores históricos guardados en resultados compartidos antes del contrato de display. */
export type LegacyCategoryResolutionSource = "automatic" | "combined";
export interface ConsolidatedCategoryRisk {
  category: string;
  /** Estado del motor; sólo para administración, auditoría y soporte. */
  internal_status: RiskStatus;
  /** Texto de producto; la UI de usuario usa este campo, nunca internal_status. */
  display_status: string;
  title: string;
  message: string;
  recommended_action: string;
  required_data: RequiredDataItem[];
  calculation_completeness: CalculationCompleteness;
  resolution_source: CategoryResolutionSource;
  /** Todas las reglas con condiciones cumplidas; la primera es el resultado principal. */
  matched_rules: MatchedRule[];
  /** Coincidencias (por nombre) que no entran en el resumen de la tarjeta (máx. 3 visibles). */
  additional_matches_count: number;
  reviewed_at?: string;
  validated_by?: string;
  automatic_result?: {
    status: RiskStatus;
    missing_variables: string[];
  };
  evaluated_rules: ResultadoReglaV2[];
  applied_advisories: AgronomicAdvisory[];
}
/** Forma persistida por versiones anteriores (status + resolution_source legacy). */
export type StoredCategoryRisk =
  | ConsolidatedCategoryRisk
  | (Omit<ConsolidatedCategoryRisk, "internal_status" | "display_status" | "required_data" | "calculation_completeness" | "resolution_source" | "matched_rules" | "additional_matches_count"> &
      Partial<Pick<ConsolidatedCategoryRisk, "display_status" | "required_data" | "calculation_completeness" | "matched_rules" | "additional_matches_count">> & {
        status: RiskStatus;
        resolution_source: CategoryResolutionSource | LegacyCategoryResolutionSource;
      });
export type EstadoCoberturaAnalisis =
  "datos_completos" | "datos_parciales" | "datos_insuficientes";
export interface EvaluacionLimitadaPorClima {
  riesgo: string;
  categoria?: string;
  variable?: string;
  dias_esperados: number;
  dias_disponibles: number;
  dias_faltantes: number;
  cobertura: number;
  motivo: "datos_insuficientes";
}
export interface CoberturaAnalisis {
  cobertura: number;
  estado: EstadoCoberturaAnalisis;
  variables_faltantes_relevantes: string[];
  evaluaciones_limitadas: EvaluacionLimitadaPorClima[];
}
export interface ContextoFenologico {
  disponible: boolean;
  detalle?: FenologiaEstimada;
  motivo?:
    "proveedor_no_configurado" | "entradas_insuficientes" | "error_proveedor";
  estadio_estimado?: string;
  codigo_zadoks?: number | null;
  descripcion?: string;
  fuente?: string;
  entradas?: Record<string, string | null>;
  incertidumbre?: { nota: string };
  modifica_reglas: false;
}
export interface ResultadoConsultaV2Publica {
  id: string | null;
  request_id: string;
  share_token: string;
  interaction_token?: string;
  estado_general: EstadoGeneral;
  explicacion: string;
  resumen_consulta?: { descripcion: string; destaque: string };
  localidad: LocalidadNormalizada | null;
  cultivo: string;
  fecha_ref: string;
  generado_en: string;
  proveedor_climatico: string;
  reglas: ResultadoReglaV2[];
  categorias?: StoredCategoryRisk[];
  plagas?: {
    evaluaciones: EvaluacionPlaga[];
    disponibilidad: "disponible" | "zona_no_resuelta";
  };
  contexto_fenologico: ContextoFenologico;
  duracion_ms: number;
  clima: {
    serie: SerieClimaticaDiaria[];
    rango_temporal: { desde: string; hasta: string };
    cobertura: number;
    variables_disponibles: string[];
    variables_faltantes?: string[];
    dias_solicitados?: number;
    dias_disponibles?: number;
    obtenido_en?: string;
    adapter_version: string;
  };
  historico_temperatura?: import("@/lib/climate/historical-provider").HistoricalTemperature;
  calidad_analisis?: CoberturaAnalisis;
  prevision?: PrevisionClimaticaDiaria[];
}

export type TipoReglaPlaga = "climatica" | "prioridad_monitoreo";
export type EstadoEvaluacionPlaga =
  | "favorabilidad_alta"
  | "favorabilidad_moderada"
  | "periodo_relevante_monitoreo"
  | "sin_condiciones_destacadas"
  | "indeterminado"
  | "no_evaluada";
export type MotivoEvaluacionPlaga =
  | "fuera_zona"
  | "fuera_fenologia"
  | "fuera_periodo"
  | "fenologia_no_disponible"
  | "datos_insuficientes"
  | "configuracion_incompleta"
  | "sin_nivel_coincidente";
export type PrioridadRegionalPlaga =
  "principal" | "variable" | "sin_evidencia_suficiente";
export type NivelEvidenciaClimatica = "alto" | "medio" | "bajo" | "muy_bajo";

export interface NivelPlagaClimatico {
  orden: number;
  estado: Extract<
    EstadoEvaluacionPlaga,
    | "favorabilidad_alta"
    | "favorabilidad_moderada"
    | "sin_condiciones_destacadas"
  >;
  combinador: "all" | "any";
  condiciones: Array<{
    indicador: IndicadorPlaga;
    operador: SpecOperator;
    valor: number;
  }>;
}

export type IndicadorPlaga =
  | "temp_media_7d"
  | "temp_media_10d"
  | "temp_max_media_10d"
  | "dias_calidos_10d"
  | "precip_7d"
  | "precip_10d"
  | "dias_con_lluvia_7d"
  | "dias_consecutivos_sin_lluvia";

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
  configuracion: {
    niveles?: NivelPlagaClimatico[];
    umbral_dia_lluvia_mm: number;
    tipo_agregacion_termica?: "temp_media" | "temp_max_media" | "dias_calidos";
    umbral_termico?: number;
    cantidad_dias_minima?: number;
  };
  textos: {
    por_que_se_muestra: string;
    estado: string;
    que_significa: string;
    que_observar: string;
    seguimiento: string;
    evidencia_tecnica: string;
  };
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
