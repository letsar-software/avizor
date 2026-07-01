import { NextResponse } from "next/server";
import { saveObservacion } from "@/lib/consultas/repository";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidPayload(value: unknown): value is {
  opciones: string[];
  detalle?: string;
  share_token?: string;
  session_id?: string;
} {
  if (!value || typeof value !== "object") return false;

  const payload = value as { opciones?: unknown; detalle?: unknown };
  return isStringArray(payload.opciones) || typeof payload.detalle === "string";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "La solicitud no tiene los datos necesarios." }, { status: 400 });
    }

    await saveObservacion({
      ...payload,
      opciones: isStringArray(payload.opciones) ? payload.opciones : [],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar la observación. Intentá nuevamente." }, { status: 500 });
  }
}

