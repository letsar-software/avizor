import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { currentFieldData, type CurrentFieldData, type FieldDatum } from "@/lib/field-data/current";
import type { FieldDataSource } from "@/lib/variables/catalog";

const COLUMNS = `id::text, field_id, variable_key, value, unit, observed_at::text, valid_until::text,
  status, source, recorded_by, notes`;

function isMissingRelation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

export async function listFieldData(fieldId?: string): Promise<FieldDatum[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await query<FieldDatum>(
      `select ${COLUMNS} from datos_campo
       where ($1::text is null or field_id::text = $1)
       order by field_id, variable_key, observed_at desc limit 500`,
      [fieldId ?? null],
    );
    return result.rows;
  } catch (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
}

/** Datos vigentes del lote, con la vigencia por defecto de cada variable del catálogo. */
export async function loadCurrentFieldData(fieldId: string, at: string): Promise<CurrentFieldData> {
  if (!hasDatabaseConfig()) return new Map();
  try {
    const [records, validity] = await Promise.all([
      query<FieldDatum>(`select ${COLUMNS} from datos_campo where field_id = $1 and status = 'vigente'`, [fieldId]),
      query<{ clave: string; vigencia_dias: number | null }>(`select clave, vigencia_dias from variables_agronomicas`),
    ]);
    return currentFieldData(records.rows, at, new Map(validity.rows.map((row) => [row.clave, row.vigencia_dias])));
  } catch (error) {
    if (isMissingRelation(error)) return new Map();
    throw error;
  }
}

export async function createFieldDatum(input: {
  field_id: string; variable_key: string; value: unknown; unit?: string | null; observed_at: string;
  valid_until?: string | null; source: FieldDataSource; recorded_by: string; notes?: string;
}) {
  const result = await query<FieldDatum>(
    `insert into datos_campo (field_id, variable_key, value, unit, observed_at, valid_until, source, recorded_by, notes)
     values ($1, $2, $3::jsonb, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9)
     returning ${COLUMNS}`,
    [input.field_id, input.variable_key, JSON.stringify(input.value), input.unit ?? null, input.observed_at,
      input.valid_until ?? null, input.source, input.recorded_by, input.notes ?? null],
  );
  return result.rows[0];
}

export async function getFieldDatum(id: string) {
  const result = await query<FieldDatum>(`select ${COLUMNS} from datos_campo where id::text = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function updateFieldDatum(id: string, patch: { status?: "historico"; valid_until?: string | null; notes?: string }) {
  const result = await query<FieldDatum>(
    `update datos_campo set
       status = coalesce($2, status),
       valid_until = case when $3::boolean then $4::timestamptz else valid_until end,
       notes = coalesce($5, notes),
       updated_at = now()
     where id::text = $1 returning ${COLUMNS}`,
    [id, patch.status ?? null, patch.valid_until !== undefined, patch.valid_until ?? null, patch.notes ?? null],
  );
  return result.rows[0] ?? null;
}
