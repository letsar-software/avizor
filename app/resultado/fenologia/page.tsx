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
  const activeIndex = Math.max(0, data.hitos.findIndex(hito => hito.codigo === data.estadio_actual_estimado));
  return <div className="relative mt-3 space-y-2 lg:hidden">{data.hitos.map((hito, index) => {
    const active = hito.codigo === data.estadio_actual_estimado, critical = CRITICAL_STAGES.has(hito.codigo), open = expanded === hito.codigo;
    const completed = index <= activeIndex;
    return <article key={hito.codigo} className={`relative overflow-hidden rounded-xl border-2 ${active ? "border-[#70bd91] bg-[#f3fbf6]" : "border-[#e1e5e8] bg-white"}`}>
      <span data-mobile-track={completed ? "complete" : "future"} className={`absolute bottom-0 left-[105px] top-0 z-0 w-1 -translate-x-1/2 min-[375px]:left-[117px] ${completed ? "bg-[#54b47e]" : "bg-[#e1e5e8]"}`} aria-hidden="true" />
      <button type="button" onClick={() => setExpanded(open ? null : hito.codigo)} aria-expanded={open} className="relative z-10 grid min-h-[104px] w-full grid-cols-[58px_62px_minmax(0,1fr)_20px] items-center gap-1.5 px-2.5 py-2 text-left min-[375px]:grid-cols-[66px_62px_minmax(0,1fr)_24px] min-[375px]:gap-2 min-[375px]:px-3">
        <Image src={STAGE_IMAGES[hito.codigo]} alt="" width={64} height={70} className="mx-auto h-[62px] w-[58px] object-contain min-[375px]:h-[70px] min-[375px]:w-[64px]" />
        <span data-stage-marker={hito.codigo} className={`relative z-10 flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-[#2e8537] text-xl font-bold ${active ? "bg-[#087b4b] text-white" : "bg-white text-[#2e8537]"}`}>{hito.codigo}</span>
        <span className="min-w-0">{active && <span data-current-badge className="mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#2e8537] bg-white px-2.5 py-1.5 text-xs font-semibold leading-4 text-[#2e8537]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e8537]" aria-hidden="true" />Estado actual estimado</span>}<strong className="block text-sm leading-tight min-[375px]:text-base">{hito.nombre}</strong><span className="mt-1 flex flex-wrap gap-x-2 text-sm font-bold min-[375px]:text-base"><span>{shortDate(hito.fecha_estimada)}</span>{active && <span className="text-xs text-[#2e8537] min-[375px]:text-sm">± {data.margen_dias} días</span>}</span></span>
        <span data-stage-actions className="flex w-5 flex-col items-center gap-2 min-[375px]:w-6">{critical && !active && <CriticalIcon />}<ChevronDown className={`h-5 w-5 text-[#405369] transition-transform ${open ? "rotate-180" : ""}`} /></span>
      </button>
      {open && <div data-mobile-expanded-panel className={`relative z-10 grid min-h-[184px] grid-cols-[104px_1fr] border-t min-[375px]:grid-cols-[116px_1fr] ${active ? "border-[#e0f0e6] bg-[#f3fbf6]" : "border-[#eef0f2] bg-white"}`}><span data-mobile-expanded-track={completed ? "complete" : "future"} className={`absolute bottom-0 left-[105px] top-0 w-1 -translate-x-1/2 min-[375px]:left-[117px] ${completed ? "bg-[#54b47e]" : "bg-[#e1e5e8]"}`} aria-hidden="true" /><div className="relative z-10 flex items-center justify-center">{critical && <span className="flex -rotate-90 items-center gap-2 whitespace-nowrap text-sm font-bold text-[#eb5505]"><CriticalIcon /> Período crítico</span>}</div><div className="relative z-10 flex flex-col items-center justify-center px-3 py-2 text-center"><Image src={STAGE_IMAGES[hito.codigo]} alt={`Ilustración de ${hito.nombre}`} width={112} height={112} className="h-28 w-full object-contain" /><span className="text-sm text-[#526477]">Fecha estimada</span><strong className="mt-0.5 text-base">{shortDate(hito.fecha_estimada)}</strong></div></div>}
    </article>;
  })}</div>;
}

function DesktopTimeline({ data }: { data: FenologiaEstimada }) {
  const count = data.hitos.length;
  const activeIndex = Math.max(0, data.hitos.findIndex(hito => hito.codigo === data.estadio_actual_estimado));
  const criticalIndices = data.hitos.map((hito, index) => CRITICAL_STAGES.has(hito.codigo) ? index : -1).filter(index => index >= 0);
  const criticalStart = criticalIndices[0], criticalEnd = criticalIndices.at(-1);
  const trackInset = 100 / (count * 2), progress = count > 1 ? (activeIndex / (count - 1)) * 100 : 0;
  const criticalCenter = criticalStart !== undefined && criticalEnd !== undefined ? ((criticalStart + criticalEnd + 1) / 2 / count) * 100 : 0;
  return <article className="mt-4 hidden rounded-2xl border bg-white p-6 lg:block"><h2 className="text-lg font-bold">Línea de tiempo fenológica <span className="font-normal text-[#526477]">(fechas estimadas)</span></h2><div className="relative mt-8 grid min-h-[506px] items-end pb-4" style={{gridTemplateColumns:`repeat(${count}, minmax(0, 1fr))`}}>
    <div data-desktop-track className="absolute top-[282px] h-2 bg-[#e1e5e8]" style={{left:`${trackInset}%`,right:`${trackInset}%`}} aria-hidden="true"><span data-desktop-progress className="block h-full bg-[#54b47e]" style={{width:`${progress}%`}} /></div>
    {criticalStart !== undefined && criticalEnd !== undefined && <><div data-critical-period className="pointer-events-none relative z-[5] row-start-1 mt-8 h-[278px] self-start rounded-2xl border-2 border-[#eb5505]" style={{gridColumn:`${criticalStart + 1} / ${criticalEnd + 2}`}} /><span data-critical-label className="pointer-events-none absolute top-[304px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[#eb5505] bg-white px-4 py-1 text-sm font-bold" style={{left:`${criticalCenter}%`}}><span className="text-[#eb5505]">ⓘ</span> Período crítico</span></>}
    {data.hitos.map((hito, index) => <DesktopStage key={hito.codigo} hito={hito} active={hito.codigo === data.estadio_actual_estimado} margin={data.margen_dias} index={index} />)}
  </div></article>;
}

function DesktopStage({ hito, active, margin, index }: { hito: HitoFenologico; active: boolean; margin: number; index: number }) {
  return <div data-desktop-stage={hito.codigo} className={`relative row-start-1 z-10 h-[486px] min-w-0 px-3 text-center ${active ? "z-20 rounded-2xl border-2 border-[#70bd91] bg-[#edfaf2] shadow-sm" : ""}`} style={{gridColumn:index + 1}}>
    {active && <span className="absolute left-1/2 top-3 max-w-[calc(100%-16px)] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2e8537] px-3 py-2 text-xs font-bold text-white xl:px-4 xl:text-sm">Estado actual estimado</span>}{active && <strong className="absolute left-1/2 top-[58px] -translate-x-1/2 text-4xl text-[#087b4b] xl:text-5xl">{hito.codigo}</strong>}
    <Image src={STAGE_IMAGES[hito.codigo]} alt={`Ilustración de ${hito.nombre}`} width={150} height={150} className="absolute left-1/2 top-[112px] h-[150px] w-[calc(100%-24px)] -translate-x-1/2 object-contain" />
    <span className={`absolute left-1/2 top-[276px] z-20 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] ${active ? "border-[#b9dcc8] bg-[#087b4b]" : "border-[#e1e5e8] bg-white"}`} />
    <div className="absolute inset-x-2 top-[342px] flex flex-col items-center">{active ? <strong className="text-sm text-[#176d35]">{hito.nombre}</strong> : <><strong className="text-sm">{hito.codigo}</strong><span className="mt-2 min-h-10 text-sm leading-5 text-[#526477]">{hito.nombre}</span></>}<span className="mt-2 text-sm text-[#526477]">{active ? "Fecha estimada" : null}</span><strong data-stage-date={hito.codigo} className="mt-1 text-base">{shortDate(hito.fecha_estimada)}</strong>{active && <><span className="mt-2 text-sm text-[#526477]">Margen estimado</span><strong data-active-margin className="mt-1 text-sm">± {margin} días</strong></>}</div>
  </div>;
}

function Facts({ data }: { data: FenologiaEstimada }) { return <section className="mt-8"><h2 className="text-xl font-bold">Datos utilizados para la estimación</h2><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Fact Icon={CalendarDays} label="Fecha de siembra" value={longDate(data.fecha_siembra)} /><Fact Icon={Sprout} label="Grupo de madurez" value={data.grupo_madurez} /><Fact Icon={Clock3} label="Modelo utilizado" value="Calendario por grupo de madurez" /><Fact Icon={CheckCircle2} label="Nivel de confianza" value={capitalize(data.confianza)} /></div></section>; }
function Fact({ Icon, label, value }: { Icon: typeof CalendarDays; label: string; value: string }) { return <div className="flex min-h-[96px] gap-3 rounded-xl border bg-white p-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-[#087b4b]" /><p className="text-sm leading-5 text-[#526477]">{label}<strong className="mt-1 block text-sm leading-5 text-[#081a31]">{value}</strong></p></div>; }
function CriticalIcon() { return <span aria-label="Período crítico" className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#eb5505] text-sm font-bold text-[#eb5505]">!</span>; }
function shortDate(value: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function longDate(value: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
