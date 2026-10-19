import type { LotActor } from "@/lib/lots/access";
import { empresaForApiKey } from "@/lib/lots/repository";
import { requireInternalAuth } from "@/lib/security/internal-auth";

/** Actor de una request sin API key: servicio interno con token válido o anónimo. */
export function internalOrAnonymous(request: Request): LotActor {
  try {
    requireInternalAuth(request);
    return { kind: "service" };
  } catch {
    return { kind: "anonymous" };
  }
}

/** Actor de una request autenticada con API key de empresa. */
export async function empresaActor(apiKeyId: string): Promise<LotActor> {
  const empresaId = await empresaForApiKey(apiKeyId);
  return empresaId ? { kind: "empresa", empresaId } : { kind: "anonymous" };
}
