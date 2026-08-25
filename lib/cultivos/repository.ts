import { query } from "@/lib/db/postgres";
import type { Cultivo } from "@/types";

export async function getCultivos() {
  const result = await query<Cultivo>("select * from cultivos order by nombre");
  return result.rows;
}

export async function getCultivoById(id: string) {
  const result = await query<Cultivo>("select * from cultivos where id::text = $1", [id]);
  return result.rows[0] ?? null;
}

export async function createCultivo(input: { clave: string; nombre: string; activo?: boolean; feature_flag?: string | null }) {
  const result = await query<Cultivo>(
    "insert into cultivos(clave,nombre,activo,feature_flag) values($1,$2,$3,$4) returning *",
    [input.clave, input.nombre, input.activo ?? false, input.feature_flag ?? null],
  );
  return result.rows[0];
}

export async function updateCultivo(id: string, patch: { nombre?: string; activo?: boolean; feature_flag?: string | null }) {
  const result = await query<Cultivo>(
    "update cultivos set nombre=coalesce($2,nombre), activo=coalesce($3,activo), feature_flag=coalesce($4,feature_flag), updated_at=now() where id::text=$1 returning *",
    [id, patch.nombre ?? null, patch.activo ?? null, patch.feature_flag ?? null],
  );
  return result.rows[0] ?? null;
}
