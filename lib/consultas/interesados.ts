import { hasDatabaseConfig, query } from "@/lib/db/postgres";

export interface InteresadoConConsentimiento { email: string; consentimiento: true; consentimiento_version: string; consentimiento_fecha: string; nombre_lote?: string; share_token?: string; session_id?: string; localidad?: string; cultivo?: string }

export async function saveInteresadoConConsentimiento(input: InteresadoConConsentimiento) {
  const email = input.email.trim().toLowerCase();
  if (!hasDatabaseConfig()) { console.info("interesado", { persistido: false, tiene_consulta: Boolean(input.share_token), tiene_sesion: Boolean(input.session_id) }); return null; }
  const consultation = input.share_token ? await query<{ id: string }>("select id::text from consultas where share_token = $1", [input.share_token]) : null;
  const result = await query<{ id: string }>(`insert into interesados (consulta_id, session_id, email, localidad, cultivo, nombre_lote, consentimiento, consentimiento_version, consentimiento_fecha) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id::text`, [consultation?.rows[0]?.id ?? null, input.session_id ?? null, email, input.localidad ?? null, input.cultivo ?? null, input.nombre_lote?.trim() || null, true, input.consentimiento_version, input.consentimiento_fecha]);
  return result.rows[0]?.id ?? null;
}
