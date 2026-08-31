import type { LucideIcon } from "lucide-react";
import { CloudRain, Droplets, Leaf, Snowflake } from "lucide-react";
import type { EstadoEvaluacionPlaga, ResultadoReglaV2 } from "@/types";
import { statusLabel } from "@/lib/results/presentation";
import { InfoMessage } from "@/components/ui/InfoMessage";

export const categoryIcons: Record<"heladas" | "enfermedades_foliares" | "estres_hidrico" | "exceso_hidrico", LucideIcon> = {
  heladas: Snowflake,
  enfermedades_foliares: Leaf,
  estres_hidrico: Droplets,
  exceso_hidrico: CloudRain,
};

export type Severity = "attention" | "monitor" | "calm" | "neutral";

/**
 * Espeja la misma convención de lectura que ya usa lib/rules/score-v2.ts para
 * componer el Estado General (favorables/condiciones_detectadas => atención,
 * moderadas/indeterminado => monitoreo). No reimplementa ni cambia esa lógica,
 * solo la reutiliza para elegir un color consistente por severidad real en vez
 * de un color fijo por categoría.
 */
const ATTENTION_STATES = new Set(["favorables", "condiciones_detectadas"]);
const MONITOR_STATES = new Set(["moderadas"]);

export function severityOf(rule?: ResultadoReglaV2): Severity {
  if (!rule) return "neutral";
  if (rule.estado === "indeterminado") return "neutral";
  if (ATTENTION_STATES.has(rule.estado)) return "attention";
  if (MONITOR_STATES.has(rule.estado)) return "monitor";
  return "calm";
}

const PEST_ATTENTION: EstadoEvaluacionPlaga[] = ["favorabilidad_alta", "periodo_relevante_monitoreo"];
const PEST_MONITOR: EstadoEvaluacionPlaga[] = ["favorabilidad_moderada"];
const PEST_NEUTRAL: EstadoEvaluacionPlaga[] = ["indeterminado", "no_evaluada"];

export function severityOfPest(estado: EstadoEvaluacionPlaga): Severity {
  if (PEST_NEUTRAL.includes(estado)) return "neutral";
  if (PEST_ATTENTION.includes(estado)) return "attention";
  if (PEST_MONITOR.includes(estado)) return "monitor";
  return "calm";
}

export const SEVERITY_TONES: Record<Severity, { text: string; chipBg: string; chipText: string; border: string }> = {
  attention: { text: "text-orange-600", chipBg: "bg-orange-50", chipText: "text-orange-600", border: "border-orange-200" },
  monitor: { text: "text-indigo-700", chipBg: "bg-indigo-50", chipText: "text-indigo-700", border: "border-indigo-200" },
  calm: { text: "text-[#087b4b]", chipBg: "bg-green-50", chipText: "text-[#087b4b]", border: "border-green-200" },
  neutral: { text: "text-slate-600", chipBg: "bg-slate-100", chipText: "text-slate-600", border: "border-slate-300" },
};

export function CategoryIconChip({ Icon, severity, size = "sm" }: { Icon: LucideIcon; severity: Severity; size?: "sm" | "lg" }) {
  const tone = SEVERITY_TONES[severity];
  const dim = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const iconDim = size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return <span className={`flex ${dim} shrink-0 items-center justify-center rounded-full ${tone.chipBg} ${tone.chipText}`}><Icon className={iconDim} aria-hidden="true" /></span>;
}

export function StatusLabelText({ rule, categoryName, className = "" }: { rule?: ResultadoReglaV2; categoryName?: string; className?: string }) {
  const tone = SEVERITY_TONES[severityOf(rule)];
  return <span className={`${tone.text} ${className}`}>{statusLabel(rule, categoryName)}</span>;
}

export function ResultScopeNote() {
  return <InfoMessage>Este resultado describe condiciones ambientales y no el estado sanitario del lote.</InfoMessage>;
}
