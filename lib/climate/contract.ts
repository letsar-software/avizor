import type { LocalidadNormalizada, SerieClimaticaDiaria } from "@/types";

export interface ClimateSeriesRequest { localidad: LocalidadNormalizada; fechaRef: string; dias: number; }
export interface ClimateSeriesResult {
  proveedor: string;
  coordenadas: { latitud: number; longitud: number };
  fechaConsulta: string;
  rangoTemporal: { desde: string; hasta: string };
  variablesDisponibles: string[];
  variablesFaltantes: string[];
  diasSolicitados: number;
  diasDisponibles: number;
  obtenidoEn: string;
  cobertura: number;
  errores: string[];
  adapterVersion: string;
  serie: SerieClimaticaDiaria[];
}
export interface ClimateSeriesProvider { obtenerSerie(input: ClimateSeriesRequest): Promise<ClimateSeriesResult>; }
