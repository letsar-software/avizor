import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import type { Lot } from "@/lib/lots/access";

const COLUMNS = "id::text, empresa_id::text, nombre, cultivo, activo";

function isMissingRelation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

export async function getLot(id: string): Promise<Lot | null> {
  if (!hasDatabaseConfig()) return null;
  try {
    const result = await query<Lot>(`select ${COLUMNS} from lotes where id::text = $1`, [id]);
    return result.rows[0] ?? null;
  } catch (error) {
    // Sin la migración 032 no hay lotes: se informa como lote inexistente.
    if (isMissingRelation(error)) return null;
    throw error;
  }
}

export async function listLots(): Promise<Lot[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await query<Lot>(`select ${COLUMNS} from lotes order by activo desc, nombre limit 500`);
    return result.rows;
  } catch (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
}

export async function createLot(input: { nombre: string; empresa_id?: string | null; cultivo?: string | null; creado_por: string }) {
  const result = await query<Lot>(
    `insert into lotes (nombre, empresa_id, cultivo, creado_por) values ($1, $2::uuid, $3, $4) returning ${COLUMNS}`,
    [input.nombre, input.empresa_id ?? null, input.cultivo ?? null, input.creado_por],
  );
  return result.rows[0];
}

/** Empresa dueña de una API key ya autenticada. */
export async function empresaForApiKey(keyId: string) {
  const result = await query<{ empresa_id: string }>("select empresa_id::text from api_keys where id::text = $1", [keyId]);
  return result.rows[0]?.empresa_id ?? null;
}
