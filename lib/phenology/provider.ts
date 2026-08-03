import type { FenologiaEstimada, GrupoMadurez, HitoFenologico } from "@/types";

const OFFSETS: Record<GrupoMadurez, number[]> = {
  III: [7, 52, 72, 94, 132],
  "IV corto": [8, 58, 79, 104, 144],
  "IV largo": [8, 64, 87, 114, 154],
  V: [9, 70, 95, 125, 165],
};

const STAGES: Array<[HitoFenologico["codigo"], string]> = [
  ["E", "Emergencia"],
  ["R1", "Inicio de floración"],
  ["R3", "Inicio de formación de vainas"],
  ["R5", "Inicio de llenado de granos"],
  ["R7", "Inicio de madurez fisiológica"],
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export class PhenologyProvider {
  estimate(input: {
    fechaSiembra: string;
    grupoMadurez: GrupoMadurez;
    cultivarId?: string;
    fechaConsulta?: Date;
  }): FenologiaEstimada {
    const planting = new Date(`${input.fechaSiembra}T12:00:00Z`);
    if (Number.isNaN(planting.getTime())) throw new Error("Fecha de siembra inválida");

    const hitos = STAGES.map(([codigo, nombre], index) => ({
      codigo,
      nombre,
      fecha_estimada: isoDate(addDays(planting, OFFSETS[input.grupoMadurez][index])),
    }));
    const today = input.fechaConsulta ?? new Date();
    const current = [...hitos].reverse().find((hito) => new Date(`${hito.fecha_estimada}T23:59:59Z`) <= today) ?? hitos[0];

    return {
      estadio_actual_estimado: current.codigo,
      nombre_estadio: current.nombre,
      fecha_estimada: current.fecha_estimada,
      fecha_inicio_estimada: isoDate(addDays(new Date(`${current.fecha_estimada}T12:00:00Z`), -4)),
      fecha_fin_estimada: isoDate(addDays(new Date(`${current.fecha_estimada}T12:00:00Z`), 4)),
      margen_dias: 4,
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
