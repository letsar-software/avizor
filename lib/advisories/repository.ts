import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import type { AgronomicAdvisory } from "@/types";

export interface AdvisoryScope {
  regionId?: string | null;
  farmId?: string | null;
  fieldId?: string | null;
}

type AdvisoryRow = Omit<AgronomicAdvisory, "category_key"> & { category_key: string };

/**
 * Candidatas del cultivo (o globales de cultivo). La decisión de vigencia y alcance
 * se toma en lib/advisories/applicability.ts para que sea la misma en todos los
 * caminos y quede diagnosticable; acá sólo se acota el volumen.
 */
export async function getCandidateAdvisories(cropId: string): Promise<AgronomicAdvisory[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await query<AdvisoryRow>(
      `select a.id::text, a.crop_id::text, a.category_id::text, c.clave as category_key,
        a.scope_type, a.scope_id::text, a.status, a.title, a.message,
        a.recommended_action, a.starts_at::text, a.ends_at::text, a.active,
        a.priority, a.source_type, a.source_name, a.source_url, a.validated_by,
        a.reviewed_at::text, a.notes
       from agronomic_advisories a
       join categorias_agronomicas c on c.id = a.category_id
       where (a.crop_id is null or lower(a.crop_id::text) = lower($1))
         and (a.ends_at is null or a.ends_at >= now() - interval '400 days')
       order by a.priority desc, a.reviewed_at desc`,
      [cropId],
    );
    return result.rows;
  } catch (error) {
    // Sin la migración 030 no hay alertas técnicas; nunca se fabrican.
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
