import type { AggregatorKey, CondicionDefinicion, SerieClimaticaDiaria, SpecVariable } from "@/types";

const COVERAGE_BY_AGGREGATOR: Record<AggregatorKey, number> = {
  media_ventana: 0.8,
  min_ventana: 1,
  suma_ventana: 1,
  dias_con_condicion: 1,
};

const VALUE_BY_VARIABLE: Record<SpecVariable, (day: SerieClimaticaDiaria) => number | null> = {
  humedad_relativa: (day) => day.humedadRelativa, precipitacion: (day) => day.precipitacion,
  temperatura_media: (day) => day.temperaturaMedia, temperatura_min: (day) => day.temperaturaMinima,
  temperatura_max: (day) => day.temperaturaMaxima, viento_medio: (day) => day.vientoMedio,
  punto_rocio: (day) => day.puntoRocio, deficit_presion_vapor: (day) => day.deficitPresionVapor,
  evapotranspiracion: (day) => day.evapotranspiracion, et0_fao_56: (day) => day.et0,
  humedad_suelo_0_1cm: (day) => day.humedadSuelo.profundidad0a1cm,
  humedad_suelo_1_3cm: (day) => day.humedadSuelo.profundidad1a3cm,
  humedad_suelo_3_9cm: (day) => day.humedadSuelo.profundidad3a9cm,
  humedad_suelo_9_27cm: (day) => day.humedadSuelo.profundidad9a27cm,
  humedad_suelo_27_81cm: (day) => day.humedadSuelo.profundidad27a81cm,
  temperatura_suelo_0cm: (day) => day.temperaturaSuelo.profundidad0cm,
  temperatura_suelo_6cm: (day) => day.temperaturaSuelo.profundidad6cm,
  temperatura_suelo_18cm: (day) => day.temperaturaSuelo.profundidad18cm,
  temperatura_suelo_54cm: (day) => day.temperaturaSuelo.profundidad54cm,
  radiacion_solar: (day) => day.radiacionSolar,
};

export interface IndicadorCalculado {
  valor: number | null;
  cobertura: number;
  disponible: boolean;
  diasEsperados: number;
  diasDisponibles: number;
  coberturaRequerida: number;
}

// Lo mínimo que necesita calculate() para agregar una serie: variable + agregador
// (y subcondición si aplica). CondicionDefinicion cumple esta forma y le suma
// operador/valor/unidad para poder evaluarse después — separarla permite que un
// caller que solo necesita el valor agregado (ej. lib/pests/indicator-spec.ts) no
// tenga que inventar un operador/valor que no va a usar.
export type AgregacionInput = Pick<CondicionDefinicion, "variable" | "agregador" | "cobertura_minima" | "subcondicion">;

function compare(value: number, operator: CondicionDefinicion["operador"], target: number | [number, number]) {
  if (operator === "between") return Array.isArray(target) && value >= target[0] && value <= target[1];
  const scalar = Number(target);
  if (operator === "gt") return value > scalar;
  if (operator === "gte") return value >= scalar;
  if (operator === "lt") return value < scalar;
  if (operator === "lte") return value <= scalar;
  return value === scalar;
}

export class IndicatorEngine {
  calculate(condition: AgregacionInput, series: SerieClimaticaDiaria[], windowDays: number): IndicadorCalculado {
    const window = series.slice(-windowDays);
    const values = window
      .map(VALUE_BY_VARIABLE[condition.variable])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const coverage = windowDays === 0 ? 0 : values.length / windowDays;
    const required = condition.cobertura_minima ?? COVERAGE_BY_AGGREGATOR[condition.agregador];
    const available = window.length === windowDays && coverage >= required;

    if (!available || values.length === 0) {
      return { valor: null, cobertura: coverage, disponible: false, diasEsperados: windowDays, diasDisponibles: values.length, coberturaRequerida: required };
    }

    let value: number;
    if (condition.agregador === "media_ventana") value = values.reduce((sum, item) => sum + item, 0) / values.length;
    else if (condition.agregador === "min_ventana") value = Math.min(...values);
    else if (condition.agregador === "suma_ventana") value = values.reduce((sum, item) => sum + item, 0);
    else {
      const sub = condition.subcondicion;
      if (!sub) throw new Error("dias_con_condicion requiere subcondicion");
      value = values.filter((item) => compare(item, sub.operador, sub.valor)).length;
    }

    return { valor: Number(value.toFixed(2)), cobertura: coverage, disponible: true, diasEsperados: windowDays, diasDisponibles: values.length, coberturaRequerida: required };
  }
}

export function evaluateOperator(value: number, operator: CondicionDefinicion["operador"], target: number | [number, number]) {
  return compare(value, operator, target);
}

export function formatThreshold(operator: CondicionDefinicion["operador"], target: number | [number, number]) {
  if (operator === "between" && Array.isArray(target)) return `${target[0]}–${target[1]}`;
  const symbols = { gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=" } as const;
  return `${symbols[operator as keyof typeof symbols]} ${Number(target)}`;
}
