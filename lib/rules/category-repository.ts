import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import type { RiskCategory } from "@/types";

export async function getActiveRiskCategories(): Promise<RiskCategory[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await query<{ id: string; key: string; name: string }>(
      `select id::text, clave as key, nombre as name
       from categorias_agronomicas where activa = true order by clave`,
    );
    return result.rows;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") return [];
    throw error;
  }
}

export async function createRiskCategory(input: Omit<RiskCategory, "id"> & { active?: boolean }) {
  const result = await query<RiskCategory>(
    `insert into categorias_agronomicas (clave, nombre, activa) values ($1, $2, $3)
     returning id::text, clave as key, nombre as name`,
    [input.key, input.name, input.active ?? true],
  );
  return result.rows[0];
}
