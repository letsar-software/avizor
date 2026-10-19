import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { ReglaAgronomicaV2 } from "../../types";

const MIGRATIONS = path.join(__dirname, "../../db/migrations");

/** SQL de una migración; pgcrypto no existe en PGlite y gen_random_uuid ya es nativo. */
export function migrationSql(file: string) {
  return readFileSync(path.join(MIGRATIONS, file), "utf8").replace(/^﻿/, "").replace(/create extension[^;]*;/gi, "");
}

/**
 * PostgreSQL en memoria con las migraciones reales hasta `until` (exclusivo):
 * mismo esquema y mismas reglas semilla que una base nueva del proyecto.
 */
export async function migratedDatabase({ until = "031", include = [] as string[] } = {}) {
  const db = new PGlite();
  const files = readdirSync(MIGRATIONS).filter((file) => file.endsWith(".sql") && (file < until || include.some((prefix) => file.startsWith(prefix)))).sort();
  for (const file of files) await db.exec(migrationSql(file));
  const query = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;
  return { db, query, exec: (sql: string) => db.exec(sql) };
}

/** Lee reglas con la misma forma que repository-v2 (columnas configurables + categoría). */
export async function loadRules(query: Awaited<ReturnType<typeof migratedDatabase>>["query"], where: string, params: unknown[] = []) {
  const hasLists = (await query<{ n: number }>(
    "select count(*)::int as n from information_schema.columns where table_name = 'reglas_agronomicas' and column_name = 'critical_required_variables'",
  ))[0].n > 0;
  const rows = await query<Record<string, unknown>>(
    `select r.*, ${hasLists ? "" : "null::text[] as critical_required_variables, null::text[] as complementary_required_variables,"}
       c.nombre as catalogo_nombre, c.nombre_cientifico, c.categoria as catalogo_categoria, c.evaluabilidad, ca.clave as categoria_clave
     from reglas_agronomicas r
     left join catalogo_enfermedades c on c.cultivo = r.cultivo and c.clave = r.clave and c.version = r.version
     left join categorias_agronomicas ca on ca.id = r.categoria_id
     where ${where} order by r.prioridad desc, r.clave`,
    params,
  );
  return rows.map((row): ReglaAgronomicaV2 => ({
    id: String(row.id), clave: String(row.clave), version: String(row.version), cultivo: String(row.cultivo),
    estado: row.estado as ReglaAgronomicaV2["estado"], nombre: (row.catalogo_nombre ?? row.nombre_regla ?? row.clave) as string,
    categoria: (row.catalogo_categoria ?? undefined) as string | undefined, categoria_clave: (row.categoria_clave ?? null) as string | null,
    evaluabilidad: (row.evaluabilidad ?? undefined) as ReglaAgronomicaV2["evaluabilidad"], prioridad: Number(row.prioridad ?? 0),
    ventana_dias: Number(row.ventana_dias), fuente_tecnica: (row.fuente_tecnica ?? null) as string | null,
    limitaciones_declaradas: (row.limitaciones_declaradas ?? null) as string | null, validado_por: null, validado_en: null,
    condiciones_revision: null, decisiones_pendientes: [], definicion: row.definicion as ReglaAgronomicaV2["definicion"],
    condiciones_logicas: (row.condiciones_logicas ?? undefined) as ReglaAgronomicaV2["condiciones_logicas"],
    variables_requeridas: (row.variables_requeridas ?? undefined) as string[] | undefined,
    critical_required_variables: (row.critical_required_variables ?? null) as string[] | null,
    complementary_required_variables: (row.complementary_required_variables ?? null) as string[] | null,
    zadoks_desde: (row.zadoks_desde ?? null) as number | null, zadoks_hasta: (row.zadoks_hasta ?? null) as number | null,
    texto_no_evaluable: (row.texto_no_evaluable ?? null) as string | null, accion_sugerida: (row.accion_sugerida ?? null) as string | null,
    nombre_cientifico: (row.nombre_cientifico ?? null) as string | null, nivel_evidencia: (row.nivel_evidencia ?? null) as string | null,
    validation_status: (row.validation_status ?? null) as ReglaAgronomicaV2["validation_status"],
    evidence_level: (row.evidence_level ?? null) as ReglaAgronomicaV2["evidence_level"],
    source_name: (row.source_name ?? null) as string | null, source_url: (row.source_url ?? null) as string | null,
    reviewed_at: row.reviewed_at ? new Date(row.reviewed_at as string).toISOString() : null, notes: (row.notes ?? null) as string | null,
  }));
}
