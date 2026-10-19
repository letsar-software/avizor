// Diagnóstico de alertas técnicas para una consulta, SÓLO LECTURA.
// Abre una transacción READ ONLY y termina en ROLLBACK: no puede modificar datos.
//
// Uso:
//   npx tsx scripts/diagnose-advisories.ts --cultivo trigo --localidad Tandil --provincia "Buenos Aires" [--fecha 2026-10-19] [--lote <uuid>]
// Usa DATABASE_URL del entorno; muestra el host antes de conectar.
import { Client } from "pg";
import { applicableAdvisories, referenceWindow, type AdvisoryContext } from "@/lib/advisories/applicability";
import type { AgronomicAdvisory } from "@/types";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const cultivo = arg("cultivo");
  const localidad = arg("localidad");
  const provincia = arg("provincia");
  const fecha = arg("fecha") ?? new Date().toISOString().slice(0, 10);
  const loteId = arg("lote");
  if (!cultivo || !localidad || !process.env.DATABASE_URL) {
    console.error("Uso: --cultivo <clave> --localidad <nombre> [--provincia <nombre>] [--fecha AAAA-MM-DD] [--lote <uuid>] (requiere DATABASE_URL)");
    process.exit(1);
  }
  console.log(`Host: ${new URL(process.env.DATABASE_URL).hostname} · transacción READ ONLY`);
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin transaction read only");
    const rows = async <T,>(sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows as T[];

    const zone = await rows<{ clave: string }>(`select z.clave from zonas_agronomicas z where z.activa and exists (
      select 1 from jsonb_array_elements(coalesce(z.definicion_geografica->'localidades','[]'::jsonb)) item
      where lower(item->>'nombre')=lower($1) and lower(item->>'provincia')=lower($2)) order by z.clave limit 1`, [localidad, provincia ?? ""]).catch(() => []);
    const lot = loteId
      ? (await rows<{ id: string; establecimiento_id: string | null; empresa_id: string | null; activo: boolean }>(
          "select id::text, establecimiento_id, empresa_id::text, activo from lotes where id::text = $1", [loteId]).catch(() => []))[0] ?? null
      : null;
    const regionKeys = [provincia, zone[0]?.clave].filter((value): value is string => Boolean(value));
    const candidates = await rows<AgronomicAdvisory>(`select a.id::text, a.crop_id::text, a.category_id::text, c.clave as category_key,
      a.scope_type, a.scope_id::text, a.status, a.title, a.message, a.recommended_action, a.starts_at::text, a.ends_at::text,
      a.active, a.priority, a.source_type, a.source_name, a.source_url, a.validated_by, a.reviewed_at::text, a.notes
      from agronomic_advisories a join categorias_agronomicas c on c.id = a.category_id
      where a.crop_id is null or lower(a.crop_id::text) = lower($1) order by a.starts_at desc`, [cultivo]);
    const context: AdvisoryContext = {
      cropId: cultivo, ...referenceWindow(fecha), regionKeys,
      farmId: lot?.establecimiento_id ?? null, fieldId: lot?.id ?? null,
    };
    const { diagnostics } = applicableAdvisories(candidates, context);

    console.log("\nConsulta", { cultivo, localidad, provincia, fecha, zona: zone[0]?.clave ?? null, lote: lot });
    console.log("Contexto de alertas", context);
    console.log("\nAlertas candidatas (cultivo o globales):");
    console.table(candidates.map((advisory, index) => ({
      id: advisory.id, categoria: advisory.category_key, estado: advisory.status, activa: advisory.active,
      crop_id: advisory.crop_id ?? "(todos)", alcance: `${advisory.scope_type}${advisory.scope_id ? `:${advisory.scope_id}` : ""}`,
      starts_at: advisory.starts_at, ends_at: advisory.ends_at ?? "—", decision: diagnostics[index].decision,
    })));
    const categories = await rows<{ clave: string; activa: boolean }>("select clave, activa from categorias_agronomicas order by clave");
    console.log("\nCategorías administrables:", categories.map((category) => `${category.clave}${category.activa ? "" : " (inactiva)"}`).join(", "));
    const rules = await rows<Record<string, unknown>>(`select r.clave, r.version, r.estado, r.activa, ca.clave as categoria_resuelta
      from reglas_agronomicas r left join categorias_agronomicas ca on ca.id = r.categoria_id
      where r.cultivo = $1 and r.activa order by r.clave`, [cultivo]).catch(async () =>
      rows<Record<string, unknown>>("select clave, version, estado, activa, null as categoria_resuelta from reglas_agronomicas where cultivo = $1 and activa", [cultivo]));
    console.log("\nReglas activas y categoría resuelta:");
    console.table(rules);
  } finally {
    await client.query("rollback").catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
