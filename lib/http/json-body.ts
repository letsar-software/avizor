import { DomainError } from "@/lib/consultas/service";

export const MAX_JSON_BODY_BYTES = 32 * 1024;

export async function readJsonBody(request: Request, maxBytes = MAX_JSON_BODY_BYTES): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge();
  if (!request.body) throw invalidJson();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw invalidJson(); }
}

function tooLarge() { return new DomainError("PAYLOAD_DEMASIADO_GRANDE", "La solicitud supera el tamaño permitido.", 413); }
function invalidJson() { return new DomainError("REQUEST_INVALIDO", "La solicitud no tiene un JSON válido.", 400); }
