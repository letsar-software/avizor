import { NextResponse } from "next/server";
import { saveInteresadoConConsentimiento } from "@/lib/consultas/interesados";

type Payload = { email: string; consentimiento: true; consentimiento_version: string; consentimiento_fecha: string; nombre_lote?: string; share_token?: string; session_id?: string; localidad?: string; cultivo?: string };

function isValidPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Payload>;
  return typeof p.email === "string" && p.email.includes("@") && p.consentimiento === true && typeof p.consentimiento_version === "string" && Boolean(p.consentimiento_version) && typeof p.consentimiento_fecha === "string" && !Number.isNaN(Date.parse(p.consentimiento_fecha));
}

export async function POST(request: Request) {
  try { const payload = await request.json(); if (!isValidPayload(payload)) return NextResponse.json({ error: "Necesitamos un email válido y tu consentimiento para guardar el seguimiento." }, { status: 400 }); await saveInteresadoConConsentimiento(payload); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No pudimos guardar el seguimiento. Intentá nuevamente." }, { status: 500 }); }
}
