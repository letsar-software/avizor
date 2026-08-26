"use client";
import { useState } from "react";
import { GRUPOS_MADUREZ, HITOS_FENOLOGICOS_MAX, HITOS_FENOLOGICOS_MIN } from "@/lib/phenology/spec";
import type { GrupoMadurez, ModeloFenologicoParametros } from "@/types";

// Estado de la grilla offsets_dias (grupo de madurez × hito), el set de hitos en sí
// y margen_dias. Separado del formulario para poder leerlo y testearlo sin montar
// la UI, mismo criterio que useRuleDefinitionEditor.ts en el editor de reglas.
//
// Invariante que mantiene esta interfaz: offsets_dias[grupo] siempre tiene la misma
// longitud que hitos, en el mismo orden — agregar/quitar un hito agrega/quita la
// posición correspondiente en todos los grupos a la vez, nunca queda desalineado.
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

  function addHito() {
    setParametros((prev) => {
      if (prev.hitos.length >= HITOS_FENOLOGICOS_MAX) return prev;
      return {
        ...prev,
        hitos: [...prev.hitos, { codigo: "", nombre: "" }],
        offsets_dias: Object.fromEntries(GRUPOS_MADUREZ.map((grupo) => [grupo, [...(prev.offsets_dias[grupo] ?? []), 0]])) as ModeloFenologicoParametros["offsets_dias"],
      };
    });
  }

  function removeHito(hitoIndex: number) {
    setParametros((prev) => {
      if (prev.hitos.length <= HITOS_FENOLOGICOS_MIN) return prev;
      return {
        ...prev,
        hitos: prev.hitos.filter((_, index) => index !== hitoIndex),
        offsets_dias: Object.fromEntries(GRUPOS_MADUREZ.map((grupo) => [grupo, prev.offsets_dias[grupo].filter((_, index) => index !== hitoIndex)])) as ModeloFenologicoParametros["offsets_dias"],
      };
    });
  }

  function updateHitoCodigo(hitoIndex: number, codigo: string) {
    setParametros((prev) => ({ ...prev, hitos: prev.hitos.map((hito, index) => (index === hitoIndex ? { ...hito, codigo } : hito)) }));
  }

  function updateHitoNombre(hitoIndex: number, nombre: string) {
    setParametros((prev) => ({ ...prev, hitos: prev.hitos.map((hito, index) => (index === hitoIndex ? { ...hito, nombre } : hito)) }));
  }

  return { parametros, updateOffset, updateMargen, addHito, removeHito, updateHitoCodigo, updateHitoNombre };
}
