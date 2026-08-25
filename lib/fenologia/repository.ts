import { query as defaultQuery } from "@/lib/db/postgres";
import type { ModeloFenologico } from "@/types";

// Mismo patrón de inyección que lib/security/rate-limit.ts y lib/admin/auth.ts:
// la query entra como parámetro con default, así getModeloVigente (que corre en
// el flujo público de consulta) se puede testear sin Postgres real.
type Query = typeof defaultQuery;

interface ModeloRow extends Omit<ModeloFenologico, "parametros"> { parametros: ModeloFenologico["parametros"] | string }

function parse(row: ModeloRow): ModeloFenologico {
  return { ...row, parametros: typeof row.parametros === "string" ? JSON.parse(row.parametros) : row.parametros };
}

const COLUMNAS = "id, cultivo, version, estado, proveedor, parametros, fuente_tecnica, validado_por, validado_en::text, created_at::text, updated_at::text";

export async function getModeloVigente(cultivo: string, queryImpl: Query = defaultQuery) {
  const result = await queryImpl<ModeloRow>(
    `select ${COLUMNAS} from modelos_fenologicos where cultivo = $1 and estado = 'vigente' order by validado_en desc nulls last limit 1`,
    [cultivo],
  );
  return result.rows[0] ? parse(result.rows[0]) : null;
}

export async function getModelosAdministrables(queryImpl: Query = defaultQuery) {
  const result = await queryImpl<ModeloRow>(`select ${COLUMNAS} from modelos_fenologicos where estado <> 'retirada' order by cultivo, version desc`);
  return result.rows.map(parse);
}

export async function getModeloById(id: string, queryImpl: Query = defaultQuery) {
  const result = await queryImpl<ModeloRow>(`select ${COLUMNAS} from modelos_fenologicos where id = $1`, [id]);
  return result.rows[0] ? parse(result.rows[0]) : null;
}

export async function createModelo(input: { cultivo: string; version: string; proveedor?: string; parametros: ModeloFenologico["parametros"]; fuenteTecnica?: string | null }, queryImpl: Query = defaultQuery) {
  const result = await queryImpl<ModeloRow>(
    `insert into modelos_fenologicos(cultivo, version, proveedor, parametros, fuente_tecnica)
     values($1, $2, coalesce($3, 'propio'), $4::jsonb, $5)
     returning ${COLUMNAS}`,
    [input.cultivo, input.version, input.proveedor ?? null, JSON.stringify(input.parametros), input.fuenteTecnica ?? null],
  );
  return parse(result.rows[0]);
}

export async function updateModelo(
  id: string,
  patch: { estado?: ModeloFenologico["estado"]; parametros?: ModeloFenologico["parametros"]; fuenteTecnica?: string | null; validadoPor?: string; validadoEn?: string },
  queryImpl: Query = defaultQuery,
) {
  const result = await queryImpl<ModeloRow>(
    `update modelos_fenologicos set
       estado = coalesce($2, estado),
       parametros = coalesce($3::jsonb, parametros),
       fuente_tecnica = coalesce($4, fuente_tecnica),
       validado_por = coalesce($5, validado_por),
       validado_en = coalesce($6::timestamptz, validado_en),
       updated_at = now()
     where id = $1
     returning ${COLUMNAS}`,
    [id, patch.estado ?? null, patch.parametros ? JSON.stringify(patch.parametros) : null, patch.fuenteTecnica ?? null, patch.validadoPor ?? null, patch.validadoEn ?? null],
  );
  return result.rows[0] ? parse(result.rows[0]) : null;
}
