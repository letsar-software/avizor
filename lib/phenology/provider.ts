import type { FenologiaEstimada, GrupoMadurez, ModeloFenologicoParametros } from "@/types";

// Modelo por defecto: exactamente los coeficientes que antes vivían hardcodeados
// acá mismo. Se usa cuando no hay ningún modelo vigente cargado en
// modelos_fenologicos para el cultivo (ver lib/phenology/provider-v2.ts), así que
// el comportamiento de producción no cambia por el solo hecho de migrar a datos.
export const DEFAULT_PARAMETROS_FENOLOGICOS: ModeloFenologicoParametros = {
  hitos: [
    { codigo: "E", nombre: "Emergencia" },
    { codigo: "R1", nombre: "Inicio de floración" },
    { codigo: "R3", nombre: "Inicio de formación de vainas" },
    { codigo: "R5", nombre: "Inicio de llenado de granos" },
    { codigo: "R7", nombre: "Inicio de madurez fisiológica" },
  ],
  offsets_dias: {
    III: [7, 52, 72, 94, 132],
    "IV corto": [8, 58, 79, 104, 144],
    "IV largo": [8, 64, 87, 114, 154],
    V: [9, 70, 95, 125, 165],
  },
  margen_dias: 4,
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export class PhenologyProvider {
  constructor(private readonly parametros: ModeloFenologicoParametros = DEFAULT_PARAMETROS_FENOLOGICOS) {}

  estimate(input: {
    fechaSiembra: string;
    grupoMadurez: GrupoMadurez;
    cultivarId?: string;
    fechaConsulta?: Date;
  }): FenologiaEstimada {
    const planting = new Date(`${input.fechaSiembra}T12:00:00Z`);
    if (Number.isNaN(planting.getTime())) throw new Error("Fecha de siembra inválida");

    const offsets = this.parametros.offsets_dias[input.grupoMadurez];
    const hitos = this.parametros.hitos.map((hito, index) => ({
      codigo: hito.codigo,
      nombre: hito.nombre,
      fecha_estimada: isoDate(addDays(planting, offsets[index])),
    }));
    const today = input.fechaConsulta ?? new Date();
    const current = [...hitos].reverse().find((hito) => new Date(`${hito.fecha_estimada}T23:59:59Z`) <= today) ?? hitos[0];
    const margen = this.parametros.margen_dias;

    return {
      estadio_actual_estimado: current.codigo,
      nombre_estadio: current.nombre,
      fecha_estimada: current.fecha_estimada,
      fecha_inicio_estimada: isoDate(addDays(new Date(`${current.fecha_estimada}T12:00:00Z`), -margen)),
      fecha_fin_estimada: isoDate(addDays(new Date(`${current.fecha_estimada}T12:00:00Z`), margen)),
      margen_dias: margen,
      confianza: input.cultivarId?.trim() ? "media" : "baja",
      metodo: "modelo_calendario_grupo_madurez",
      version: "v1.0",
      fecha_siembra: input.fechaSiembra,
      grupo_madurez: input.grupoMadurez,
      cultivar_id: input.cultivarId?.trim() || undefined,
      hitos,
    };
  }
}
