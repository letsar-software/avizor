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
  const result = await query<RuleRow>(`select r.id::text, r.clave, r.version, r.cultivo, r.estado, r.ventana_dias, r.fuente_tecnica,
    r.limitaciones_declaradas, r.validado_por, r.validado_en::text, r.condiciones_revision, r.decisiones_pendientes, r.definicion,
    c.nombre, c.categoria, c.evaluabilidad
    from reglas_agronomicas r left join catalogo_enfermedades c
      on c.cultivo = r.cultivo and c.clave = r.clave and c.version = r.version
    where r.cultivo = $1 and r.estado in ('vigente','experimental') and r.activa = true order by r.clave`, [cultivo]);
  return result.rows.map(parse);
}

export async function getReglasAdministrables() {
  const result = await query<RuleRow>(`select r.id::text, r.clave, r.version, r.cultivo, r.estado, r.ventana_dias, r.fuente_tecnica,
    r.limitaciones_declaradas, r.validado_por, r.validado_en::text, r.condiciones_revision, r.decisiones_pendientes, r.definicion,
    c.nombre, c.categoria, c.evaluabilidad
    from reglas_agronomicas r left join catalogo_enfermedades c
      on c.cultivo = r.cultivo and c.clave = r.clave and c.version = r.version
    where r.estado <> 'retirada' order by r.cultivo, r.clave, r.version desc`);
  return result.rows.map(parse);
}
