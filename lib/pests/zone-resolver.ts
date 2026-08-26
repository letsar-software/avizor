import { query } from "@/lib/db/postgres";
import type { LocalidadNormalizada } from "@/types";

// Solo resuelve zonas con una definición geográfica explícita almacenada en datos.
// No aproxima provincia → zona ni inventa polígonos.
//
// zonas_agronomicas (db/migrations/012_plagas.sql) no tiene columnas estado/version
// — a diferencia de reglas_agronomicas o plagas_regionales, no tiene un ciclo de
// revisión propio, solo el flag activa boolean. Orden por clave para que el
// resultado sea determinístico si alguna vez dos zonas listaran la misma localidad.
export async function resolveAgronomicZone(localidad: LocalidadNormalizada): Promise<string | null> {
  const result = await query<{ clave: string }>(`select z.clave from zonas_agronomicas z
    where z.activa = true and exists (
      select 1 from jsonb_array_elements(coalesce(z.definicion_geografica->'localidades','[]'::jsonb)) item
      where lower(item->>'nombre')=lower($1) and lower(item->>'provincia')=lower($2)
    ) order by z.clave limit 1`, [localidad.nombre, localidad.provincia]);
  return result.rows[0]?.clave ?? null;
}
