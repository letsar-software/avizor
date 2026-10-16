import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { hashInteractionToken } from "./consultation-token";

export async function requireConsultationInteraction(shareToken: string, token?: string | null, execute: typeof query = query, configured = hasDatabaseConfig()) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new DomainError("CONSULTA_SOLO_LECTURA", "El enlace compartido permite únicamente consultar el resultado.", 403);
  if (!configured) throw new DomainError("PERSISTENCIA_NO_DISPONIBLE", "La persistencia no está configurada.", 503);
  const result = await execute<{id:string;cultivo:string;localidad_normalizada:string}>(
    "select id::text,cultivo,localidad_normalizada from consultas where share_token=$1 and interaction_token_hash=$2 and created_at >= now() - interval '30 days'",
    [shareToken, hashInteractionToken(token)]);
  if (!result.rows[0]) throw new DomainError("CONSULTA_SOLO_LECTURA", "No tenés permiso para agregar información a este resultado.", 403);
  return result.rows[0];
}
