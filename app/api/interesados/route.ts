import { NextResponse } from "next/server";
import { saveInteresadoConConsentimiento } from "@/lib/consultas/interesados";
import { DomainError } from "@/lib/consultas/service";
import { readJsonBody } from "@/lib/http/json-body";
import { interesadoSchema,parseInput } from "@/lib/security/validation";
import { enforceEmailSaveLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try { const payload=parseInput(interesadoSchema,await readJsonBody(request));await enforceEmailSaveLimit(payload.email);await saveInteresadoConConsentimiento(payload);return NextResponse.json({ ok: true }); }
  catch(error) { const status=error instanceof DomainError?error.status:500;return NextResponse.json({ error: status===413?"La solicitud supera el tamaño permitido.":status===429?"Se alcanzó el límite de guardados. Intentá nuevamente más tarde.":status===400?"Necesitamos un email válido y tu consentimiento para guardar el seguimiento.":"No pudimos guardar el seguimiento. Intentá nuevamente." }, { status,headers:status===429?{"Retry-After":String((error as DomainError).details.retry_after??3600)}:undefined }); }
}
