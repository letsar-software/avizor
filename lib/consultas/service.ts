import type { ClimateSeriesProvider } from "@/lib/climate/contract";
import { OpenMeteoAdapter } from "@/lib/climate/open-meteo-adapter";
import { normalizeLocalidad, resolveLocalidad } from "@/lib/localidades/normalize";
import type { PhenologyProviderV2 } from "@/lib/phenology/provider-v2";
import { CalculatedPhenologyProvider } from "@/lib/phenology/provider-v2";
import { getReglasVigentes } from "@/lib/rules/repository-v2";
import { RulesEngineV2 } from "@/lib/rules/engine-v2";
import { ScoreEngineV2 } from "@/lib/rules/score-v2";
import { buildConsultationSummary } from "@/lib/results/consultation-summary";
import { persistConsultaV2 } from "./repository-v2";
import type { ConsultaInput, ContextoFenologico, EstadoGeneral, ReglaAgronomicaV2, ResultadoReglaV2 } from "@/types";

export class DomainError extends Error { constructor(public readonly code: string, message: string, public readonly status = 400, public readonly details: Record<string, unknown> = {}) { super(message); } }

export interface ConsultaResultadoV2 {
  id: string | null; request_id: string; share_token: string; estado_general: EstadoGeneral; explicacion: string;
  resumen_consulta: { descripcion: string; destaque: string };
  localidad: ReturnType<typeof normalizeLocalidad>; cultivo: string; fecha_ref: string; generado_en: string; proveedor_climatico: string;
  reglas: ResultadoReglaV2[]; contexto_fenologico: ContextoFenologico; duracion_ms: number;
  clima: { serie: Awaited<ReturnType<ClimateSeriesProvider["obtenerSerie"]>>["serie"]; rango_temporal: { desde: string; hasta: string }; cobertura: number; variables_disponibles: string[]; variables_faltantes: string[]; dias_solicitados: number; dias_disponibles: number; obtenido_en: string; adapter_version: string };
}

interface Dependencies { climate?: ClimateSeriesProvider; phenology?: PhenologyProviderV2; loadRules?: (cultivo: string) => Promise<ReglaAgronomicaV2[]>; persist?: typeof persistConsultaV2; resolveLocation?: typeof resolveLocalidad; }

export class ConsultaService {
  constructor(private readonly dependencies: Dependencies = {}) {}
  async ejecutar(input: ConsultaInput, requestId = crypto.randomUUID()): Promise<ConsultaResultadoV2> {
    const started = performance.now();
    const cultivo = input.cultivo.trim().toLowerCase();
    if (cultivo !== "soja") throw new DomainError("CULTIVO_NO_SOPORTADO", "Avizor todavía no cubre ese cultivo. Por ahora solo soja está disponible.");
    let localidad;
    try { localidad = await (this.dependencies.resolveLocation ?? resolveLocalidad)(input.localidad); }
    catch { throw new DomainError("DATOS_CLIMATICOS_NO_DISPONIBLES", "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos.", 503); }
    if (!localidad) throw new DomainError("LOCALIDAD_NO_ENCONTRADA", "No encontramos esa localidad. Probá con el nombre completo.", 404);
    const fechaRef = normalizeDate(input.fechaRef);
    const rules = await (this.dependencies.loadRules ?? getReglasVigentes)(cultivo);
    if (!rules.length) throw new DomainError("REGLA_NO_ENCONTRADA", "No hay reglas vigentes para evaluar esta consulta.", 503);
    let climate;
    try { climate = await (this.dependencies.climate ?? new OpenMeteoAdapter()).obtenerSerie({ localidad, fechaRef, dias: 14 }); }
    catch { throw new DomainError("DATOS_CLIMATICOS_NO_DISPONIBLES", "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos.", 503); }

    const evaluatedAt = `${fechaRef}T12:00:00.000Z`;
    const engine = new RulesEngineV2();
    const results = rules.map((rule) => engine.evaluate(rule, climate.serie, evaluatedAt));
    const score = new ScoreEngineV2().evaluate(results);
    let phenology: ContextoFenologico;
    try { phenology = await (this.dependencies.phenology ?? new CalculatedPhenologyProvider()).estimarEstadio({ fechaSiembra: input.fechaSiembra, grupoMadurez: input.grupoMadurez, cultivar: input.cultivar, latitud: localidad.latitud, longitud: localidad.longitud, fechaRef }); }
    catch { phenology = { disponible: false, motivo: "error_proveedor", modifica_reglas: false }; }
    const result: ConsultaResultadoV2 = { id: null, request_id: requestId, share_token: crypto.randomUUID(), estado_general: score.estadoGeneral, explicacion: score.explicacion, resumen_consulta: buildConsultationSummary(results), localidad, cultivo, fecha_ref: fechaRef, generado_en: new Date().toISOString(), proveedor_climatico: climate.proveedor, reglas: results, contexto_fenologico: phenology, clima: { serie: climate.serie, rango_temporal: climate.rangoTemporal, cobertura: climate.cobertura, variables_disponibles: climate.variablesDisponibles, variables_faltantes: climate.variablesFaltantes, dias_solicitados: climate.diasSolicitados, dias_disponibles: climate.diasDisponibles, obtenido_en: climate.obtenidoEn, adapter_version: climate.adapterVersion }, duracion_ms: Math.round(performance.now() - started) };
    result.id = await (this.dependencies.persist ?? persistConsultaV2)({ input: { ...input, cultivo, localidad: input.localidad.trim(), canal: input.canal ?? "web", fechaRef }, localidad, climate, rules, result });
    return result;
  }
}

function normalizeDate(value?: string) {
  const date = value ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) throw new DomainError("REQUEST_INVALIDO", "La fecha de referencia no es válida.");
  return date;
}

export interface AvizorQueryGateway { consultar(input: ConsultaInput): Promise<ConsultaResultadoV2>; }
export class DefaultAvizorQueryGateway implements AvizorQueryGateway { constructor(private readonly service = new ConsultaService()) {} consultar(input: ConsultaInput) { return this.service.ejecutar(input); } }
