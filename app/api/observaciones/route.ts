import { NextResponse } from "next/server";
import { saveObservacion } from "@/lib/consultas/repository";
import { DomainError } from "@/lib/consultas/service";
import { readJsonBody } from "@/lib/http/json-body";
import { observacionLegacySchema,parseInput } from "@/lib/security/validation";

export async function POST(request: Request) {
  try {
    const payload = parseInput(observacionLegacySchema,await readJsonBody(request));

    await saveObservacion({
      ...payload,
      opciones: payload.opciones,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status=error instanceof DomainError?error.status:500;
    return NextResponse.json({ error: status===413?"La solicitud supera el tamaño permitido.":status===400?"La solicitud no tiene los datos necesarios.":"No pudimos guardar la observación. Intentá nuevamente." }, { status });
  }
}

