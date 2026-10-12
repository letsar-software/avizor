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

const BASE_COLUMNS = `r.id::text, r.clave, r.version, r.cultivo, r.estado, r.ventana_dias, r.fuente_tecnica,
  r.limitaciones_declaradas, r.validado_por, r.validado_en::text, r.condiciones_revision, r.decisiones_pendientes, r.definicion`;

const CONFIGURABLE_COLUMNS = `r.variables_requeridas, r.condiciones_logicas, r.etapa_fenologica_desde, r.etapa_fenologica_hasta, r.zadoks_desde, r.zadoks_hasta,
  r.texto_alerta, r.texto_no_evaluable, r.accion_sugerida, r.requiere_validacion_agronomica, r.url_fuente, r.nivel_evidencia,
  r.vigencia_desde::text, r.vigencia_hasta::text`;

const LEGACY_CONFIGURABLE_COLUMNS = `null::text[] as variables_requeridas, null::jsonb as condiciones_logicas,
  null::text as etapa_fenologica_desde, null::text as etapa_fenologica_hasta, null::integer as zadoks_desde, null::integer as zadoks_hasta,
  null::text as texto_alerta, null::text as texto_no_evaluable, null::text as accion_sugerida,
  null::boolean as requiere_validacion_agronomica, null::text as url_fuente, null::text as nivel_evidencia,
  null::text as vigencia_desde, null::text as vigencia_hasta`;

const CATALOG_COLUMNS = `c.nombre, c.categoria, c.evaluabilidad
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
  const run = (configurableColumns: string) =>
    query<RuleRow>(
      `select ${BASE_COLUMNS}, ${configurableColumns}, ${CATALOG_COLUMNS} ${where}`,
      values,
    );
  try {
    return await run(CONFIGURABLE_COLUMNS);
  } catch (error) {
    if (!isMissingConfigColumn(error)) throw error;
    return run(LEGACY_CONFIGURABLE_COLUMNS);
  }
}

function parse(row: RuleRow): ReglaAgronomicaV2 {
  return {
    ...row,
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
    `where r.cultivo = $1 and r.estado in ('vigente','experimental') and r.activa = true order by r.clave`,
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
