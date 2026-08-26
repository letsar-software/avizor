import type { AgregacionInput } from "@/lib/indicators/engine";
import type { IndicadorPlaga, ReglaPlaga } from "@/types";

// Traduce cada indicador con nombre de plagas (temp_media_7d, precip_10d, etc.) a la
// especificación que ya entiende el motor genérico de indicadores climáticos
// (lib/indicators/engine.ts) — el mismo que usan las reglas de enfermedades. Antes
// lib/pests/engine.ts reimplementaba esta agregación a mano (docs/panel-admin-pendientes.md,
// punto 9): sumar un indicador nuevo, con variable/agregador/ventana ya soportados,
// es agregar un caso acá, no reescribir matemática de series climáticas.
//
// cobertura_minima siempre 1: el motor de plagas históricamente exige la ventana
// completa sin días faltantes para cualquier indicador — más estricto que el 80%
// que engine-v2 tolera por defecto en media_ventana — así que se preserva ese criterio
// explícitamente en vez de heredar el default genérico.
export function resolverIndicadorPlaga(key: IndicadorPlaga, config: ReglaPlaga["configuracion"]): { spec: AgregacionInput; ventanaDias: number } | null {
  switch (key) {
    case "temp_media_7d":
      return { spec: { variable: "temperatura_media", agregador: "media_ventana", cobertura_minima: 1 }, ventanaDias: 7 };
    case "temp_media_10d":
      return { spec: { variable: "temperatura_media", agregador: "media_ventana", cobertura_minima: 1 }, ventanaDias: 10 };
    case "temp_max_media_10d":
      return { spec: { variable: "temperatura_max", agregador: "media_ventana", cobertura_minima: 1 }, ventanaDias: 10 };
    case "precip_7d":
      return { spec: { variable: "precipitacion", agregador: "suma_ventana", cobertura_minima: 1 }, ventanaDias: 7 };
    case "precip_10d":
      return { spec: { variable: "precipitacion", agregador: "suma_ventana", cobertura_minima: 1 }, ventanaDias: 10 };
    case "dias_con_lluvia_7d":
      return { spec: { variable: "precipitacion", agregador: "dias_con_condicion", cobertura_minima: 1, subcondicion: { operador: "gte", valor: config.umbral_dia_lluvia_mm, unidad: "mm" } }, ventanaDias: 7 };
    case "dias_calidos_10d":
      if (config.umbral_termico === undefined) return null;
      return { spec: { variable: "temperatura_max", agregador: "dias_con_condicion", cobertura_minima: 1, subcondicion: { operador: "gte", valor: config.umbral_termico, unidad: "C" } }, ventanaDias: 10 };
    case "dias_consecutivos_sin_lluvia":
      // Racha máxima de días sin lluvia: ningún agregador de IndicatorEngine la calcula
      // todavía (media/suma/mínimo/conteo de días, no rachas consecutivas). Nadie lo
      // evalúa hoy — P-02 (arañuela) sigue sin niveles activos, pendiente de PEND-19 —
      // así que no se agrega un agregador nuevo especulativamente; queda documentado
      // acá para cuando haga falta resolverlo.
      return null;
    default:
      return null;
  }
}
