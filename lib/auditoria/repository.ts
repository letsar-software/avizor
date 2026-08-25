import { query } from "@/lib/db/postgres";
import type { AuditoriaEntry } from "@/types";

export interface AuditoriaFiltro { entidad?: string; accion?: string; limit?: number }

export async function getAuditoria(filtro: AuditoriaFiltro = {}) {
  const limit = Math.min(Math.max(filtro.limit ?? 100, 1), 500);
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtro.entidad) {
    valores.push(filtro.entidad);
    condiciones.push(`entidad = $${valores.length}`);
  }
  if (filtro.accion) {
    valores.push(filtro.accion);
    condiciones.push(`accion = $${valores.length}`);
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";
  valores.push(limit);
  const result = await query<AuditoriaEntry>(
    `select id, actor_id, actor_tipo, accion, entidad, entidad_id, valor_anterior, valor_nuevo, request_id::text, created_at::text
     from auditoria ${where} order by created_at desc limit $${valores.length}`,
    valores,
  );
  return result.rows;
}

export async function getEntidadesAuditadas() {
  const result = await query<{ entidad: string }>("select distinct entidad from auditoria order by entidad");
  return result.rows.map((row) => row.entidad);
}

export async function getAccionesAuditadas() {
  const result = await query<{ accion: string }>("select distinct accion from auditoria order by accion");
  return result.rows.map((row) => row.accion);
}
