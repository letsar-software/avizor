"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bug } from "lucide-react";
import type { ResultadoConsultaV2Publica } from "@/types";
import { PestResults, visiblePestEvaluations } from "@/components/results/PestResults";

export default function PestDetailV2() {
  const [result, setResult] = useState<ResultadoConsultaV2Publica | null>(null); const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const raw = sessionStorage.getItem("avizor_resultado"); if (raw) { const parsed = JSON.parse(raw); if (parsed?.reglas && parsed?.clima) setResult(parsed); } } finally { setLoaded(true); } }, []);
  if (!loaded) return <main className="min-h-[60vh]"/>;
  if (!result || !visiblePestEvaluations(result).length) return <main className="mx-auto max-w-2xl px-5 py-16 text-center"><Bug className="mx-auto h-10 w-10 text-amber-700"/><h1 className="mt-4 text-2xl font-bold">Sin evaluaciones de plagas disponibles</h1><p className="mt-3 text-sm text-[#526477]">Este mensaje no implica ausencia de plagas. Realizá una consulta actualizada para revisar la información disponible.</p><Link href="/resultado" className="mt-5 inline-flex rounded-lg border px-5 py-3 font-semibold text-[#087b4b]">Volver al resultado</Link></main>;
  return <main className="mx-auto max-w-[1420px] px-4 py-5 text-[#081a31] sm:px-7 lg:py-8"><Link href="/resultado" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#087b4b]"><ArrowLeft className="h-4 w-4"/>Volver al resultado</Link><header className="mt-2 rounded-xl border bg-white p-5"><p className="text-[10px] font-bold uppercase text-amber-700">Información adicional</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Plagas</h1><p className="mt-3 max-w-3xl text-xs leading-5 text-[#405369]">Estas evaluaciones describen favorabilidad ambiental o períodos relevantes para monitoreo. No diagnostican presencia ni modifican el estado general.</p></header><PestResults result={result}/></main>;
}
