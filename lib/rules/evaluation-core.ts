import type {
  AgronomicAdvisory,
  ConsolidatedCategoryRisk,
  ContextoFenologico,
  DataProvenance,
  ReglaAgronomicaV2,
  ResultadoReglaV2,
  SerieClimaticaDiaria,
} from "@/types";
import { RulesEngineV2 } from "@/lib/rules/engine-v2";
import { fieldValueSource, type CurrentFieldData } from "@/lib/field-data/current";
import { loadCurrentFieldData } from "@/lib/field-data/repository";
import { resolveLotAccess, type Lot, type LotActor } from "@/lib/lots/access";
import { getLot } from "@/lib/lots/repository";
import { applicableAdvisories, referenceWindow, type AdvisoryContext, type AdvisoryDiagnostic } from "@/lib/advisories/applicability";
import { hasDatabaseConfig } from "@/lib/db/postgres";
import { resolveAgronomicZone } from "@/lib/pests/zone-resolver";

/**
 * Único camino de evaluación de reglas configurables. La consulta pública, la API de
 * empresas y POST /api/rules/evaluate pasan por acá, con la misma precedencia de datos:
 * dato de campo vigente → fenología informada/estimada → estimación climática.
 */
export function evaluateRules(input: {
  rules: ReglaAgronomicaV2[];
  series: SerieClimaticaDiaria[];
  evaluatedAt: string;
  phenology?: ContextoFenologico;
  fieldData?: CurrentFieldData;
  engine?: RulesEngineV2;
}): ResultadoReglaV2[] {
  const engine = input.engine ?? new RulesEngineV2();
  return input.rules.map((rule) => engine.evaluate(rule, input.series, input.evaluatedAt, input.phenology, input.fieldData));
}

export interface LotContextDependencies {
  loadLot?: (id: string) => Promise<Lot | null>;
  loadFieldData?: (lotId: string, at: string) => Promise<CurrentFieldData>;
}

/** Valida el acceso al lote y trae sus datos de campo vigentes a la fecha de evaluación. */
export async function loadLotContext(lotId: string | undefined, actor: LotActor, at: string, dependencies: LotContextDependencies = {}) {
  if (!lotId) return { lot: null, fieldData: new Map() as CurrentFieldData };
  const lot = await resolveLotAccess(lotId, actor, dependencies.loadLot ?? getLot);
  const fieldData = await (dependencies.loadFieldData ?? loadCurrentFieldData)(lot.id, at);
  return { lot, fieldData };
}

/**
 * De dónde salió cada variable usada o declarada por las reglas: dato de campo
 * (manual, sensor, importación, cálculo) o estimación climática; y qué categorías
 * resolvió una alerta técnica.
 */
export function dataProvenance(
  lotId: string,
  results: ResultadoReglaV2[],
  fieldData: CurrentFieldData,
  categories: Pick<ConsolidatedCategoryRisk, "category" | "resolution_source" | "applied_advisories">[],
): DataProvenance {
  const variables = new Map<string, DataProvenance["variables"][number]>();
  for (const result of results) {
    for (const observed of result.observado) {
      if (!variables.has(observed.variable)) variables.set(observed.variable, { key: observed.variable, source: observed.fuente ?? "weather" });
    }
    for (const key of [...(result.regla.critical_required_variables ?? []), ...(result.regla.complementary_required_variables ?? [])]) {
      const datum = fieldData.get(key);
      if (datum) variables.set(key, { key, source: fieldValueSource(datum.source), observed_at: datum.observed_at, ...(datum.id ? { field_datum_id: datum.id } : {}) });
    }
  }
  for (const [key, datum] of fieldData) {
    const entry = variables.get(key);
    if (entry && entry.source !== "weather") variables.set(key, { ...entry, observed_at: datum.observed_at, ...(datum.id ? { field_datum_id: datum.id } : {}) });
  }
  const advisories = categories
    .filter((category) => category.resolution_source === "agronomic_advisory" || category.resolution_source === "combined")
    .flatMap((category) => category.applied_advisories.slice(0, 1).map((advisory: AgronomicAdvisory) => ({ category: category.category, advisory_id: advisory.id, title: advisory.title })));
  return { lot_id: lotId, variables: [...variables.values()], advisories };
}

/** Claves de región de una localidad: provincia y, si está definida, su zona agronómica. */
export async function localityRegionKeys(
  localidad: { nombre: string; provincia?: string | null } | null | undefined,
  resolveZone?: (localidad: never) => Promise<string | null>,
) {
  if (!localidad) return [];
  const keys = localidad.provincia ? [localidad.provincia] : [];
  try {
    const zone = resolveZone
      ? await resolveZone(localidad as never)
      : hasDatabaseConfig() ? await resolveAgronomicZone(localidad as never) : null;
    if (zone) keys.push(zone);
  } catch {
    // Sin zona resuelta, la provincia sigue siendo una clave de región válida.
  }
  return keys;
}

export type AdvisoryTrace = (diagnostics: AdvisoryDiagnostic[], context: AdvisoryContext) => void;

/** Traza sólo en desarrollo: nunca llega a la respuesta ni a la interfaz. */
const developmentTrace: AdvisoryTrace = (diagnostics, context) => {
  if (process.env.NODE_ENV === "development") console.debug("[avizor:alertas-tecnicas]", JSON.stringify({ context, diagnostics }));
};

/**
 * Alertas técnicas aplicables a la consulta, con la misma regla en todos los caminos:
 * vigencia en el día consultado, cultivo y alcance (global/región por localidad;
 * establecimiento/lote sólo con lote validado).
 */
export function selectAdvisories(input: {
  candidates: AgronomicAdvisory[];
  cropId: string;
  fechaRef: string;
  regionKeys: string[];
  lot?: Pick<Lot, "id" | "establecimiento_id"> | null;
  now?: Date;
  trace?: AdvisoryTrace;
}) {
  const context: AdvisoryContext = {
    cropId: input.cropId,
    ...referenceWindow(input.fechaRef, input.now),
    regionKeys: input.regionKeys,
    farmId: input.lot?.establecimiento_id ?? null,
    fieldId: input.lot?.id ?? null,
  };
  const result = applicableAdvisories(input.candidates, context);
  (input.trace ?? developmentTrace)(result.diagnostics, context);
  return result;
}
