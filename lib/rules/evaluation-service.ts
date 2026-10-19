import { getActiveAgronomicAdvisories, type AdvisoryScope } from "@/lib/advisories/repository";
import { getActiveRiskCategories } from "@/lib/rules/category-repository";
import { consolidateCategoryRisks } from "@/lib/rules/consolidation";
import { dataProvenance, evaluateRules, loadLotContext, type LotContextDependencies } from "@/lib/rules/evaluation-core";
import type { LotActor } from "@/lib/lots/access";
import { getReglasVigentes } from "@/lib/rules/repository-v2";
import type { AgronomicAdvisory, ContextoFenologico, ReglaAgronomicaV2, RiskCategory, SerieClimaticaDiaria } from "@/types";
import { loadVariableLabels } from "@/lib/variables/repository";

export interface GenericWeatherInput {
  temperature_c?: number | null; temperature_min_c?: number | null; temperature_max_c?: number | null;
  relative_humidity_pct?: number | null; precipitation_mm?: number | null; wind_speed_kmh?: number | null;
  soil_moisture_pct?: number | null; soil_temperature_c?: number | null; reference_evapotranspiration_mm?: number | null;
  leaf_wetness_hours?: number | null; leaf_wetness_probability?: number | null; provider?: string;
}
export interface GenericEvaluationInput {
  lot_id?: string; crop_id: string; phenology?: { scale: "Zadoks" | "BBCH" | "manual"; stage: number; source: string };
  scope?: AdvisoryScope; weather: GenericWeatherInput;
}

function weatherSeries(weather: GenericWeatherInput, date: string): SerieClimaticaDiaria[] {
  return [{
    fecha: date, temperaturaMedia: weather.temperature_c ?? null, temperaturaMinima: weather.temperature_min_c ?? null,
    temperaturaMaxima: weather.temperature_max_c ?? null, humedadRelativa: weather.relative_humidity_pct ?? null,
    precipitacion: weather.precipitation_mm ?? null, vientoMedio: weather.wind_speed_kmh ?? null,
    puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: weather.reference_evapotranspiration_mm ?? null,
    et0: weather.reference_evapotranspiration_mm ?? null,
    humedadSuelo: { profundidad0a1cm: weather.soil_moisture_pct ?? null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: weather.soil_temperature_c ?? null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null, leafWetnessHours: weather.leaf_wetness_hours ?? null,
  }];
}

interface Dependencies extends LotContextDependencies {
  loadRules?: (cropId: string) => Promise<ReglaAgronomicaV2[]>;
  loadCategories?: () => Promise<RiskCategory[]>;
  loadAdvisories?: (cropId: string, scope: AdvisoryScope, at: string) => Promise<AgronomicAdvisory[]>;
  loadVariableLabels?: () => Promise<ReadonlyMap<string, string>>;
}

export class RulesEvaluationService {
  constructor(private readonly dependencies: Dependencies = {}) {}

  async evaluate(input: GenericEvaluationInput, context: { actor?: LotActor; evaluatedAt?: string } = {}) {
    const evaluatedAt = context.evaluatedAt ?? new Date().toISOString();
    const date = evaluatedAt.slice(0, 10);
    // Datos de lote sólo a través de lot_id y con acceso validado (mismo camino que la consulta).
    const { lot, fieldData } = await loadLotContext(input.lot_id, context.actor ?? { kind: "anonymous" }, evaluatedAt, this.dependencies);
    const rules = await (this.dependencies.loadRules ?? getReglasVigentes)(input.crop_id);
    const phenology: ContextoFenologico = input.phenology
      ? { disponible: true, codigo_zadoks: input.phenology.scale === "Zadoks" ? input.phenology.stage : null, estadio_estimado: String(input.phenology.stage), fuente: input.phenology.source, modifica_reglas: false }
      : { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
    const series = weatherSeries(input.weather, date);
    const evaluatedRules = evaluateRules({ rules, series, evaluatedAt, phenology, fieldData });
    const [categories, advisories, labels] = await Promise.all([
      (this.dependencies.loadCategories ?? getActiveRiskCategories)(),
      (this.dependencies.loadAdvisories ?? getActiveAgronomicAdvisories)(input.crop_id, { ...input.scope, fieldId: lot?.id ?? input.scope?.fieldId }, evaluatedAt),
      (this.dependencies.loadVariableLabels ?? loadVariableLabels)(),
    ]);
    const consolidated = consolidateCategoryRisks(categories, evaluatedRules, advisories, { labels });
    return {
      ...(lot ? { lot_id: lot.id } : {}), crop_id: input.crop_id, evaluated_at: evaluatedAt,
      variables_available: Object.entries(input.weather).filter(([key, value]) => key !== "provider" && value !== null && value !== undefined).map(([key]) => key),
      ...(lot ? { data_provenance: dataProvenance(lot.id, evaluatedRules, fieldData, consolidated) } : {}),
      categories: consolidated,
    };
  }
}
