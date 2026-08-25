import { query } from "@/lib/db/postgres";
import type { LocalidadNormalizada } from "@/types";

// Solo resuelve zonas con una definición geográfica explícita almacenada en datos.
// No aproxima provincia → zona ni inventa polígonos.
export async function resolveAgronomicZone(localidad: LocalidadNormalizada): Promise<string | null> {
  const result = await query<{ clave: string }>(`select z.clave from zonas_agronomicas z
    where z.estado in ('revisada','vigente') and exists (
      select 1 from jsonb_array_elements(coalesce(z.definicion_geografica->'localidades','[]'::jsonb)) item
      where lower(item->>'nombre')=lower($1) and lower(item->>'provincia')=lower($2)
    ) order by z.version desc limit 1`, [localidad.nombre, localidad.provincia]);
  return result.rows[0]?.clave ?? null;
}
