import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import type { AdvisoryScopeType, AgronomicAdvisory } from "@/types";

export interface AdvisoryScope {
  regionId?: string | null;
  farmId?: string | null;
  fieldId?: string | null;
}

type AdvisoryRow = Omit<AgronomicAdvisory, "category_key"> & { category_key: string };

/**
 * Only returns currently applicable advisories. The scope comparison is data
 * driven: callers may omit identifiers until the corresponding domain exists.
 */
export async function getActiveAgronomicAdvisories(
  cropId: string,
  scope: AdvisoryScope = {},
  at = new Date().toISOString(),
): Promise<AgronomicAdvisory[]> {
  if (!hasDatabaseConfig()) return [];
  const scopeValues: Record<Exclude<AdvisoryScopeType, "global">, string | null | undefined> = {
    region: scope.regionId,
    farm: scope.farmId,
    field: scope.fieldId,
  };
  try {
    const result = await query<AdvisoryRow>(
      `select a.id::text, a.crop_id::text, a.category_id::text, c.clave as category_key,
        a.scope_type, a.scope_id::text, a.status, a.title, a.message,
        a.recommended_action, a.starts_at::text, a.ends_at::text, a.active,
        a.priority, a.source_type, a.source_name, a.source_url, a.validated_by,
        a.reviewed_at::text, a.notes
       from agronomic_advisories a
       join categorias_agronomicas c on c.id = a.category_id
       where a.active = true
         and (a.crop_id is null or a.crop_id::text = $1)
         and a.starts_at <= $2::timestamptz
         and (a.ends_at is null or a.ends_at >= $2::timestamptz)
         and (a.scope_type = 'global'
           or (a.scope_type = 'region' and a.scope_id::text = $3)
           or (a.scope_type = 'farm' and a.scope_id::text = $4)
           or (a.scope_type = 'field' and a.scope_id::text = $5))
       order by a.priority desc, a.reviewed_at desc`,
      [cropId, at, scopeValues.region ?? null, scopeValues.farm ?? null, scopeValues.field ?? null],
    );
    return result.rows;
  } catch (error) {
    // The application remains backward compatible until the reviewed migration
    // is applied; no advisory is silently fabricated.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") return [];
    throw error;
  }
}

export async function listAgronomicAdvisories() {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await query<AdvisoryRow>(
      `select a.id::text, a.crop_id::text, a.category_id::text, c.clave as category_key,
        a.scope_type, a.scope_id::text, a.status, a.title, a.message, a.recommended_action,
        a.starts_at::text, a.ends_at::text, a.active, a.priority, a.source_type,
        a.source_name, a.source_url, a.validated_by, a.reviewed_at::text, a.notes
       from agronomic_advisories a join categorias_agronomicas c on c.id = a.category_id
       order by a.active desc, a.starts_at desc, a.priority desc`,
    );
    return result.rows;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") return [];
    throw error;
  }
}

export async function createAgronomicAdvisory(input: Omit<AgronomicAdvisory, "id" | "category_key">) {
  const result = await query<AdvisoryRow>(
    `insert into agronomic_advisories
      (crop_id, category_id, scope_type, scope_id, status, title, message, recommended_action,
       starts_at, ends_at, active, priority, source_type, source_name, source_url, validated_by, reviewed_at, notes)
     values ($1,$2::uuid,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz,$11,$12,$13,$14,$15,$16,$17::timestamptz,$18)
     returning id::text, crop_id::text, category_id::text, ''::text as category_key, scope_type, scope_id::text,
       status, title, message, recommended_action, starts_at::text, ends_at::text, active, priority,
       source_type, source_name, source_url, validated_by, reviewed_at::text, notes`,
    [input.crop_id, input.category_id, input.scope_type, input.scope_id, input.status, input.title, input.message,
      input.recommended_action, input.starts_at, input.ends_at, input.active, input.priority, input.source_type,
      input.source_name, input.source_url, input.validated_by, input.reviewed_at, input.notes],
  );
  return result.rows[0];
}
