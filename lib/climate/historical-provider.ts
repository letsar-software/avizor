import type { LocalidadNormalizada, SerieClimaticaDiaria } from "@/types";

export interface HistoricalTemperature { disponible: boolean; fuente: string; periodo_referencia: string; cobertura: number; anios_validos: number; metodo: string; actualizado_en: string; temperatura_media_observada: number | null; temperatura_media_historica: number | null; anomalia_temperatura: number | null; serie_observada: HistoricalDay[]; serie_historica: HistoricalDay[]; }
export interface HistoricalDay { fecha: string; media: number | null; maxima: number | null; minima: number | null; }
type Fetcher = typeof fetch;
const cache = new Map<string, { until: number; value: HistoricalTemperature }>();
const mean = (v: Array<number | null>) => { const n=v.filter((x):x is number=>typeof x === "number" && Number.isFinite(x)); return n.length ? Number((n.reduce((a,b)=>a+b,0)/n.length).toFixed(2)) : null; };
export class HistoricalClimateProvider {
  constructor(private readonly fetcher: Fetcher = fetch) {}
  async comparar(localidad: LocalidadNormalizada, serie: SerieClimaticaDiaria[]): Promise<HistoricalTemperature> {
    const observed=serie.slice(-15).map(d=>({fecha:d.fecha,media:d.temperaturaMedia,maxima:d.temperaturaMaxima,minima:d.temperaturaMinima}));
    const key=`era5-land:${localidad.latitud},${localidad.longitud}:${observed[0]?.fecha}:${observed.at(-1)?.fecha}`; const hit=cache.get(key); if(hit&&hit.until>Date.now()) return hit.value;
    try { const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${localidad.latitud}&longitude=${localidad.longitud}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires&models=era5_land`;
      const response=await this.fetcher(url); if(!response.ok) throw new Error("historico_no_disponible"); const data=await response.json() as {daily:{time:string[];temperature_2m_mean:number[];temperature_2m_max:number[];temperature_2m_min:number[]}};
      const days=new Map<string,number[][]>(); data.daily.time.forEach((date,i)=>{const key=date.slice(5); const values=days.get(key)??[];values.push([data.daily.temperature_2m_mean[i],data.daily.temperature_2m_max[i],data.daily.temperature_2m_min[i]]);days.set(key,values);});
      const historical=observed.map(d=>{const values=days.get(d.fecha.slice(5))??[];return {fecha:d.fecha,media:mean(values.map(v=>v[0])),maxima:mean(values.map(v=>v[1])),minima:mean(values.map(v=>v[2]))};}); const obs=mean(observed.map(d=>d.media)),hist=mean(historical.map(d=>d.media)); const value={disponible:hist!==null,fuente:"Open-Meteo Historical Weather API (ERA5-Land)",periodo_referencia:"1991-2020",cobertura:historical.filter(d=>d.media!==null).length/Math.max(1,historical.length),anios_validos:30,metodo:"Promedio de las mismas fechas calendario; proveedores no mezclados.",actualizado_en:new Date().toISOString(),temperatura_media_observada:obs,temperatura_media_historica:hist,anomalia_temperatura:obs!==null&&hist!==null?Number((obs-hist).toFixed(2)):null,serie_observada:observed,serie_historica:historical}; cache.set(key,{until:Date.now()+1000*60*60*24*30,value}); return value;
    } catch { return {disponible:false,fuente:"Open-Meteo Historical Weather API (ERA5-Land)",periodo_referencia:"1991-2020",cobertura:0,anios_validos:0,metodo:"Histórico no disponible; no afecta la consulta principal.",actualizado_en:new Date().toISOString(),temperatura_media_observada:mean(observed.map(d=>d.media)),temperatura_media_historica:null,anomalia_temperatura:null,serie_observada:observed,serie_historica:[]}; }
  }
}
