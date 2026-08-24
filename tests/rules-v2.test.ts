import test from "node:test";
import assert from "node:assert/strict";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { IndicatorEngine } from "../lib/indicators/engine";
import type { ReglaAgronomicaV2, SerieClimaticaDiaria } from "../types";

const engine = new RulesEngineV2(); const at = "2026-07-24T12:00:00.000Z";
const base=(clave:string,window:number,niveles:ReglaAgronomicaV2["definicion"]["niveles"],fallback:any={estado:"sin_condiciones"}):ReglaAgronomicaV2=>({id:clave,clave,version:"1.0",cultivo:"soja",estado:"vigente",ventana_dias:window,fuente_tecnica:"fixture",limitaciones_declaradas:"fixture",validado_por:"fixture",validado_en:at,condiciones_revision:"fixture",decisiones_pendientes:[],definicion:{niveles,sin_coincidencia:fallback}});
function c(variable:any,agregador:any,operador:any,valor:any,unidad:string){return {variable,agregador,operador,valor,unidad};}
function rain(operador:any,valor:any){return {...c("precipitacion","dias_con_condicion",operador,valor,"dias"),subcondicion:{operador:"gte" as const,valor:1,unidad:"mm"}};}
const foliar=base("enfermedades_foliares",5,[
 {orden:1,clave:"favorables",orden_visual:1,etiqueta:"Favorables",condiciones:[c("humedad_relativa","media_ventana","gt",80,"%"),rain("gte",3),c("temperatura_media","media_ventana","between",[18,28],"C")]},
 {orden:2,clave:"moderadas",orden_visual:2,etiqueta:"Moderadas",condiciones:[c("humedad_relativa","media_ventana","between",[65,80],"%"),rain("between",[1,2]),c("temperatura_media","media_ventana","between",[18,28],"C")]},
 {orden:3,clave:"desfavorables",orden_visual:3,etiqueta:"Desfavorables",condiciones:[c("humedad_relativa","media_ventana","lt",65,"%"),rain("eq",0)]},
],{estado:"indeterminado",motivo:"sin_nivel_coincidente"});
const frost=base("temperatura_bajo_umbral",3,[{orden:1,clave:"condiciones_detectadas",orden_visual:1,etiqueta:"Frío",condiciones:[c("temperatura_min","min_ventana","lt",2,"C")]}]);
const dry=base("baja_precipitacion",14,[{orden:1,clave:"condiciones_detectadas",orden_visual:1,etiqueta:"Baja P",condiciones:[c("precipitacion","suma_ventana","lt",10,"mm")]}]);
const wet=base("precipitacion_elevada",7,[{orden:1,clave:"condiciones_detectadas",orden_visual:1,etiqueta:"Alta P",condiciones:[c("precipitacion","suma_ventana","gt",100,"mm")]}]);
function days(count:number,{hr=75,temp=22,rainDays=0,totalRain=rainDays,min=5}:{hr?:number;temp?:number;rainDays?:number;totalRain?:number;min?:number}={}):SerieClimaticaDiaria[]{return Array.from({length:count},(_,i)=>({fecha:`2026-07-${String(10+i).padStart(2,"0")}`,temperaturaMedia:temp,temperaturaMinima:min,temperaturaMaxima:temp+5,humedadRelativa:hr,precipitacion:i<rainDays?totalRain/rainDays:0,vientoMedio:10,puntoRocio:null,deficitPresionVapor:null,evapotranspiracion:null,et0:2,humedadSuelo:{profundidad0a1cm:null,profundidad1a3cm:null,profundidad3a9cm:null,profundidad9a27cm:null,profundidad27a81cm:null},temperaturaSuelo:{profundidad0cm:null,profundidad6cm:null,profundidad18cm:null,profundidad54cm:null},radiacionSolar:null}));}
const cases:[string,SerieClimaticaDiaria[],string][]=[
 ["1 favorable",days(5,{hr:85,rainDays:3,totalRain:6,temp:22}),"favorables"],["2 moderada",days(5,{hr:75,rainDays:2,totalRain:4,temp:21}),"moderadas"],["3 desfavorable",days(5,{hr:60}),"desfavorables"],["4 HR alta y poca lluvia",days(5,{hr:85,rainDays:1,temp:24}),"indeterminado"],["5 HR intermedia y mucha lluvia",days(5,{hr:70,rainDays:4,temp:22}),"indeterminado"],["6 temperatura fuera de rango",days(5,{hr:85,rainDays:4,temp:31}),"indeterminado"],["7 HR baja con lluvia",days(5,{hr:60,rainDays:2}),"indeterminado"],["8 invierno",days(5,{hr:75,rainDays:2,temp:8}),"indeterminado"],["9 borde HR 80",days(5,{hr:80,rainDays:2}),"moderadas"],["10 borde HR 80 lluvia fuera",days(5,{hr:80,rainDays:3}),"indeterminado"],["11 borde HR 65",days(5,{hr:65,rainDays:1,temp:20}),"moderadas"]];
for(const [name,series,expected] of cases)test(name,()=>assert.equal(engine.evaluate(foliar,series,at).estado,expected));
test("12 traza 0.3 no cuenta",()=>{const condition=rain("eq",0);const result=new IndicatorEngine().calculate(condition,[...days(4),{...days(1)[0],fecha:"2026-07-20",precipitacion:0.3}],5);assert.equal(result.valor,0);});
test("13 helada activa",()=>assert.equal(engine.evaluate(frost,days(3,{min:1.9}),at).estado,"condiciones_detectadas"));
test("14 helada borde",()=>assert.equal(engine.evaluate(frost,days(3,{min:2}),at).estado,"sin_condiciones"));
test("15 un día bajo umbral",()=>{const s=days(3);s[0].temperaturaMinima=4.1;s[1].temperaturaMinima=1.7;s[2].temperaturaMinima=3.5;assert.equal(engine.evaluate(frost,s,at).estado,"condiciones_detectadas");});
test("16 baja precipitación bordes",()=>{assert.equal(engine.evaluate(dry,days(14,{totalRain:9.9,rainDays:1}),at).estado,"condiciones_detectadas");assert.equal(engine.evaluate(dry,days(14,{totalRain:10,rainDays:1}),at).estado,"sin_condiciones");});
test("17 precipitación elevada bordes",()=>{assert.equal(engine.evaluate(wet,days(7,{totalRain:100,rainDays:1}),at).estado,"sin_condiciones");assert.equal(engine.evaluate(wet,days(7,{totalRain:100.1,rainDays:1}),at).estado,"condiciones_detectadas");});
test("18 null no es cero",()=>{const s=days(14,{totalRain:3,rainDays:1});s[4].precipitacion=null;const r=engine.evaluate(dry,s,at);assert.equal(r.estado,"indeterminado");assert.equal(r.motivo,"datos_insuficientes");});
test("19 variables nuevas quedan disponibles para agregaciones futuras",()=>{const s=days(3);s.forEach((day,index)=>{day.deficitPresionVapor=index+1;day.humedadSuelo.profundidad9a27cm=0.2+index*0.1;});assert.equal(new IndicatorEngine().calculate(c("deficit_presion_vapor","media_ventana","gt",0,"kPa"),s,3).valor,2);assert.equal(new IndicatorEngine().calculate(c("humedad_suelo_9_27cm","min_ventana","gt",0,"m3/m3"),s,3).valor,0.2);});
