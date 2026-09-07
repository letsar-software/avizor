import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { logSafeInfo } from "@/lib/logging/safe";

export interface InteresadoConConsentimiento { email: string; consentimiento: true; consentimiento_version: string; consentimiento_fecha: string; share_token?: string; session_id?: string; localidad?: string; cultivo?: string }
export interface SuscriptorActivo { id: string; email: string; consentimiento_version: string; consentimiento_fecha: string }

export function esSuscriptorActivo(record: { consentimiento: boolean; baja_en: string | null; ultima_interaccion_en: string | null; created_at: string }, now = new Date()) {
  const actividad = new Date(record.ultima_interaccion_en ?? record.created_at).getTime();
  return record.consentimiento && record.baja_en === null && actividad >= now.getTime() - 24 * 30 * 24 * 60 * 60 * 1000;
}

export async function saveInteresadoConConsentimiento(input: InteresadoConConsentimiento) {
  const email = input.email.trim().toLowerCase();
  if (!hasDatabaseConfig()) { logSafeInfo({ operation: "interesado.persistence_unavailable" }); return null; }
  const consultation = input.share_token ? await query<{ id: string }>("select id::text from consultas where share_token = $1", [input.share_token]) : null;
  // A new explicit consent may reactivate a prior suppression, but an ordinary
  // consultation never calls this function.
  const restored = await query<{ id: string }>(`update interesados set consentimiento=true, consentimiento_version=$2, consentimiento_fecha=$3, baja_en=null, ultima_interaccion_en=$3, consulta_id=$4, session_id=$5, localidad=$6, cultivo=$7 where id=(select id from interesados where lower(email)=lower($1) and baja_en is not null order by baja_en desc limit 1) returning id::text`, [email, input.consentimiento_version, input.consentimiento_fecha, consultation?.rows[0]?.id ?? null, input.session_id ?? null, input.localidad ?? null, input.cultivo ?? null]);
  if (restored.rows[0]) return restored.rows[0].id;
  const result = await query<{ id: string }>(`insert into interesados (consulta_id, session_id, email, localidad, cultivo, consentimiento, consentimiento_version, consentimiento_fecha, ultima_interaccion_en) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id::text`, [consultation?.rows[0]?.id ?? null, input.session_id ?? null, email, input.localidad ?? null, input.cultivo ?? null, true, input.consentimiento_version, input.consentimiento_fecha, input.consentimiento_fecha]);
  return result.rows[0]?.id ?? null;
}

export async function darDeBajaNovedades(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  if (!hasDatabaseConfig()) return null;
  // Clear every non-essential association immediately. Email, withdrawal date,
  // and consent version are the minimum suppression record.
  const result = await query<{ id: string }>(`update interesados set consentimiento=false, baja_en=now(), ultima_interaccion_en=now(), consulta_id=null, session_id=null, localidad=null, cultivo=null, nombre_lote=null where lower(email)=lower($1) and baja_en is null returning id::text`, [email]);
  return result.rows[0]?.id ?? null;
}

export async function getSuscriptoresActivos() {
  if (!hasDatabaseConfig()) return [] as SuscriptorActivo[];
  const result = await query<SuscriptorActivo>(`select id::text,email,consentimiento_version,consentimiento_fecha from interesados where consentimiento=true and baja_en is null and coalesce(ultima_interaccion_en, created_at) >= now() - interval '24 months' order by created_at asc`);
  return result.rows;
}
