import { DomainError } from "@/lib/consultas/service";

export interface Lot {
  id: string;
  empresa_id: string | null;
  nombre: string;
  cultivo: string | null;
  activo: boolean;
}

/** Quién pide los datos del lote. La consulta web anónima no tiene identidad. */
export type LotActor =
  | { kind: "empresa"; empresaId: string }
  | { kind: "service" }
  | { kind: "anonymous" };

export const LOT_NOT_FOUND = "No encontramos ese lote o no tenés acceso a sus datos.";

/**
 * Valida existencia y acceso antes de leer datos de campo. Inexistente, inactivo o de
 * otra empresa responden igual (404) para no revelar qué lotes existen.
 */
export async function resolveLotAccess(lotId: string, actor: LotActor, loadLot: (id: string) => Promise<Lot | null>): Promise<Lot> {
  if (actor.kind === "anonymous") {
    throw new DomainError("LOTE_REQUIERE_AUTENTICACION", "Para usar datos de un lote, la consulta debe hacerse con la API key de la empresa dueña del lote.", 401);
  }
  const lot = await loadLot(lotId);
  if (!lot || !lot.activo) throw new DomainError("LOTE_NO_ENCONTRADO", LOT_NOT_FOUND, 404);
  if (actor.kind === "empresa" && lot.empresa_id !== actor.empresaId) throw new DomainError("LOTE_NO_ENCONTRADO", LOT_NOT_FOUND, 404);
  return lot;
}
