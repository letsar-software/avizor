"use client";
import { useState } from "react";
import type { AggregatorKey, CondicionDefinicion, NivelRegla, SpecOperator } from "@/types";

const DEFAULT_CONDICION: CondicionDefinicion = { variable: "temperatura_media", agregador: "media_ventana", operador: "gte", valor: 0, unidad: "C" };

// Estado y reglas de forma del árbol niveles[].condiciones[] del editor de reglas.
// Separado de RuleEditor para que la lógica de negocio (coerción de `valor` y
// `subcondicion` al contrato) se pueda leer y testear sin montar el formulario entero.
export function useRuleDefinitionEditor(initialNiveles: NivelRegla[]) {
  const [niveles, setNiveles] = useState<NivelRegla[]>(initialNiveles);

  function updateNivelField<K extends keyof NivelRegla>(index: number, field: K, value: NivelRegla[K]) {
    setNiveles((prev) => prev.map((nivel, i) => (i !== index ? nivel : { ...nivel, [field]: value })));
  }

  function addNivel() {
    setNiveles((prev) => [...prev, { orden: prev.length + 1, clave: `nivel_${prev.length + 1}`, orden_visual: prev.length + 1, etiqueta: "Nuevo nivel", explicacion: "", recomendacion: "", condiciones: [] }]);
  }

  function removeNivel(index: number) {
    setNiveles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCondicion(nivelIndex: number, condIndex: number, updater: (condicion: CondicionDefinicion) => CondicionDefinicion) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : { ...nivel, condiciones: nivel.condiciones.map((c, ci) => (ci !== condIndex ? c : updater(c))) })));
  }

  function addCondicion(nivelIndex: number) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : { ...nivel, condiciones: [...nivel.condiciones, { ...DEFAULT_CONDICION }] })));
  }

  function removeCondicion(nivelIndex: number, condIndex: number) {
    setNiveles((prev) => prev.map((nivel, ni) => (ni !== nivelIndex ? nivel : { ...nivel, condiciones: nivel.condiciones.filter((_, ci) => ci !== condIndex) })));
  }

  // Cambiar de/a "between" cambia la forma de `valor` (número <-> tupla). Vive acá
  // para que ningún consumidor del hook tenga que reimplementar la regla del contrato.
  function handleOperadorChange(nivelIndex: number, condIndex: number, operador: SpecOperator) {
    updateCondicion(nivelIndex, condIndex, (c) => {
      const primero = Array.isArray(c.valor) ? c.valor[0] : c.valor;
      return { ...c, operador, valor: operador === "between" ? [primero, primero] : primero };
    });
  }

  // Cambiar a/desde "dias_con_condicion" agrega o quita la subcondición que exige el contrato.
  function handleAgregadorChange(nivelIndex: number, condIndex: number, agregador: AggregatorKey) {
    updateCondicion(nivelIndex, condIndex, (c) => {
      const next = { ...c, agregador };
      if (agregador === "dias_con_condicion") next.subcondicion = c.subcondicion ?? { operador: "gte", valor: 0, unidad: c.unidad };
      else delete next.subcondicion;
      return next;
    });
  }

  return { niveles, updateNivelField, addNivel, removeNivel, updateCondicion, addCondicion, removeCondicion, handleOperadorChange, handleAgregadorChange };
}
