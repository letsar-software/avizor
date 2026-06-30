import type { ReglaAgronomica } from "@/types";
import { query } from "@/lib/db/postgres";

type ReglaRow = Omit<ReglaAgronomica, "condiciones"> & {
  condiciones: ReglaAgronomica["condiciones"] | string;
};

function parseRule(row: ReglaRow): ReglaAgronomica {
  return {
    ...row,
    condiciones: typeof row.condiciones === "string" ? JSON.parse(row.condiciones) : row.condiciones,
  };
}

export async function getReglasAgronomicas(cultivo: string) {
  const result = await query<ReglaRow>(
    `select
      id::text,
      cultivo,
      categoria_nombre,
      condicion,
      causas,
      recomendacion,
      regla_version,
      prioridad,
      activa,
      combinador,
      condiciones
    from reglas_agronomicas
    where cultivo = $1 and activa = true
    order by prioridad desc`,
    [cultivo.toLowerCase()],
  );

  return result.rows.map(parseRule);
}
