import { query } from "@/lib/db/postgres";
import type { AsociacionRegionalPlaga, ReglaPlaga } from "@/types";

type RuleRow = Omit<ReglaPlaga, "especies" | "variables_requeridas" | "configuracion" | "textos"> & { especies: string[]; variables_requeridas: string[]; configuracion: ReglaPlaga["configuracion"] | string; textos: ReglaPlaga["textos"] | string };

export async function getReglasPlagas(cultivo: string): Promise<ReglaPlaga[]> {
  const result = await query<RuleRow>(`select id_logico as id, version, cultivo, grupo_plaga, especies, tipo_regla, estado, activa,
    nivel_evidencia_climatica, variables_requeridas, fenologia_desde, fenologia_hasta, configuracion, textos
    from reglas_plagas where cultivo=$1 and estado in ('vigente','experimental') order by id_logico`, [cultivo]);
  return result.rows.map((row) => ({ ...row, cultivo: "soja", variables_requeridas: row.variables_requeridas as ReglaPlaga["variables_requeridas"], configuracion: typeof row.configuracion === "string" ? JSON.parse(row.configuracion) : row.configuracion, textos: typeof row.textos === "string" ? JSON.parse(row.textos) : row.textos }));
}

export async function getAsociacionRegional(reglaId: string, zona: string): Promise<AsociacionRegionalPlaga | null> {
  const result = await query<AsociacionRegionalPlaga>(`select pr.id::text, z.clave as zona_agronomica, pr.prioridad,
    pr.meses_desde, pr.meses_hasta, true as aplicable, cp.version
    from reglas_plagas rp
    join catalogo_plagas cp on cp.cultivo=rp.cultivo and cp.grupo_plaga=rp.grupo_plaga and cp.especie=any(rp.especies)
    join plagas_regionales pr on pr.plaga_id=cp.id
    join zonas_agronomicas z on z.id=pr.zona_id
    where rp.id_logico=$1 and z.clave=$2 and pr.estado in ('revisada','vigente')
    order by case pr.prioridad when 'principal' then 0 else 1 end, cp.version desc limit 1`, [reglaId, zona]);
  return result.rows[0] ?? null;
}
