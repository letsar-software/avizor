import { query } from "@/lib/db/postgres";

/** Resuelve una etapa manual desde el catálogo, sin mapas por cultivo en código. */
export async function getCodigoZadoksEtapa(
  cultivo: string,
  etapa: string,
): Promise<number | null> {
  try {
    const result = await query<{ zadoks_desde: number | null; zadoks_hasta: number | null }>(
      `select e.zadoks_desde, e.zadoks_hasta
       from etapas_fenologicas e
       join cultivos c on c.id = e.cultivo_id
       where c.clave = $1 and e.clave = $2 and e.activa = true
       limit 1`,
      [cultivo, etapa],
    );
    const stage = result.rows[0];
    if (!stage || stage.zadoks_desde === null) return null;
    return stage.zadoks_hasta === null
      ? stage.zadoks_desde
      : Math.floor((stage.zadoks_desde + stage.zadoks_hasta) / 2);
  } catch {
    return null;
  }
}
