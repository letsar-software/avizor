"use client";
import { useState } from "react";
import type { GrupoMadurez, ModeloFenologicoParametros } from "@/types";

// Estado de la grilla offsets_dias (grupo de madurez × hito) y margen_dias.
// Separado del formulario para poder leerlo y testearlo sin montar la UI,
// mismo criterio que useRuleDefinitionEditor.ts en el editor de reglas.
export function useModeloParametrosEditor(initial: ModeloFenologicoParametros) {
  const [parametros, setParametros] = useState<ModeloFenologicoParametros>(initial);

  function updateOffset(grupo: GrupoMadurez, hitoIndex: number, valor: number) {
    setParametros((prev) => ({
      ...prev,
      offsets_dias: {
        ...prev.offsets_dias,
        [grupo]: prev.offsets_dias[grupo].map((dia, index) => (index === hitoIndex ? valor : dia)),
      },
    }));
  }

  function updateMargen(valor: number) {
    setParametros((prev) => ({ ...prev, margen_dias: valor }));
  }

  return { parametros, updateOffset, updateMargen };
}
