import React from "react";
import { Bug, CheckCircle2, CircleHelp, Eye, MapPin, Sprout, TriangleAlert } from "lucide-react";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import type { EvaluacionPlaga, ResultadoConsultaV2Publica } from "@/types";
import { SEVERITY_TONES, severityOfPest } from "@/components/results/shared";

const pestNames: Record<string, string> = { trips: "Trips", aranuela: "Arañuela", orugas_defoliadoras: "Orugas defoliadoras", bolillera_spodoptera: "Bolillera / Spodoptera", chinches: "Chinches" };
const stateLabels: Record<EvaluacionPlaga["estado"], string> = { favorabilidad_alta: "Favorabilidad ambiental alta", favorabilidad_moderada: "Favorabilidad ambiental moderada", sin_condiciones_destacadas: "Sin condiciones destacadas", periodo_relevante_monitoreo: "Período relevante para monitoreo", indeterminado: "No fue posible completar la evaluación", no_evaluada: "No evaluada" };

export function visiblePestEvaluations(result?: ResultadoConsultaV2Publica | null) { return result?.plagas?.evaluaciones.filter((evaluation) => evaluation.estado !== "no_evaluada") ?? []; }
export function pestStateLabel(state: EvaluacionPlaga["estado"]) { return stateLabels[state]; }
export function pestName(group: string) { return pestNames[group] ?? group.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

const FAVORABILIDAD_LEVEL_WORDS: Partial<Record<EvaluacionPlaga["estado"], string>> = { favorabilidad_alta: "alta", favorabilidad_moderada: "moderada" };

/**
 * Compone el texto de estado combinando el mapa genérico (que conserva el nivel
 * alta/moderada) con evaluation.textos.estado (que en la base ya nombra la plaga),
 * sin inventar contenido: solo reutiliza fragmentos que la propia base entrega.
 * - favorabilidad_alta/moderada: si textos.estado sigue el patrón "Favorabilidad
 *   ambiental para X" (P-01/P-02), inserta el nivel: "Favorabilidad ambiental alta para X".
 * - otros estados (ej. período relevante para monitoreo): si textos.estado ya
 *   extiende el label genérico (mismo inicio), se usa tal cual porque ya nombra la plaga.
 * - si nada de esto aplica, se conserva el label genérico actual (sin inventar).
 */
export function contextualPestStateLabel(evaluation: EvaluacionPlaga): string {
  const generic = pestStateLabel(evaluation.estado);
  const textoEstado = evaluation.textos.estado?.trim();
  const phenomenon = pestName(evaluation.grupo).toLowerCase();
  if (!textoEstado) return FAVORABILIDAD_LEVEL_WORDS[evaluation.estado] ? `${generic} para ${phenomenon}` : generic;

  const levelWord = FAVORABILIDAD_LEVEL_WORDS[evaluation.estado];
  if (levelWord) {
    const match = /^Favorabilidad ambiental (para .+)$/i.exec(textoEstado);
    return match ? `Favorabilidad ambiental ${levelWord} ${match[1]}` : `${generic} para ${phenomenon}`;
  }

  return textoEstado.toLowerCase().startsWith(generic.toLowerCase()) ? textoEstado : generic;
}

const SEVERITY_RANK: Record<ReturnType<typeof severityOfPest>, number> = { attention: 3, monitor: 2, calm: 1, neutral: 0 };
function worstSeverity(evaluations: EvaluacionPlaga[]) { return evaluations.map((item) => severityOfPest(item.estado)).sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a])[0] ?? "neutral"; }

export function PestSummaryCard({ result }: { result: ResultadoConsultaV2Publica }) {
  const evaluations = visiblePestEvaluations(result); if (!evaluations.length) return null;
  const summary = evaluations.length === 1 ? contextualPestStateLabel(evaluations[0]) : `${evaluations.length} evaluaciones disponibles`;
  const tone = SEVERITY_TONES[worstSeverity(evaluations)];
  return <Link href="/resultado/plagas" className="flex min-h-[76px] items-center gap-3 rounded-xl border bg-white p-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.chipBg} ${tone.chipText}`}><Bug className="h-5 w-5" aria-hidden="true"/></span><span className="min-w-0 flex-1"><strong className="text-sm">Plagas</strong><span className={`mt-1 block text-sm font-semibold ${tone.text}`}>{summary}</span></span><span aria-hidden="true" className="text-lg text-[#526477]">›</span></Link>;
}

export function PestResults({ result, compact = false }: { result: ResultadoConsultaV2Publica; compact?: boolean }) {
  const evaluations = visiblePestEvaluations(result); if (!evaluations.length) return compact ? <EmptyCompactPestResults available={Boolean(result.plagas)}/> : null;
  if (compact) return <CompactPestResults evaluations={evaluations}/>;
  return <section aria-labelledby="pest-results-title" className={compact ? "mt-4" : "mt-3"}><div className="mb-3 flex items-center gap-2"><Bug className="h-5 w-5 text-amber-700" aria-hidden="true"/><h2 id="pest-results-title" className="text-base font-bold">Plagas</h2></div><div className="grid gap-3 lg:grid-cols-2">{evaluations.map((evaluation) => <PestEvaluation key={`${evaluation.regla}-${evaluation.version}-${evaluation.grupo}`} evaluation={evaluation}/>)}</div></section>;
}

function EmptyCompactPestResults({available}:{available:boolean}) {
  return <section aria-labelledby="pest-summary-title" className="mt-5"><h2 id="pest-summary-title" className="text-xl font-bold">Plagas monitoreadas</h2><div className="mt-3 flex min-h-[96px] items-center gap-3 rounded-xl border bg-white p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Bug className="h-5 w-5" aria-hidden="true"/></span><div><h3 className="text-sm font-bold">Información de plagas</h3><p className="mt-1 text-sm leading-6 text-[#526477]">{available?"No fue posible completar evaluaciones de plagas para esta consulta.":"La evaluación de plagas no está disponible para esta consulta."}</p></div></div></section>;
}

function CompactPestResults({evaluations}:{evaluations:EvaluacionPlaga[]}) {
  const attention=evaluations.filter(item=>item.estado==="favorabilidad_alta").length;
  const monitor=evaluations.filter(item=>item.estado==="favorabilidad_moderada"||item.estado==="periodo_relevante_monitoreo").length;
  const calm=evaluations.filter(item=>item.estado==="sin_condiciones_destacadas").length;
  return <section aria-labelledby="pest-summary-title" className="mt-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="pest-summary-title" className="text-xl font-bold">Plagas monitoreadas</h2><Link href="/resultado/plagas" className="hidden min-h-10 items-center rounded-lg border border-[#178a51] px-4 text-sm font-bold text-[#087b4b] sm:inline-flex">Ver detalle de plagas</Link></div><div className="overflow-hidden rounded-xl border bg-white"><div className="grid grid-cols-3 divide-x border-b text-center text-xs font-bold sm:text-sm"><PestCount Icon={TriangleAlert} count={attention} label="requieren atención" tone="text-red-600"/><PestCount Icon={CircleHelp} count={monitor} label="en período de monitoreo" tone="text-orange-600"/><PestCount Icon={CheckCircle2} count={calm} label="sin condiciones destacadas" tone="text-[#087b4b]"/></div><div className="grid gap-px bg-[#dfe6e2] sm:grid-cols-2 lg:grid-cols-4">{evaluations.map(item=><CompactPestCard key={`${item.regla}-${item.version}-${item.grupo}`} evaluation={item}/>)}</div><Link href="/resultado/plagas" className="m-3 flex min-h-11 items-center justify-center rounded-lg border border-[#178a51] text-sm font-bold text-[#087b4b] sm:hidden">Ver detalle de plagas</Link></div></section>;
}

function PestCount({Icon,count,label,tone}:{Icon:typeof Bug;count:number;label:string;tone:string}) { return <div className={`flex min-h-[68px] items-center justify-center gap-2 px-2 ${tone}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true"/><span><strong className="mr-1 text-base">{count}</strong>{label}</span></div>; }
function CompactPestCard({evaluation}:{evaluation:EvaluacionPlaga}) { const severity=severityOfPest(evaluation.estado);const tone=SEVERITY_TONES[severity];return <Link href="/resultado/plagas" className="flex min-h-[154px] flex-col bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087b4b]"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f8f5]"><Bug className="h-5 w-5" aria-hidden="true"/></span><div className="min-w-0"><h3 className="font-bold">{pestName(evaluation.grupo)}</h3>{evaluation.especies.length?<p className="mt-0.5 truncate text-xs italic text-[#526477]">{evaluation.especies.map(value=>value.replaceAll("_"," ")).join(", ")}</p>:null}</div></div><p className={`mt-3 text-sm font-bold leading-5 ${tone.text}`}>{contextualPestStateLabel(evaluation)}</p><span className={`mt-auto self-start rounded-full px-3 py-1 text-xs font-bold ${tone.chipBg} ${tone.chipText}`}>{compactPestBadge(evaluation.estado)}</span></Link>; }
function compactPestBadge(state:EvaluacionPlaga["estado"]) { if(state==="favorabilidad_alta")return "Alta";if(state==="favorabilidad_moderada")return "Moderada";if(state==="periodo_relevante_monitoreo")return "Monitoreo";if(state==="sin_condiciones_destacadas")return "Sin condiciones";return "Información limitada"; }

function PestEvaluation({ evaluation }: { evaluation: EvaluacionPlaga }) {
  const severity = severityOfPest(evaluation.estado);
  const informational = severity === "neutral";
  const tone = SEVERITY_TONES[severity];
  return <article className={`min-w-0 rounded-xl border bg-white p-5 ${tone.border}`}><div className="flex min-w-0 items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.chipBg} ${tone.chipText}`}>{informational ? <CircleHelp className="h-5 w-5" aria-hidden="true"/> : <Bug className="h-5 w-5" aria-hidden="true"/>}</span><div className="min-w-0"><h3 className="font-bold">{pestName(evaluation.grupo)}</h3><p className={`mt-1 text-sm font-bold ${tone.text}`}>{contextualPestStateLabel(evaluation)}</p></div></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-[#526477]"><span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true"/>Zona: {evaluation.zona.replaceAll("_", " ")}</span>{evaluation.fenologia?.tipo === "estimada" ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1"><Sprout className="h-3.5 w-3.5" aria-hidden="true"/>Etapa estimada: {evaluation.fenologia.estado}</span> : null}</div>{evaluation.textos.por_que_se_muestra ? <Block title="¿Por qué te mostramos esto?" text={evaluation.textos.por_que_se_muestra}/> : null}{evaluation.textos.que_significa ? <Block title="Qué significa" text={evaluation.textos.que_significa}/> : null}{evaluation.textos.que_observar ? <Block title="Qué observar" text={evaluation.textos.que_observar} icon/> : null}{evaluation.textos.seguimiento ? <Block title="Seguimiento" text={evaluation.textos.seguimiento}/> : null}{evaluation.motivo && informational ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-[#526477]">Motivo: {evaluation.motivo.replaceAll("_", " ")}</p> : null}<div className="mt-4"><Accordion id={`pest-evidence-${evaluation.regla}-${evaluation.grupo}`} title="Ver evidencia técnica" summary={`${evaluation.regla} · versión ${evaluation.version}`}><p>{evaluation.textos.evidencia_tecnica}</p><dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><Fact label="Tipo de regla" value={evaluation.tipo_regla.replaceAll("_", " ")}/><Fact label="Evidencia climática" value={evaluation.nivel_evidencia_climatica}/><Fact label="Calidad del dato" value={evaluation.calidad_dato}/><Fact label="Prioridad regional" value={evaluation.prioridad_regional.replaceAll("_", " ")}/></dl>{Object.keys(evaluation.indicadores).length ? <ul className="mt-3 space-y-1 text-xs">{Object.entries(evaluation.indicadores).map(([key, value]) => <li key={key} className="break-words">{key.replaceAll("_", " ")}: <strong>{value}</strong></li>)}</ul> : null}</Accordion></div></article>;
}
function Block({ title, text, icon = false }: { title: string; text: string; icon?: boolean }) { return <section className="mt-4"><h4 className="flex items-center gap-1.5 text-sm font-bold">{icon ? <Eye className="h-4 w-4 text-[#087b4b]" aria-hidden="true"/> : null}{title}</h4><p className="mt-1 break-words text-sm leading-6 text-[#405369]">{text}</p></section>; }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-[#526477]">{label}</dt><dd className="font-semibold capitalize">{value}</dd></div>; }
