import { createInteractionToken } from "@/lib/security/consultation-token";
import type { ClimateSeriesProvider } from "@/lib/climate/contract";
import { OpenMeteoAdapter } from "@/lib/climate/open-meteo-adapter";
import {
  HistoricalClimateProvider,
  type HistoricalTemperature,
} from "@/lib/climate/historical-provider";
import {
  normalizeLocalidad,
  resolveLocalidad,
} from "@/lib/localidades/normalize";
import type { PhenologyProviderV2 } from "@/lib/phenology/provider-v2";
import { CalculatedPhenologyProvider } from "@/lib/phenology/provider-v2";
import { getCodigoZadoksEtapa } from "@/lib/phenology/stage-repository";
import { getReglasVigentes } from "@/lib/rules/repository-v2";
import { getActiveRiskCategories } from "@/lib/rules/category-repository";
import { consolidateCategoryRisks } from "@/lib/rules/consolidation";
import { getActiveAgronomicAdvisories } from "@/lib/advisories/repository";
import { loadVariableLabels } from "@/lib/variables/repository";
import { dataProvenance, evaluateRules, loadLotContext, type LotContextDependencies } from "@/lib/rules/evaluation-core";
import type { LotActor } from "@/lib/lots/access";
import type { ConsolidatedCategoryRisk, DataProvenance } from "@/types";
import { ScoreEngineV2 } from "@/lib/rules/score-v2";
import { buildConsultationSummary } from "@/lib/results/consultation-summary";
import { calculateAnalysisQuality } from "@/lib/results/analysis-quality";
import { featureFlags } from "@/lib/config/featureFlags";
import { PestRulesEngine } from "@/lib/pests/engine";
import { getAsociacionRegional, getReglasPlagas } from "@/lib/pests/repository";
import { resolveAgronomicZone } from "@/lib/pests/zone-resolver";
import { persistConsultaV2 } from "./repository-v2";
import type {
  AsociacionRegionalPlaga,
  CoberturaAnalisis,
  ConsultaInput,
  ContextoFenologico,
  EstadoGeneral,
  EvaluacionPlaga,
  PrevisionClimaticaDiaria,
  ReglaAgronomicaV2,
  ReglaPlaga,
  ResultadoReglaV2,
  RiskCategory,
  AgronomicAdvisory,
} from "@/types";

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface ConsultaResultadoV2 {
  id: string | null;
  /** Sólo cuando la consulta se hizo con lot_id. */
  lot_id?: string;
  data_provenance?: DataProvenance;
  /** Resultado consolidado por categoría (cuando hay categorías administrables). */
  categorias?: ConsolidatedCategoryRisk[];
  request_id: string;
  share_token: string;
  interaction_token?: string;
  estado_general: EstadoGeneral;
  explicacion: string;
  resumen_consulta: { descripcion: string; destaque: string };
  localidad: ReturnType<typeof normalizeLocalidad>;
  cultivo: string;
  fecha_ref: string;
  generado_en: string;
  proveedor_climatico: string;
  reglas: ResultadoReglaV2[];
  plagas?: {
    evaluaciones: EvaluacionPlaga[];
    disponibilidad: "disponible" | "zona_no_resuelta";
  };
  contexto_fenologico: ContextoFenologico;
  duracion_ms: number;
  calidad_analisis: CoberturaAnalisis;
  clima: {
    serie: Awaited<ReturnType<ClimateSeriesProvider["obtenerSerie"]>>["serie"];
    rango_temporal: { desde: string; hasta: string };
    cobertura: number;
    variables_disponibles: string[];
    variables_faltantes: string[];
    dias_solicitados: number;
    dias_disponibles: number;
    obtenido_en: string;
    adapter_version: string;
  };
  prevision?: PrevisionClimaticaDiaria[];
  historico_temperatura?: HistoricalTemperature;
}

interface Dependencies extends LotContextDependencies {
  climate?: ClimateSeriesProvider;
  phenology?: PhenologyProviderV2;
  resolveStageCode?: (cultivo: string, etapa: string) => Promise<number | null>;
  loadRules?: (cultivo: string) => Promise<ReglaAgronomicaV2[]>;
  loadCategories?: () => Promise<RiskCategory[]>;
  /** Etiquetas administrables del catálogo de variables (clave → etiqueta visible). */
  loadVariableLabels?: () => Promise<ReadonlyMap<string, string>>;
  loadAdvisories?: (cropId: string, scope: { regionId?: string | null; farmId?: string | null; fieldId?: string | null }, at: string) => Promise<AgronomicAdvisory[]>;
  persist?: typeof persistConsultaV2;
  resolveLocation?: typeof resolveLocalidad;
  enablePests?: boolean;
  loadPestRules?: (cultivo: string) => Promise<ReglaPlaga[]>;
  resolvePestZone?: (
    localidad: ReturnType<typeof normalizeLocalidad>,
  ) => Promise<string | null>;
  loadPestRegion?: (
    ruleId: string,
    zone: string,
  ) => Promise<AsociacionRegionalPlaga | null>;
}

export class ConsultaService {
  constructor(private readonly dependencies: Dependencies = {}) {}
  async ejecutar(
    input: ConsultaInput,
    requestId = crypto.randomUUID(),
    context: { actor?: LotActor } = {},
  ): Promise<ConsultaResultadoV2> {
    const started = performance.now();
    const cultivo = input.cultivo.trim().toLowerCase();
    const cultivoHabilitado =
      cultivo === "soja" || (cultivo === "trigo" && featureFlags.enableTrigo);
    if (!cultivoHabilitado)
      throw new DomainError(
        "CULTIVO_NO_SOPORTADO",
        "Avizor todavía no cubre ese cultivo.",
      );
    let localidad;
    try {
      localidad = await (this.dependencies.resolveLocation ?? resolveLocalidad)(
        input.localidad,
      );
    } catch {
      throw new DomainError(
        "DATOS_CLIMATICOS_NO_DISPONIBLES",
        "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos.",
        503,
      );
    }
    if (!localidad)
      throw new DomainError(
        "LOCALIDAD_NO_ENCONTRADA",
        "No encontramos esa localidad. Probá con el nombre completo.",
        404,
      );
    const fechaRef = normalizeDate(input.fechaRef);
    // Lote: se valida acceso antes de cualquier otra lectura; sin lot_id no cambia nada.
    const { lot, fieldData } = await loadLotContext(input.lotId, context.actor ?? { kind: "anonymous" }, `${fechaRef}T12:00:00.000Z`, this.dependencies);
    const rules = await (this.dependencies.loadRules ?? getReglasVigentes)(
      cultivo,
    );
    if (!rules.length)
      throw new DomainError(
        "REGLA_NO_ENCONTRADA",
        "No hay reglas vigentes para evaluar esta consulta.",
        503,
      );
    let climate;
    try {
      climate = await (
        this.dependencies.climate ?? new OpenMeteoAdapter()
      ).obtenerSerie({ localidad, fechaRef, dias: 14 });
    } catch {
      throw new DomainError(
        "DATOS_CLIMATICOS_NO_DISPONIBLES",
        "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos.",
        503,
      );
    }

    const evaluatedAt = `${fechaRef}T12:00:00.000Z`;
    let phenology: ContextoFenologico;
    try {
      phenology = await (
        this.dependencies.phenology ?? new CalculatedPhenologyProvider()
      ).estimarEstadio({
        fechaSiembra: input.fechaSiembra,
        grupoMadurez: input.grupoMadurez,
        cultivar: input.cultivar,
        latitud: localidad.latitud,
        longitud: localidad.longitud,
        fechaRef,
        cultivo,
      });
    } catch {
      phenology = {
        disponible: false,
        motivo: "error_proveedor",
        modifica_reglas: false,
      };
    }
    if (input.etapaFenologica) {
      const codigoZadoks = await (
        this.dependencies.resolveStageCode ?? getCodigoZadoksEtapa
      )(cultivo, input.etapaFenologica);
      phenology = {
        disponible: true,
        estadio_estimado: input.etapaFenologica,
        descripcion: input.etapaFenologica,
        fuente: "Etapa informada manualmente",
        entradas: { etapa_fenologica: input.etapaFenologica },
        incertidumbre: {
          nota: "Etapa informada por la persona usuaria; no es una estimación automática.",
        },
        modifica_reglas: false,
        codigo_zadoks: codigoZadoks,
      };
    }
    const results = evaluateRules({ rules, series: climate.serie, evaluatedAt, phenology, fieldData });
    const categories = await (this.dependencies.loadCategories ?? getActiveRiskCategories)();
    const advisories = await (this.dependencies.loadAdvisories ?? getActiveAgronomicAdvisories)(
      cultivo,
      lot ? { fieldId: lot.id } : {},
      evaluatedAt,
    );
    const labels = await (this.dependencies.loadVariableLabels ?? loadVariableLabels)();
    const categorias = consolidateCategoryRisks(categories, results, advisories, { labels });
    const baseScore = new ScoreEngineV2().evaluate(results);
    const score = baseScore;
    const calidadAnalisis = calculateAnalysisQuality(
      results,
      climate.cobertura,
    );
    const historicoTemperatura = await new HistoricalClimateProvider()
      .comparar(localidad, climate.serie)
      .catch(() => undefined);
    const pestsEnabled =
      this.dependencies.enablePests ?? featureFlags.enablePlagas;
    let plagas: ConsultaResultadoV2["plagas"];
    if (pestsEnabled) {
      const zone = await (
        this.dependencies.resolvePestZone ?? resolveAgronomicZone
      )(localidad);
      plagas = zone
        ? {
            evaluaciones: await this.evaluatePests(
              cultivo,
              zone,
              climate.serie,
              phenology,
              fechaRef,
              evaluatedAt,
            ),
            disponibilidad: "disponible",
          }
        : { evaluaciones: [], disponibilidad: "zona_no_resuelta" };
    }
    const result: ConsultaResultadoV2 = {
      id: null,
      request_id: requestId,
      share_token: crypto.randomUUID(),
      estado_general: score.estadoGeneral,
      explicacion: score.explicacion,
      resumen_consulta: buildConsultationSummary(results),
      localidad,
      cultivo,
      fecha_ref: fechaRef,
      generado_en: new Date().toISOString(),
      proveedor_climatico: climate.proveedor,
      reglas: results,
      ...(categorias.length ? { categorias } : {}),
      ...(plagas ? { plagas } : {}),
      contexto_fenologico: phenology,
      ...(lot ? { lot_id: lot.id, data_provenance: dataProvenance(lot.id, results, fieldData, categorias) } : {}),
      calidad_analisis: calidadAnalisis,
      clima: {
        serie: climate.serie,
        rango_temporal: climate.rangoTemporal,
        cobertura: climate.cobertura,
        variables_disponibles: climate.variablesDisponibles,
        variables_faltantes: climate.variablesFaltantes,
        dias_solicitados: climate.diasSolicitados,
        dias_disponibles: climate.diasDisponibles,
        obtenido_en: climate.obtenidoEn,
        adapter_version: climate.adapterVersion,
      },
      ...(historicoTemperatura
        ? { historico_temperatura: historicoTemperatura }
        : {}),
      ...(climate.prevision.length ? { prevision: climate.prevision } : {}),
      duracion_ms: Math.round(performance.now() - started),
    };
    const interactionToken = createInteractionToken();
    result.id = await (this.dependencies.persist ?? persistConsultaV2)({
      input: {
        ...input,
        cultivo,
        localidad: input.localidad.trim(),
        canal: input.canal ?? "web",
        fechaRef,
      },
      localidad,
      climate,
      rules,
      result,
      interactionToken,
    });
    if (result.id) result.interaction_token = interactionToken;
    return result;
  }

  private async evaluatePests(
    cultivo: string,
    zone: string,
    series: Awaited<ReturnType<ClimateSeriesProvider["obtenerSerie"]>>["serie"],
    phenology: ContextoFenologico,
    fechaRef: string,
    evaluatedAt: string,
  ) {
    const rules = await (this.dependencies.loadPestRules ?? getReglasPlagas)(
      cultivo,
    );
    const engine = new PestRulesEngine();
    const evaluations: EvaluacionPlaga[] = [];
    for (const rule of rules) {
      const region = await (
        this.dependencies.loadPestRegion ?? getAsociacionRegional
      )(rule.id, zone);
      if (region)
        evaluations.push(
          engine.evaluate({
            rule,
            region,
            series,
            phenology,
            fechaRef,
            evaluatedAt,
          }),
        );
    }
    return evaluations;
  }
}

function normalizeDate(value?: string) {
  const date = value ?? new Date().toISOString().slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  )
    throw new DomainError(
      "REQUEST_INVALIDO",
      "La fecha de referencia no es válida.",
    );
  return date;
}

export interface AvizorQueryGateway {
  consultar(input: ConsultaInput): Promise<ConsultaResultadoV2>;
}
export class DefaultAvizorQueryGateway implements AvizorQueryGateway {
  constructor(private readonly service = new ConsultaService()) {}
  consultar(input: ConsultaInput) {
    return this.service.ejecutar(input);
  }
}
