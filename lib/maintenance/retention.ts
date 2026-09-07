import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { logSafeError, logSafeInfo } from "@/lib/logging/safe";

export const RETENTION_SQL = [
  // Delete all detailed consultation material instead of attempting to retain a re-identifiable "anonymous" record.
  ["consultas", "delete from consultas where created_at < now() - interval '18 months'"],
  ["feedback", "delete from feedback where created_at < now() - interval '24 months'"],
  ["observaciones", "delete from observaciones where created_at < now() - interval '24 months'"],
  ["novedades_inactivas", "delete from interesados where consentimiento = true and baja_en is null and coalesce(ultima_interaccion_en, created_at) < now() - interval '24 months'"],
  ["supresiones_vencidas", "delete from interesados where baja_en is not null and baja_en < now() - interval '24 months'"],
  ["api_uso", "delete from api_uso where created_at < now() - interval '18 months'"],
  ["auditoria", "delete from auditoria where created_at < now() - interval '24 months'"],
  ["sesiones_admin", "delete from sesiones_admin where expira_en <= now()"],
  ["invitaciones_admin", "delete from invitaciones_admin where expira_en <= now()"],
  ["rate_limit_buckets", "delete from rate_limit_buckets where expires_at <= now()"],
  ["consulta_logs", "delete from consulta_logs where created_at < now() - interval '90 days'"],
] as const;

export async function runRetentionMaintenance(execute: typeof query = query) {
  if (!hasDatabaseConfig()) return { ran: false, completed: 0, failed: 0 };
  let completed = 0;
  let failed = 0;
  for (const [operation, statement] of RETENTION_SQL) {
    try { await execute(statement); completed += 1; }
    catch { failed += 1; logSafeError({ operation: `retention.${operation}`, error_code: "RETENTION_STEP_FAILED" }); }
  }
  logSafeInfo({ operation: "retention.completed" });
  return { ran: true, completed, failed };
}
