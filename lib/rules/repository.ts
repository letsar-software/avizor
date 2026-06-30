import type { ReglaAgronomica } from "@/types";
import { supabaseRest } from "@/lib/supabase/rest";

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
  const query = new URLSearchParams({
    select: "*",
    cultivo: `eq.${cultivo.toLowerCase()}`,
    activa: "eq.true",
    order: "prioridad.desc",
  });

  const rows = await supabaseRest<ReglaRow[]>(`reglas_agronomicas?${query.toString()}`);
  return rows.map(parseRule);
}
