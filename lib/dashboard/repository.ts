import { query } from "@/lib/db/postgres";
import type { DashboardMetrics } from "@/types";

// Cada métrica es su propia función chica y con un solo propósito — más fácil de leer,
// testear o reemplazar una por separado que una consulta gigante con varios CTEs.
async function getConsultasTotales() {
  const result = await query<{ total: string; ultimos_7_dias: string; ultimos_30_dias: string }>(
    `select
       count(*)::text as total,
       count(*) filter (where created_at >= now() - interval '7 days')::text as ultimos_7_dias,
       count(*) filter (where created_at >= now() - interval '30 days')::text as ultimos_30_dias
     from consultas`,
  );
  const row = result.rows[0];
  return { total: Number(row.total), ultimos_7_dias: Number(row.ultimos_7_dias), ultimos_30_dias: Number(row.ultimos_30_dias) };
}

async function getConsultasPorEstadoGeneral() {
  const result = await query<{ estado_general: string; total: string }>(
    "select estado_general, count(*)::text as total from consultas group by estado_general order by total desc",
  );
  return result.rows.map((row) => ({ estado_general: row.estado_general, total: Number(row.total) }));
}

// Confianza (Alta/Media/Baja) es el proxy que ya existe en el dato para "cobertura":
// depende de cuántos de los 14 días de ventana climática tuvieron datos completos.
async function getConsultasPorConfianza() {
  const result = await query<{ confianza: string; total: string }>(
    "select confianza, count(*)::text as total from consultas group by confianza order by total desc",
  );
  return result.rows.map((row) => ({ confianza: row.confianza, total: Number(row.total) }));
}

async function getReglasActivasCount() {
  const result = await query<{ total: string }>(
    "select count(*)::text as total from reglas_agronomicas where estado in ('vigente','experimental') and activa = true",
  );
  return Number(result.rows[0].total);
}

async function getCultivosActivosCount() {
  const result = await query<{ total: string }>("select count(*)::text as total from cultivos where activo = true");
  return Number(result.rows[0].total);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [consultas, porEstadoGeneral, porConfianza, reglasActivas, cultivosActivos] = await Promise.all([
    getConsultasTotales(),
    getConsultasPorEstadoGeneral(),
    getConsultasPorConfianza(),
    getReglasActivasCount(),
    getCultivosActivosCount(),
  ]);
  return { consultas, por_estado_general: porEstadoGeneral, por_confianza: porConfianza, reglas_activas: reglasActivas, cultivos_activos: cultivosActivos };
}
