import { VARIABLE_KEY_PATTERN } from "@/lib/variables/catalog";
import { canonicalVariable } from "@/lib/rules/variables";

export interface VariableListIssue {
  list: "critical" | "complementary" | "both";
  variable: string;
  message: string;
}

/**
 * Valida las listas de una regla: claves bien formadas, sin repetidas dentro de una
 * lista ni entre ambas (comparando nombres canónicos: temperature_c = temperatura_media).
 * La usan el editor del panel y la API, así que el criterio es uno solo.
 */
export function validateVariableLists(critical: string[], complementary: string[], knownKeys?: ReadonlySet<string>) {
  const issues: VariableListIssue[] = [];
  const seen = (list: string[], name: "critical" | "complementary") => {
    const keys = new Set<string>();
    for (const variable of list) {
      const key = canonicalVariable(variable);
      if (!VARIABLE_KEY_PATTERN.test(variable)) issues.push({ list: name, variable, message: `"${variable}" no es una clave de variable válida.` });
      else if (knownKeys && !knownKeys.has(key)) issues.push({ list: name, variable, message: `"${variable}" no existe en el catálogo de variables.` });
      if (keys.has(key)) issues.push({ list: name, variable, message: `"${variable}" está repetida en la lista.` });
      keys.add(key);
    }
    return keys;
  };
  const criticalKeys = seen(critical, "critical");
  const complementaryKeys = seen(complementary, "complementary");
  for (const key of criticalKeys) {
    if (complementaryKeys.has(key)) issues.push({ list: "both", variable: key, message: `"${key}" no puede ser crítica y complementaria a la vez.` });
  }
  return issues;
}

/** Listas iniciales del editor: una regla histórica sin listas usa variables_requeridas como críticas. */
export function initialVariableLists(rule: {
  critical_required_variables?: string[] | null;
  complementary_required_variables?: string[] | null;
  variables_requeridas?: string[] | null;
}) {
  return {
    critical: [...(rule.critical_required_variables ?? rule.variables_requeridas ?? [])],
    complementary: [...(rule.complementary_required_variables ?? [])],
    legacy: rule.critical_required_variables == null && rule.complementary_required_variables == null && Boolean(rule.variables_requeridas?.length),
  };
}
