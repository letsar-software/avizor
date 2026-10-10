"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { resultShareLinks } from "@/lib/results/sharing";

export default function CompartirSection({ token, persisted }: { token: string; persisted: boolean }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const links = origin && persisted ? resultShareLinks(origin, token) : null;
  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-avizor-green focus-visible:ring-offset-2";

  return <section aria-labelledby="share-result-title" className="mt-5 rounded-xl border border-[#d9e8df] bg-white p-5">
    <h2 id="share-result-title" className="text-base font-bold text-avizor-navy">Compartir resultado</h2>
    <p className="mt-2 text-sm text-[#526477]">Compartí este análisis con otra persona.</p>
    {links ? <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
      <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-avizor-green text-white hover:bg-avizor-green-mid`}><MessageCircle className="h-5 w-5" aria-hidden="true"/>WhatsApp</a>
      <a href={links.email} className={`${buttonClass} border border-avizor-green text-avizor-green hover:bg-avizor-green-light`}><Mail className="h-5 w-5" aria-hidden="true"/>Correo</a>
    </div> : <p className="mt-4 text-sm text-[#526477]" role="status">{persisted ? "Preparando las opciones para compartir…" : "No pudimos guardar este resultado para compartirlo. Realizá una nueva consulta."}</p>}
    {persisted && <p className="mt-3 text-xs leading-5 text-[#526477]">El enlace está disponible durante 30 días desde la consulta.</p>}
  </section>;
}
