import { query } from "@/lib/db/postgres";
import type { CatalogoPlaga, PlagaRegional, ZonaAgronomica } from "@/types";

export async function getZonas() {
  const result = await query<ZonaAgronomica>("select * from zonas_agronomicas order by nombre");
  return result.rows;
}

export async function createZona(input: { clave: string; nombre: string; definicion_geografica?: unknown }) {
  const result = await query<ZonaAgronomica>(
    "insert into zonas_agronomicas(clave,nombre,definicion_geografica) values($1,$2,$3::jsonb) returning *",
    [input.clave, input.nombre, input.definicion_geografica ? JSON.stringify(input.definicion_geografica) : null],
  );
  return result.rows[0];
}

export async function getCatalogoPlagas(cultivo?: string) {
  const result = cultivo
    ? await query<CatalogoPlaga>("select * from catalogo_plagas where cultivo = $1 order by grupo_plaga, nombre", [cultivo])
    : await query<CatalogoPlaga>("select * from catalogo_plagas order by cultivo, grupo_plaga, nombre");
  return result.rows;
}

export async function getPlagaById(id: string) {
  const result = await query<CatalogoPlaga>("select * from catalogo_plagas where id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function createPlaga(input: {
  cultivo: string; grupo_plaga: string; especie?: string | null; nombre: string; nombre_cientifico?: string | null;
  tipo_regla: CatalogoPlaga["tipo_regla"]; estado_catalogo?: CatalogoPlaga["estado_catalogo"]; version: string;
}) {
  const result = await query<CatalogoPlaga>(
    `insert into catalogo_plagas(cultivo,grupo_plaga,especie,nombre,nombre_cientifico,tipo_regla,estado_catalogo,version)
     values($1,$2,$3,$4,$5,$6,coalesce($7,'catalogada'),$8) returning *`,
    [input.cultivo, input.grupo_plaga, input.especie ?? null, input.nombre, input.nombre_cientifico ?? null, input.tipo_regla, input.estado_catalogo ?? null, input.version],
  );
  return result.rows[0];
}

export async function updatePlaga(id: string, patch: Partial<Pick<CatalogoPlaga, "nombre" | "nombre_cientifico" | "estado_catalogo" | "tipo_regla">>) {
  const result = await query<CatalogoPlaga>(
    `update catalogo_plagas set
       nombre = coalesce($2, nombre),
       nombre_cientifico = coalesce($3, nombre_cientifico),
       estado_catalogo = coalesce($4, estado_catalogo),
       tipo_regla = coalesce($5, tipo_regla),
       updated_at = now()
     where id = $1 returning *`,
    [id, patch.nombre ?? null, patch.nombre_cientifico ?? null, patch.estado_catalogo ?? null, patch.tipo_regla ?? null],
  );
  return result.rows[0] ?? null;
}

export async function getRegionalesByPlaga(plagaId: string) {
  const result = await query<PlagaRegional>(
    `select r.*, z.clave as zona_clave, z.nombre as zona_nombre
     from plagas_regionales r join zonas_agronomicas z on z.id = r.zona_id
     where r.plaga_id = $1 order by z.nombre`,
    [plagaId],
  );
  return result.rows;
}

export async function createRegional(input: {
  plaga_id: string; zona_id: string; prioridad: PlagaRegional["prioridad"];
  meses_desde?: number | null; meses_hasta?: number | null; fuente_id?: string | null;
  fecha_fuente?: string | null; observaciones?: string | null;
}) {
  const result = await query<PlagaRegional>(
    `insert into plagas_regionales(plaga_id,zona_id,prioridad,meses_desde,meses_hasta,fuente_id,fecha_fuente,observaciones)
     values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [input.plaga_id, input.zona_id, input.prioridad, input.meses_desde ?? null, input.meses_hasta ?? null, input.fuente_id ?? null, input.fecha_fuente ?? null, input.observaciones ?? null],
  );
  return result.rows[0];
}
