import type { AggregatorKey, CondicionDefinicion, SerieClimaticaDiaria, SpecVariable } from "@/types";

const COVERAGE_BY_AGGREGATOR: Record<AggregatorKey, number> = {
  media_ventana: 0.8,
  min_ventana: 1,
  suma_ventana: 1,
  dias_con_condicion: 1,
};

const FIELD_BY_VARIABLE: Record<SpecVariable, keyof SerieClimaticaDiaria> = {
  humedad_relativa: "humedadRelativa",
  precipitacion: "precipitacion",
  temperatura_media: "temperaturaMedia",
  temperatura_min: "temperaturaMinima",
};

export interface IndicadorCalculado {
  valor: number | null;
  cobertura: number;
  disponible: boolean;
  diasEsperados: number;
  diasDisponibles: number;
  coberturaRequerida: number;
}

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
  calculate(condition: CondicionDefinicion, series: SerieClimaticaDiaria[], windowDays: number): IndicadorCalculado {
    const window = series.slice(-windowDays);
    const values = window
      .map((day) => day[FIELD_BY_VARIABLE[condition.variable]])
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
