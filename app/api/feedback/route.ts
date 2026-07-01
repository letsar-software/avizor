import { NextResponse } from "next/server";
import { saveFeedback } from "@/lib/consultas/repository";

const VALID_UTILIDAD = new Set(["si", "parcialmente", "no"]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidPayload(value: unknown): value is {
  utilidad?: "si" | "parcialmente" | "no";
  observaciones?: string[];
  sugerencia?: string;
  share_token?: string;
  session_id?: string;
} {
  if (!value || typeof value !== "object") return false;

  const payload = value as { utilidad?: unknown; observaciones?: unknown; sugerencia?: unknown };
  const hasUtilidad = typeof payload.utilidad === "string" && VALID_UTILIDAD.has(payload.utilidad);
  const hasObservaciones = isStringArray(payload.observaciones);
  const hasSugerencia = typeof payload.sugerencia === "string";

  return hasUtilidad || hasObservaciones || hasSugerencia;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "La solicitud no tiene los datos necesarios." }, { status: 400 });
    }

    await saveFeedback({
      ...payload,
      observaciones: isStringArray(payload.observaciones) ? payload.observaciones : [],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar el feedback. Intentá nuevamente." }, { status: 500 });
  }
}

