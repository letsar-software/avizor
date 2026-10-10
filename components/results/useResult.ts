"use client";
import { useEffect, useState } from "react";
import type { ResultadoConsultaV2Publica } from "@/types";

export interface ResultViewProps { initialResult?: ResultadoConsultaV2Publica; basePath?: string }

// Un snapshot recibido por URL siempre prevalece sobre los datos de la pestaña.
export function useResult(initialResult?: ResultadoConsultaV2Publica) {
  const [result, setResult] = useState<ResultadoConsultaV2Publica | null>(initialResult ?? null);
  const [loaded, setLoaded] = useState(Boolean(initialResult));
  useEffect(() => {
    if (initialResult) { setResult(initialResult); setLoaded(true); return; }
    try {
      const raw = sessionStorage.getItem("avizor_resultado");
      const parsed = raw ? JSON.parse(raw) : null;
      setResult(Array.isArray(parsed?.reglas) && Array.isArray(parsed?.clima?.serie) ? parsed : null);
    } catch { setResult(null); }
    finally { setLoaded(true); }
  }, [initialResult]);
  return { result, setResult, loaded };
}
