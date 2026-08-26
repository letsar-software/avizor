"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Info, Leaf, MapPin, Sprout } from "lucide-react";
import type { FenologiaEstimada } from "@/types";

export default function PhenologyDetailPage() {
  const [data, setData] = useState<FenologiaEstimada | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("avizor_resultado");
    if (stored) setData(JSON.parse(stored).contexto_fenologico?.detalle ?? JSON.parse(stored).fenologia ?? null);
  }, []);

  return <main className="mx-auto max-w-[1180px] px-5 py-7 text-[#081a31] sm:px-8 sm:py-10">
    <Link href="/resultado" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#087b4b]"><ArrowLeft className="h-4 w-4"/>Volver al resultado</Link>
    {!data ? <section className="mt-5 rounded-2xl border bg-white p-6 text-center"><Sprout className="mx-auto h-12 w-12 text-[#087b4b]"/><h1 className="mt-4 text-2xl font-bold">Completá los datos del cultivo</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#405369]">Necesitamos la fecha de siembra y el grupo de madurez para generar una estimación fenológica.</p><Link href="/consultar" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#087b4b] px-5 text-sm font-bold text-white">Completar datos</Link></section> : <PhenologyDetail data={data}/>} 
  </main>;
}

function PhenologyDetail({data}:{data:FenologiaEstimada}) {
  return <>
    <header className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#087b4b]">Contexto del cultivo</p><h1 className="mt-2 text-3xl font-bold">Fenología estimada del cultivo</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#405369]">La estimación ubica el cultivo en una etapa probable a partir de los datos ingresados. No confirma el estado observado en el lote.</p></header>
    <section className="mt-6 grid gap-4 lg:grid-cols-[.42fr_1.58fr]">
      <article className="rounded-2xl border border-[#b9dcc8] bg-[#f7fbf8] p-6 text-center"><p className="text-xs font-bold text-[#526477]">Estado actual estimado</p><p className="mt-4 text-5xl font-bold text-[#087b4b]">{data.estadio_actual_estimado}</p><p className="mt-2 text-sm font-bold">{data.nombre_estadio}</p><Sprout className="mx-auto mt-6 h-24 w-24 text-[#4e9e62]" strokeWidth={1.25}/><p className="mt-5 text-xs text-[#526477]">Fecha estimada</p><p className="mt-1 text-sm font-bold">{longDate(data.fecha_estimada)}</p><p className="mt-3 text-xs text-[#526477]">Margen estimado</p><p className="mt-1 text-sm font-bold">± {data.margen_dias} días</p></article>
      <article className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-sm font-bold">Línea de tiempo fenológica <span className="font-normal text-[#526477]">(fechas estimadas)</span></h2><div className="mt-6 flex gap-3 overflow-x-auto pb-3 sm:grid sm:overflow-visible sm:pb-0" style={{gridTemplateColumns:`repeat(${data.hitos.length}, minmax(0, 1fr))`}}>{data.hitos.map((hito,index)=><div key={hito.codigo} className={`relative min-w-[150px] rounded-xl border p-4 text-center sm:min-w-0 ${hito.codigo===data.estadio_actual_estimado?"border-[#70bd91] bg-green-50":"bg-white"}`}><span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${hito.codigo===data.estadio_actual_estimado?"bg-[#087b4b] text-white":"bg-[#f0f6f2] text-[#087b4b]"}`}>{index===0?<Leaf className="h-5 w-5"/>:<Sprout className="h-5 w-5"/>}</span><strong className="mt-3 block text-sm">{hito.codigo}</strong><span className="mt-1 block min-h-10 text-[10px] leading-4 text-[#526477]">{hito.nombre}</span><span className="mt-2 block text-[10px] font-bold">{shortDate(hito.fecha_estimada)}</span></div>)}</div>
        <h2 className="mt-8 text-sm font-bold">Datos utilizados para la estimación</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Fact Icon={CalendarDays} label="Fecha de siembra" value={longDate(data.fecha_siembra)}/><Fact Icon={Sprout} label="Grupo de madurez" value={data.grupo_madurez}/><Fact Icon={Clock3} label="Modelo utilizado" value="Calendario por grupo de madurez"/><Fact Icon={CheckCircle2} label="Nivel de confianza" value={capitalize(data.confianza)}/></div>
        {data.cultivar_id&&<p className="mt-4 flex items-center gap-2 rounded-lg bg-[#f7fbf8] p-3 text-xs"><Leaf className="h-4 w-4 text-[#087b4b]"/>Cultivar informado: <strong>{data.cultivar_id}</strong></p>}
      </article>
    </section>
    <section className="mt-4 flex gap-3 rounded-xl border border-[#b9dcc8] bg-[#f7fbf8] p-5"><Info className="h-5 w-5 shrink-0 text-[#087b4b]"/><p className="text-xs leading-5 text-[#405369]">Esta estimación ayuda a interpretar las condiciones actuales según el momento probable del cultivo. Todavía no modifica las señales ni reemplaza la observación a campo o la recomendación de un asesor agronómico.</p></section>
  </>;
}

function Fact({Icon,label,value}:{Icon:typeof MapPin;label:string;value:string}){return <div className="flex gap-3 rounded-xl border bg-white p-4"><Icon className="h-5 w-5 shrink-0 text-[#087b4b]"/><p className="text-xs text-[#526477]">{label}<strong className="mt-1 block text-[#081a31]">{value}</strong></p></div>}
function shortDate(value:string){return new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));}
function longDate(value:string){return new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));}
function capitalize(value:string){return value.charAt(0).toUpperCase()+value.slice(1)}
