"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Clock3, Sprout } from "lucide-react";
import type { FenologiaEstimada, HitoFenologico } from "@/types";
import { InfoMessage } from "@/components/ui/InfoMessage";

const STAGE_IMAGES: Record<string, string> = { E: "/phenology/soja-e.svg", R1: "/phenology/soja-r1.svg", R3: "/phenology/soja-r3.svg", R5: "/phenology/soja-r5.svg", R7: "/phenology/soja-r7.svg" };
const CRITICAL_STAGES = new Set(["R3", "R5"]);

export default function PhenologyDetailPage() {
  const [data, setData] = useState<FenologiaEstimada | null>(null);
  useEffect(() => { const stored = sessionStorage.getItem("avizor_resultado"); if (stored) { const parsed = JSON.parse(stored); setData(parsed.contexto_fenologico?.detalle ?? parsed.fenologia ?? null); } }, []);
  return <main className="mx-auto w-full max-w-[1280px] px-5 py-7 text-[#081a31] sm:px-8 sm:py-10">
    <Link href="/resultado" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#087b4b]"><ArrowLeft className="h-4 w-4" /> Volver al resultado</Link>
    {!data ? <EmptyState /> : <PhenologyDetail data={data} />}
  </main>;
}

function EmptyState() { return <section className="mt-5 rounded-2xl border bg-white p-6 text-center"><Sprout className="mx-auto h-12 w-12 text-[#087b4b]" /><h1 className="mt-4 text-2xl font-bold">Completá los datos del cultivo</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#405369]">Necesitamos la fecha de siembra y el grupo de madurez para generar una estimación fenológica.</p><Link href="/consultar" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#087b4b] px-5 text-sm font-bold text-white">Completar datos</Link></section>; }

function PhenologyDetail({ data }: { data: FenologiaEstimada }) {
  return <>
    <header className="mt-5"><p className="text-sm font-bold uppercase tracking-[.1em] text-[#087b4b]">Contexto del cultivo</p><h1 className="mt-2 max-w-3xl text-[36px] font-bold leading-tight sm:text-[32px]">Fenología estimada del cultivo</h1><p className="mt-3 max-w-5xl text-base leading-7 text-[#405369]">La estimación ubica el cultivo en una etapa probable a partir de los datos ingresados. No confirma el estado observado en el lote.</p></header>
    <section className="mt-7"><div className="flex justify-end"><TodayBadge /></div><h2 className="mt-8 text-xl font-bold lg:hidden">Línea de tiempo fenológica</h2><MobileTimeline data={data} /><DesktopTimeline data={data} /></section>
    <Facts data={data} />
    <section className="mt-8"><InfoMessage>Esta estimación ayuda a interpretar las condiciones actuales según el momento probable del cultivo. Todavía no modifica las señales ni reemplaza la observación a campo o la recomendación de un asesor agronómico.</InfoMessage></section>
  </>;
}

function TodayBadge() { const today = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()); return <span className="rounded-full border border-[#9da9b5] bg-white px-4 py-2 text-sm text-[#405369]">Hoy · {today}</span>; }

function MobileTimeline({ data }: { data: FenologiaEstimada }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="relative mt-3 space-y-2 lg:hidden"><div className="absolute bottom-6 left-[117px] top-6 w-1 bg-[#e1e5e8]" aria-hidden="true" />{data.hitos.map(hito => {
    const active = hito.codigo === data.estadio_actual_estimado, critical = CRITICAL_STAGES.has(hito.codigo), open = expanded === hito.codigo;
    return <article key={hito.codigo} className={`relative overflow-hidden rounded-xl border-2 ${active ? "border-[#70bd91] bg-[#f3fbf6]" : "border-[#e1e5e8] bg-white"}`}>
      <button type="button" onClick={() => setExpanded(open ? null : hito.codigo)} aria-expanded={open} className="relative z-10 grid min-h-[86px] w-full grid-cols-[66px_62px_1fr_24px] items-center gap-2 px-3 text-left">
        <Image src={STAGE_IMAGES[hito.codigo]} alt="" width={64} height={70} className="mx-auto h-[70px] w-[64px] object-contain" />
        <span className={`flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-[#2e8537] text-xl font-bold ${active ? "bg-[#087b4b] text-white" : "bg-white text-[#2e8537]"}`}>{hito.codigo}</span>
        <span className="min-w-0">{active && <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#2e8537] bg-white px-2.5 py-1 text-xs font-semibold text-[#2e8537]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e8537]" aria-hidden="true" />Estado actual estimado</span>}<strong className="block text-base leading-[1.05]">{hito.nombre}</strong><span className="mt-1 flex items-center justify-between text-base font-bold"><span>{shortDate(hito.fecha_estimada)}</span>{active && <span className="text-sm text-[#2e8537]">± {data.margen_dias} días</span>}</span></span>
        <span className="flex flex-col items-center gap-2">{critical && !active && <CriticalIcon />}<ChevronDown className={`h-5 w-5 text-[#405369] transition-transform ${open ? "rotate-180" : ""}`} /></span>
      </button>
      {open && <div className={`relative z-10 grid min-h-[300px] grid-cols-[106px_1fr] border-t ${active ? "border-[#e0f0e6] bg-[#f3fbf6]" : "border-[#eef0f2] bg-white"}`}><div className="flex items-center justify-center border-r-[10px] border-[#e1e5e8]">{critical && <span className="flex -rotate-90 items-center gap-2 whitespace-nowrap text-lg font-bold text-[#eb5505]"><CriticalIcon /> Período crítico</span>}</div><div className="flex flex-col items-center justify-center p-5 text-center"><Image src={STAGE_IMAGES[hito.codigo]} alt={`Ilustración de ${hito.nombre}`} width={176} height={176} className="h-44 w-full object-contain" /><span className="mt-2 text-xl text-[#526477]">Fecha estimada</span><strong className="mt-1 text-xl">{shortDate(hito.fecha_estimada)}</strong></div></div>}
    </article>;
  })}</div>;
}

function DesktopTimeline({ data }: { data: FenologiaEstimada }) {
  return <article className="mt-4 hidden rounded-2xl border bg-white p-6 lg:block"><h2 className="text-lg font-bold">Línea de tiempo fenológica <span className="font-normal text-[#526477]">(fechas estimadas)</span></h2><div className="relative mt-10 grid min-h-[430px] items-end px-4 pb-5" style={{gridTemplateColumns:`repeat(${data.hitos.length}, minmax(0, 1fr))`}}>
    <div className="absolute left-[8%] right-[8%] top-[265px] h-2 bg-[#e1e5e8]" /><div className="absolute left-[8%] top-[265px] h-2 w-[62%] bg-[#54b47e]" /><div className="absolute bottom-12 left-[38%] top-3 w-[42%] rounded-2xl border-2 border-[#eb5505]"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[#eb5505] bg-white px-4 py-1 text-sm font-bold"><span className="text-[#eb5505]">ⓘ</span> Período crítico</span></div>
    {data.hitos.map(hito => <DesktopStage key={hito.codigo} hito={hito} active={hito.codigo === data.estadio_actual_estimado} margin={data.margen_dias} />)}
  </div></article>;
}

function DesktopStage({ hito, active, margin }: { hito: HitoFenologico; active: boolean; margin: number }) {
  return <div className={`relative z-10 flex h-[410px] flex-col items-center justify-end px-3 text-center ${active ? "rounded-2xl border-2 border-[#70bd91] bg-[#edfaf2]" : ""}`}>
    {active && <span className="absolute top-2 rounded-full bg-[#2e8537] px-4 py-2 text-sm font-bold text-white">Estado actual estimado</span>}{active && <strong className="absolute top-14 text-5xl text-[#087b4b]">{hito.codigo}</strong>}
    <Image src={STAGE_IMAGES[hito.codigo]} alt={`Ilustración de ${hito.nombre}`} width={170} height={170} className="mb-1 h-[170px] w-full object-contain" />{active && <strong className="mb-3 text-sm text-[#176d35]">{hito.nombre}</strong>}<span className={`h-5 w-5 rounded-full border-[3px] ${active ? "border-[#b9dcc8] bg-[#087b4b]" : "border-[#e1e5e8] bg-white"}`} />
    {!active && <strong className="mt-5 text-sm">{hito.codigo}</strong>}{!active && <span className="mt-2 min-h-10 text-sm leading-5 text-[#526477]">{hito.nombre}</span>}<span className="mt-3 text-sm text-[#526477]">{active ? "Fecha estimada" : null}</span><strong className="mt-1 text-base">{shortDate(hito.fecha_estimada)}</strong>{active && <><span className="mt-2 text-sm text-[#526477]">Margen estimado</span><strong className="mt-1 text-sm">± {margin} días</strong></>}
  </div>;
}

function Facts({ data }: { data: FenologiaEstimada }) { return <section className="mt-8"><h2 className="text-xl font-bold">Datos utilizados para la estimación</h2><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Fact Icon={CalendarDays} label="Fecha de siembra" value={longDate(data.fecha_siembra)} /><Fact Icon={Sprout} label="Grupo de madurez" value={data.grupo_madurez} /><Fact Icon={Clock3} label="Modelo utilizado" value="Calendario por grupo de madurez" /><Fact Icon={CheckCircle2} label="Nivel de confianza" value={capitalize(data.confianza)} /></div></section>; }
function Fact({ Icon, label, value }: { Icon: typeof CalendarDays; label: string; value: string }) { return <div className="flex min-h-[96px] gap-3 rounded-xl border bg-white p-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-[#087b4b]" /><p className="text-sm leading-5 text-[#526477]">{label}<strong className="mt-1 block text-sm leading-5 text-[#081a31]">{value}</strong></p></div>; }
function CriticalIcon() { return <span aria-label="Período crítico" className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#eb5505] text-sm font-bold text-[#eb5505]">!</span>; }
function shortDate(value: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function longDate(value: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
