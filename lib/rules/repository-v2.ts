import { query } from "@/lib/db/postgres";
import type { ReglaAgronomicaV2 } from "@/types";

type RuleRow = Omit<
  ReglaAgronomicaV2,
  "definicion" | "decisiones_pendientes"
> & {
  definicion: ReglaAgronomicaV2["definicion"] | string;
  condiciones_logicas:
    NonNullable<ReglaAgronomicaV2["condiciones_logicas"]> | string | null;
  decisiones_pendientes: string[] | null;
};

const BASE_COLUMNS = `r.id::text, r.clave, r.version, r.cultivo, r.estado, r.prioridad, r.ventana_dias, r.fuente_tecnica,
  r.limitaciones_declaradas, r.validado_por, r.validado_en::text, r.condiciones_revision, r.decisiones_pendientes, r.definicion`;

const CONFIGURABLE_COLUMNS = `r.variables_requeridas, r.condiciones_logicas, r.etapa_fenologica_desde, r.etapa_fenologica_hasta, r.zadoks_desde, r.zadoks_hasta,
  r.texto_alerta, r.texto_no_evaluable, r.accion_sugerida, r.requiere_validacion_agronomica, r.url_fuente, r.nivel_evidencia,
  r.vigencia_desde::text, r.vigencia_hasta::text, r.validation_status, r.evidence_level,
  r.source_name, r.source_url, r.reviewed_at::text, r.notes,
  (select ca.clave from categorias_agronomicas ca where ca.id = r.categoria_id) as categoria_clave`;

const LEGACY_CONFIGURABLE_COLUMNS = `null::text[] as variables_requeridas, null::jsonb as condiciones_logicas,
  null::text as etapa_fenologica_desde, null::text as etapa_fenologica_hasta, null::integer as zadoks_desde, null::integer as zadoks_hasta,
  null::text as texto_alerta, null::text as texto_no_evaluable, null::text as accion_sugerida,
  null::boolean as requiere_validacion_agronomica, null::text as url_fuente, null::text as nivel_evidencia,
  null::text as vigencia_desde, null::text as vigencia_hasta,
  null::text as validation_status, null::text as evidence_level, null::text as source_name,
  null::text as source_url, null::text as reviewed_at, null::text as notes,
  null::text as categoria_clave`;

// Migración 031 (pendiente): sin estas columnas, variables_requeridas actúa como críticas.
const REQUIREMENT_COLUMNS = `r.critical_required_variables, r.complementary_required_variables`;
const LEGACY_REQUIREMENT_COLUMNS = `null::text[] as critical_required_variables, null::text[] as complementary_required_variables`;

const CATALOG_COLUMNS = `c.nombre, c.nombre_cientifico, c.categoria, c.evaluabilidad
  from reglas_agronomicas r left join catalogo_enfermedades c
    on c.cultivo = r.cultivo and c.clave = r.clave and c.version = r.version`;

function isMissingConfigColumn(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42703"
  );
}

async function queryRules(where: string, values: unknown[] = []) {
  const run = (configurableColumns: string, requirementColumns: string) =>
    query<RuleRow>(
      `select ${BASE_COLUMNS}, ${configurableColumns}, ${requirementColumns}, ${CATALOG_COLUMNS} ${where}`,
      values,
    );
  // Cada nivel de columnas puede no existir todavía; se degrada sin perder los anteriores.
  const attempts: Array<[string, string]> = [
    [CONFIGURABLE_COLUMNS, REQUIREMENT_COLUMNS],
    [CONFIGURABLE_COLUMNS, LEGACY_REQUIREMENT_COLUMNS],
    [LEGACY_CONFIGURABLE_COLUMNS, LEGACY_REQUIREMENT_COLUMNS],
  ];
  for (const [index, [configurable, requirements]] of attempts.entries()) {
    try {
      return await run(configurable, requirements);
    } catch (error) {
      if (!isMissingConfigColumn(error) || index === attempts.length - 1) throw error;
    }
  }
  throw new Error("unreachable");
}

function parse(row: RuleRow): ReglaAgronomicaV2 {
  return {
    ...row,
    nombre: row.nombre ?? row.nombre_regla ?? row.clave,
    decisiones_pendientes: row.decisiones_pendientes ?? [],
    definicion:
      typeof row.definicion === "string"
        ? JSON.parse(row.definicion)
        : row.definicion,
    condiciones_logicas: row.condiciones_logicas
      ? typeof row.condiciones_logicas === "string"
        ? JSON.parse(row.condiciones_logicas)
        : row.condiciones_logicas
      : undefined,
  };
}

export async function getReglasVigentes(cultivo: string) {
  const result = await queryRules(
    `where r.cultivo = $1 and r.estado in ('vigente','experimental') and r.activa = true order by r.prioridad desc, r.clave`,
    [cultivo],
  );
  return result.rows.map(parse);
}

export async function getReglasAdministrables() {
  const result = await queryRules(
    `where r.estado <> 'retirada' order by r.cultivo, r.clave, r.version desc`,
  );
  return result.rows.map(parse);
}

export async function getReglaAdministrableById(id: string) {
  const result = await queryRules(`where r.id::text = $1`, [id]);
  return result.rows[0] ? parse(result.rows[0]) : null;
}
