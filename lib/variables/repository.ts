import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { BASE_VARIABLES, type AgronomicVariable, type VariableUsage } from "@/lib/variables/catalog";
import { canonicalVariable } from "@/lib/rules/variables";
import type { ReglaAgronomicaV2 } from "@/types";

function isMissingRelation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

/** Catálogo administrable; sin la migración 032 se usa la semilla en código. */
export async function listVariables(): Promise<{ variables: AgronomicVariable[]; administrable: boolean }> {
  if (!hasDatabaseConfig()) return { variables: BASE_VARIABLES, administrable: false };
  try {
    const result = await query<AgronomicVariable>(
      `select clave, etiqueta, descripcion, unidad, tipo_valor, origen, proveedores, vigencia_dias, activa
       from variables_agronomicas order by origen, clave`,
    );
    return { variables: result.rows, administrable: true };
  } catch (error) {
    if (isMissingRelation(error)) return { variables: BASE_VARIABLES, administrable: false };
    throw error;
  }
}

/** Etiquetas visibles por clave para "Para completar la evaluación"; vacío si falla. */
export async function loadVariableLabels(): Promise<ReadonlyMap<string, string>> {
  try {
    const { variables, administrable } = await listVariables();
    return administrable ? new Map(variables.map((variable) => [variable.clave, variable.etiqueta])) : new Map();
  } catch {
    return new Map();
  }
}

export async function createVariable(input: Omit<AgronomicVariable, "activa" | "descripcion" | "unidad" | "vigencia_dias"> & {
  descripcion?: string; unidad?: string | null; vigencia_dias?: number | null; creado_por: string;
}) {
  const result = await query<AgronomicVariable>(
    `insert into variables_agronomicas (clave, etiqueta, descripcion, unidad, tipo_valor, origen, proveedores, vigencia_dias, creado_por)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning clave, etiqueta, descripcion, unidad, tipo_valor, origen, proveedores, vigencia_dias, activa`,
    [input.clave, input.etiqueta, input.descripcion ?? "", input.unidad ?? null, input.tipo_valor, input.origen,
      input.proveedores, input.vigencia_dias ?? null, input.creado_por],
  );
  return result.rows[0];
}

/** Qué reglas y cultivos usan cada variable (reglas históricas: variables_requeridas = críticas). */
export function variableUsage(rules: ReglaAgronomicaV2[]) {
  const usage = new Map<string, VariableUsage[]>();
  const add = (variable: string, entry: VariableUsage) => {
    const key = canonicalVariable(variable);
    usage.set(key, [...(usage.get(key) ?? []), entry]);
  };
  for (const rule of rules) {
    const base = { regla_id: rule.id, clave: rule.clave, version: rule.version, cultivo: rule.cultivo };
    for (const variable of rule.critical_required_variables ?? rule.variables_requeridas ?? []) add(variable, { ...base, lista: "critica" });
    for (const variable of rule.complementary_required_variables ?? []) add(variable, { ...base, lista: "complementaria" });
  }
  return usage;
}
