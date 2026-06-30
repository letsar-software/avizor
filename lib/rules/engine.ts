import type { CategoriaResultado, ClimateMetrics, Condicion, ReglaAgronomica, RuleCondition } from "@/types";

const CONDITION_WEIGHT: Record<Condicion, number> = {
  favorable: 3,
  moderada: 2,
  desfavorable: 1,
};

function compare(actual: number | string | null, condition: RuleCondition) {
  if (actual === null) return false;

  switch (condition.operator) {
    case ">":
      return Number(actual) > Number(condition.value);
    case ">=":
      return Number(actual) >= Number(condition.value);
    case "<":
      return Number(actual) < Number(condition.value);
    case "<=":
      return Number(actual) <= Number(condition.value);
    case "==":
      return actual === condition.value;
    case "!=":
      return actual !== condition.value;
    default:
      return false;
  }
}

function matchesRule(rule: ReglaAgronomica, metrics: ClimateMetrics) {
  if (rule.condiciones.length === 0) return true;

  const results = rule.condiciones.map((condition) => compare(metrics[condition.metric], condition));
  return rule.combinador === "any" ? results.some(Boolean) : results.every(Boolean);
}

export class RulesEngine {
  evaluate(rules: ReglaAgronomica[], metrics: ClimateMetrics): CategoriaResultado[] {
    const matchedRules = rules
      .filter((rule) => rule.activa)
      .filter((rule) => matchesRule(rule, metrics))
      .sort((a, b) => b.prioridad - a.prioridad);

    const byCategory = new Map<string, CategoriaResultado>();

    matchedRules.forEach((rule) => {
      const current = byCategory.get(rule.categoria_nombre);

      if (current && CONDITION_WEIGHT[current.condicion] >= CONDITION_WEIGHT[rule.condicion]) {
        return;
      }

      byCategory.set(rule.categoria_nombre, {
        nombre: rule.categoria_nombre,
        condicion: rule.condicion,
        causas: rule.causas,
        recomendacion: rule.recomendacion,
        regla_version: rule.regla_version,
      });
    });

    return Array.from(byCategory.values());
  }
}
