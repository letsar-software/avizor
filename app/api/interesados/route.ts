import { NextResponse } from "next/server";
import { saveInteresado } from "@/lib/consultas/repository";

function isValidPayload(value: unknown): value is {
  email: string;
  share_token?: string;
  session_id?: string;
  localidad?: string;
  cultivo?: string;
} {
  if (!value || typeof value !== "object") return false;

  const payload = value as { email?: unknown };
  return typeof payload.email === "string" && payload.email.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "La solicitud no tiene los datos necesarios." }, { status: 400 });
    }

    await saveInteresado(payload);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar el seguimiento. Intentá nuevamente." }, { status: 500 });
  }
}

