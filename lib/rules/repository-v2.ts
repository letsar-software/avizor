import { query } from "@/lib/db/postgres";
import type { ReglaAgronomicaV2 } from "@/types";

type RuleRow = Omit<ReglaAgronomicaV2, "definicion" | "decisiones_pendientes"> & {
  definicion: ReglaAgronomicaV2["definicion"] | string;
  decisiones_pendientes: string[] | null;
};

function parse(row: RuleRow): ReglaAgronomicaV2 {
  return { ...row, decisiones_pendientes: row.decisiones_pendientes ?? [], definicion: typeof row.definicion === "string" ? JSON.parse(row.definicion) : row.definicion };
}

export async function getReglasVigentes(cultivo: string) {
  const result = await query<RuleRow>(`select id::text, clave, version, cultivo, estado, ventana_dias, fuente_tecnica,
    limitaciones_declaradas, validado_por, validado_en::text, condiciones_revision, decisiones_pendientes, definicion
    from reglas_agronomicas where cultivo = $1 and estado = 'vigente' and activa = true order by clave`, [cultivo]);
  return result.rows.map(parse);
}

export async function getReglasAdministrables() {
  const result = await query<RuleRow>(`select id::text, clave, version, cultivo, estado, ventana_dias, fuente_tecnica,
    limitaciones_declaradas, validado_por, validado_en::text, condiciones_revision, decisiones_pendientes, definicion
    from reglas_agronomicas where estado <> 'retirada' order by cultivo, clave, version desc`);
  return result.rows.map(parse);
}
