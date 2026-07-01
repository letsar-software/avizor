"use client";

import { useEffect, useState } from "react";
import type { ResultadoConsulta } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bug,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  Download,
  Droplets,
  Heart,
  Info,
  Leaf,
  Link as LinkIcon,
  Mail,
  Map,
  MapPin,
  Meh,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Snowflake,
  Sprout,
  Thermometer,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Wind,
} from "lucide-react";

type View = "resumen" | "atencion" | "monitoreo" | "recomendaciones";
type StoredConsulta = { localidad?: string; cultivo?: string; fechaSiembra?: string };
type Tone = "red" | "blue" | "green" | "amber" | "purple" | "sky";

const climateMetrics = [
  { icon: Droplets, label: "Humedad media", value: "82%", color: "#5d7897", chart: "line" as const },
  { icon: Droplets, label: "Lluvias últimos 5 días", value: "42 mm", color: "#2f80ed", chart: "bars" as const },
  { icon: Thermometer, label: "Temperatura media", value: "22 °C", color: "#8a5bd6", chart: "line" as const },
  { icon: Wind, label: "Viento medio", value: "12 km/h", color: "#4f8c45", chart: "line" as const },
  { icon: CalendarDays, label: "Días con lluvia (acum.)", value: "3 días", color: "#4f8c45", chart: "line" as const },
];

function formatMetric(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sin dato";
  return `${value}${suffix}`;
}

function getClimateMetrics(resultado?: ResultadoConsulta | null) {
  const resumen = resultado?.clima_resumen;

  if (!resumen) return climateMetrics;

  return [
    { icon: Droplets, label: "Humedad media", value: formatMetric(resumen.humedad_media_14d, "%"), color: "#5d7897", chart: "line" as const },
    { icon: Droplets, label: "Lluvias últimos 5 días", value: formatMetric(resumen.lluvia_5d_mm, " mm"), color: "#2f80ed", chart: "bars" as const },
    { icon: Thermometer, label: "Temperatura media", value: formatMetric(resumen.temp_media_14d, " °C"), color: "#8a5bd6", chart: "line" as const },
    { icon: Wind, label: "Viento medio", value: formatMetric(resumen.viento_medio_14d_kmh, " km/h"), color: "#4f8c45", chart: "line" as const },
    { icon: CalendarDays, label: "Días con lluvia (acum.)", value: `${resumen.dias_lluvia_14d} días`, color: "#4f8c45", chart: "line" as const },
  ];
}
const watchItems = [
  { icon: Bug, title: "Plagas clave", status: "Condiciones desfavorables", tone: "green" as Tone },
  { icon: Sprout, title: "Enfermedades de tallo", status: "Condiciones moderadas", tone: "purple" as Tone },
  { icon: Snowflake, title: "Heladas", status: "Condiciones desfavorables", tone: "sky" as Tone },
];

const detailRows = [
  { icon: Leaf, title: "Enfermedades foliares", text: "Condiciones actuales que pueden favorecer enfermedades foliares.", status: "Condiciones moderadas", tone: "red" as Tone },
  { icon: Droplets, title: "Estrés hídrico", text: "Días con alta demanda evaporativa en la última semana.", status: "Condiciones moderadas", tone: "blue" as Tone },
];

function ToneIcon({ icon: Icon, tone }: { icon: typeof Leaf; tone: Tone }) {
  const styles: Record<Tone, string> = {
    red: "bg-[#fff0f0] text-[#d61f2a]",
    blue: "bg-[#eaf2ff] text-[#2d69d8]",
    green: "bg-[#e8f6ed] text-[#0d7c36]",
    amber: "bg-[#fff1d1] text-[#d99000]",
    purple: "bg-[#f3eaff] text-[#8257d9]",
    sky: "bg-[#eaf5ff] text-[#2682d9]",
  };

  return (
    <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${styles[tone]}`}>
      <Icon className="h-8 w-8" strokeWidth={2} />
    </span>
  );
}

function StatusPill({ children, tone = "amber" }: { children: string; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    red: "border-[#f2b1aa] bg-[#ffe9e7] text-[#c51f1f]",
    blue: "border-[#b9d2ff] bg-[#eaf2ff] text-[#2d69d8]",
    green: "border-[#b9dfc4] bg-[#e8f6ed] text-[#116c35]",
    amber: "border-[#efc66f] bg-[#fff0ce] text-[#b86600]",
    purple: "border-[#d7c3ff] bg-[#f3eaff] text-[#8257d9]",
    sky: "border-[#c4ddff] bg-[#eaf5ff] text-[#2682d9]",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[13px] font-semibold ${styles[tone]}`}>{children}</span>;
}

function Sparkline({ color = "#2f8f4e", bars = false }: { color?: string; bars?: boolean }) {
  if (bars) {
    const heights = [16, 30, 44, 24, 56, 18, 38, 28, 16, 8];
    return (
      <svg viewBox="0 0 150 58" className="h-12 w-full">
        {heights.map((height, i) => (
          <rect key={i} x={8 + i * 14} y={56 - height} width="8" height={height} rx="1.5" fill={color} opacity={i > 7 ? 0.55 : 0.95} />
        ))}
      </svg>
    );
  }

  const points = "0,42 16,35 31,31 47,24 63,19 78,27 94,14 110,33 127,21 144,25";
  return (
    <svg viewBox="0 0 150 58" className="h-12 w-full">
      <path d="M0 58 L0 42 L16 35 L31 31 L47 24 L63 19 L78 27 L94 14 L110 33 L127 21 L144 25 L150 58 Z" fill={color} opacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      {points.split(" ").map((point) => {
        const [x, y] = point.split(",");
        return <circle key={point} cx={x} cy={y} r="2" fill="white" stroke={color} strokeWidth="1.5" />;
      })}
    </svg>
  );
}

function QuerySummary({ consulta, resultado }: { consulta?: StoredConsulta | null; resultado?: ResultadoConsulta | null }) {
  const localidad = resultado?.localidad
    ? `${resultado.localidad.nombre}, ${resultado.localidad.provincia}`
    : consulta?.localidad ?? "Tandil, Buenos Aires";
  const cultivo = consulta?.cultivo ? consulta.cultivo.charAt(0).toUpperCase() + consulta.cultivo.slice(1) : "Soja";
  const fechaSiembra = consulta?.fechaSiembra || "Sin fecha de siembra";

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-lg border border-[#d8e3dd] bg-white px-6 py-4 text-[15px] text-[#0b2138] shadow-sm">
      <span className="inline-flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-avizor-green" /> {localidad}</span>
      <span className="text-[#8b9aa7]">•</span>
      <span className="inline-flex items-center gap-2 font-semibold"><Sprout className="h-5 w-5 text-avizor-green" /> {cultivo}</span>
      <span className="text-[#8b9aa7]">•</span>
      <span className="inline-flex items-center gap-2"><CalendarDays className="h-5 w-5 text-avizor-green" /> Fecha de siembra: <strong>{fechaSiembra}</strong> <span className="text-[#66768a]">(opcional)</span></span>
    </div>
  );
}
function SectionButton({ tone, onClick }: { tone: "red" | "blue" | "green"; onClick: () => void }) {
  const styles = {
    red: "border-[#f0b2b2] text-[#c51f1f] hover:bg-[#fff4f4]",
    blue: "border-[#9fc0ff] text-[#1f61d6] hover:bg-[#f4f8ff]",
    green: "border-[#9ccdad] text-[#087238] hover:bg-[#f4fbf6]",
  };
  return (
    <button onClick={onClick} className={`mt-auto flex h-14 w-full items-center justify-center gap-3 rounded-lg border bg-white text-[16px] font-semibold transition ${styles[tone]}`}>
      Ver detalle <ArrowRight className="h-5 w-5" />
    </button>
  );
}

function SummaryCards({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="mt-10 grid gap-7 lg:grid-cols-3">
      <article className="flex min-h-[650px] flex-col rounded-xl border border-[#f0c6c6] bg-[linear-gradient(135deg,#fff7f7,#ffffff)] p-7 shadow-sm">
        <div className="flex items-center gap-5">
          <ToneIcon icon={Bell} tone="red" />
          <div>
            <h2 className="text-[22px] font-bold uppercase text-[#c51f1f] xl:text-[24px]">Atención</h2>
            <p className="mt-1 text-[16px] text-[#0b2138]">2 situaciones activas</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-[#f0c6c6] bg-[#fff8f8] p-6">
          <h3 className="text-[22px] font-bold text-[#c51f1f]">Atención recomendada</h3>
          <p className="mt-4 text-[18px] leading-relaxed">Las condiciones actuales pueden favorecer enfermedades foliares y estrés hídrico.</p>
        </div>

        <h3 className="mt-8 text-[18px] font-bold">Principales atenciones</h3>
        <div className="mt-5 space-y-6">
          {detailRows.map((item) => (
            <div key={item.title} className="flex items-center gap-5">
              <ToneIcon icon={item.icon} tone={item.tone} />
              <div>
                <p className="text-[17px] font-bold">{item.title}</p>
                <StatusPill tone="amber">Condiciones moderadas</StatusPill>
              </div>
            </div>
          ))}
        </div>

        <SectionButton tone="red" onClick={() => setView("atencion")} />
      </article>

      <article className="flex min-h-[650px] flex-col rounded-xl border border-[#c9dbff] bg-[linear-gradient(135deg,#f8fbff,#ffffff)] p-7 shadow-sm">
        <div className="flex items-center gap-5">
          <ToneIcon icon={TrendingUp} tone="blue" />
          <div>
            <h2 className="text-[22px] font-bold uppercase text-[#2361d4] xl:text-[24px]">Monitoreo</h2>
            <p className="mt-1 text-[16px] text-[#0b2138]">3 situaciones en vigilancia</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-[#c9dbff] bg-[#eef5ff] p-6">
          <p className="text-[20px] leading-relaxed">Se recomienda continuar monitoreando la evolución de las siguientes condiciones.</p>
        </div>

        <h3 className="mt-8 text-[18px] font-bold">Situaciones en vigilancia</h3>
        <div className="mt-5 space-y-5">
          {watchItems.map((item) => (
            <div key={item.title} className="flex items-center gap-5">
              <ToneIcon icon={item.icon} tone={item.tone} />
              <div>
                <p className="text-[17px] font-bold">{item.title}</p>
                <StatusPill tone={item.status.includes("moderadas") ? "amber" : "green"}>{item.status}</StatusPill>
              </div>
            </div>
          ))}
        </div>

        <SectionButton tone="blue" onClick={() => setView("monitoreo")} />
      </article>

      <article className="flex min-h-[650px] flex-col rounded-xl border border-[#c6dfce] bg-[linear-gradient(135deg,#f8fff9,#ffffff)] p-7 shadow-sm">
        <div className="flex items-center gap-5">
          <ToneIcon icon={ShieldCheck} tone="green" />
          <div>
            <h2 className="text-[20px] font-bold uppercase text-[#16823b] xl:text-[24px]">Recomendaciones</h2>
            <p className="mt-1 text-[16px] text-[#0b2138]">Acciones sugeridas</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-[#c6dfce] bg-[#f2fbf4] p-6">
          <p className="text-[20px] leading-relaxed">Acciones sugeridas según las condiciones actuales y las reglas agronómicas aplicadas.</p>
        </div>

        <h3 className="mt-8 text-[18px] font-bold">Acciones principales</h3>
        <div className="mt-5 space-y-5">
          {[
            [Search, "Monitorear el lote durante los próximos 5 días"],
            [Leaf, "Prestar especial atención a hojas del tercio inferior"],
            [Droplets, "Revisar disponibilidad de agua y evaluar estrategias de manejo"],
          ].map(([Icon, text]) => (
            <div key={text as string} className="flex items-center gap-5">
              <ToneIcon icon={Icon as typeof Leaf} tone="green" />
              <p className="text-[17px] leading-relaxed">{text as string}</p>
            </div>
          ))}
        </div>

        <SectionButton tone="green" onClick={() => setView("recomendaciones")} />
      </article>
    </section>
  );
}

function ClimateSummary({ resultado }: { resultado?: ResultadoConsulta | null }) {
  const metrics = getClimateMetrics(resultado);

  return (
    <section className="mt-8 rounded-xl border border-[#d8e3dd] bg-white p-7 shadow-sm">
      <h2 className="text-[18px] font-bold">¿Qué está viendo Avizor?</h2>
      <p className="mt-1 text-[14px] text-[#52657a]">Resumen climático de los últimos 14 días.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-5 md:divide-x md:divide-[#dfe7e2]">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-3">
            <div className="flex items-center gap-4">
              <metric.icon className="h-8 w-8 text-[#5d7897]" />
              <div>
                <p className="text-[26px] font-bold leading-none">{metric.value}</p>
                <p className="mt-1 text-[13px] text-[#40556c]">{metric.label}</p>
              </div>
            </div>
            <div className="mt-5"><Sparkline color={metric.color} bars={metric.chart === "bars"} /></div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 border-t border-[#e4ebe6] pt-4 text-[14px] text-[#52657a]">
        <Info className="h-5 w-5 text-avizor-green" /> Los datos se actualizan diariamente. Última actualización: hoy, 08:30 h.
      </div>
    </section>
  );
}

function FeedbackSection({ accent = "green" }: { accent?: "green" | "blue" }) {
  const observationButtons = ["Nada relevante", "Posibles plagas", "Posibles enfermedades", "Exceso de agua", "Sequía", "Otro"];
  const submitClass = accent === "blue" ? "bg-[#145edc]" : "bg-avizor-green";
  const [utilidad, setUtilidad] = useState<"si" | "parcialmente" | "no" | null>(null);
  const [observaciones, setObservaciones] = useState<string[]>([]);
  const [sugerencia, setSugerencia] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [interesadoStatus, setInteresadoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function getStoredContext() {
    if (typeof window === "undefined") return {};

    const resultado = window.sessionStorage.getItem("avizor_resultado");
    const consulta = window.sessionStorage.getItem("avizor_consulta");
    const sessionId = window.localStorage.getItem("avizor_session_id") ?? undefined;

    return {
      share_token: resultado ? JSON.parse(resultado).share_token : undefined,
      session_id: sessionId,
      consulta: consulta ? JSON.parse(consulta) : undefined,
    };
  }

  function toggleObservacion(label: string) {
    setObservaciones((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  async function submitFeedback() {
    setFeedbackStatus("saving");
    const context = getStoredContext();

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_token: context.share_token,
          session_id: context.session_id,
          utilidad,
          observaciones,
          sugerencia: sugerencia || undefined,
        }),
      });

      if (!response.ok) throw new Error("No se pudo guardar feedback");

      if (observaciones.length > 0) {
        const observacionResponse = await fetch("/api/observaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            share_token: context.share_token,
            session_id: context.session_id,
            opciones: observaciones,
          }),
        });

        if (!observacionResponse.ok) throw new Error("No se pudo guardar observacion");
      }

      setFeedbackStatus("saved");
    } catch {
      setFeedbackStatus("error");
    }
  }

  async function submitInteresado() {
    if (!email.trim()) return;

    setInteresadoStatus("saving");
    const context = getStoredContext();

    try {
      const response = await fetch("/api/interesados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_token: context.share_token,
          session_id: context.session_id,
          email,
          localidad: context.consulta?.localidad,
          cultivo: context.consulta?.cultivo,
        }),
      });

      if (!response.ok) throw new Error("No se pudo guardar interesado");
      setInteresadoStatus("saved");
    } catch {
      setInteresadoStatus("error");
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-[#d8e3dd] bg-white shadow-sm">
      <div className="grid gap-8 p-7 lg:grid-cols-3 lg:divide-x lg:divide-[#e1e8e4]">
        <div>
          <h2 className="text-[20px] font-bold">¿Te resultó útil esta información?</h2>
          <p className="mt-6 text-[15px] leading-relaxed">¿Las condiciones que describe Avizor coinciden con lo que ves en el campo?</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setUtilidad("si")} className={`inline-flex h-12 items-center gap-3 rounded-md border px-5 ${utilidad === "si" ? "border-[#087238] bg-[#e8f6ed] text-[#087238]" : "border-[#9ccdad] text-[#087238]"}`}><ThumbsUp className="h-5 w-5" /> Sí</button>
            <button onClick={() => setUtilidad("parcialmente")} className={`inline-flex h-12 items-center gap-3 rounded-md border px-5 ${utilidad === "parcialmente" ? "border-[#b86600] bg-[#fff0ce] text-[#b86600]" : "border-[#efc66f] text-[#b86600]"}`}><Meh className="h-5 w-5" /> Parcialmente</button>
            <button onClick={() => setUtilidad("no")} className={`inline-flex h-12 items-center gap-3 rounded-md border px-5 ${utilidad === "no" ? "border-[#c51f1f] bg-[#ffe9e7] text-[#c51f1f]" : "border-[#f2b1aa] text-[#c51f1f]"}`}><ThumbsDown className="h-5 w-5" /> No</button>
          </div>
        </div>

        <div className="lg:px-7">
          <h3 className="text-[16px] font-bold">¿Qué observás actualmente en el lote?</h3>
          <p className="text-[13px] text-[#52657a]">(podés seleccionar más de una)</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {observationButtons.map((label) => (
              <button key={label} onClick={() => toggleObservacion(label)} className={`rounded-md border px-3 py-2 text-[13px] font-semibold ${observaciones.includes(label) ? "border-avizor-green bg-[#f7fbf8] text-avizor-green" : "border-[#d8e3dd] text-[#0b2138] hover:bg-[#f7fbf8]"}`}>{label}</button>
            ))}
          </div>
          <button onClick={submitFeedback} disabled={feedbackStatus === "saving"} className={`mx-auto mt-6 flex h-11 min-w-[240px] items-center justify-center gap-2 rounded-md px-7 text-white disabled:opacity-70 ${submitClass}`}><Send className="h-4 w-4" /> {feedbackStatus === "saving" ? "Enviando..." : "Enviar feedback"}</button>
          {feedbackStatus === "saved" && <p className="mt-3 text-center text-[13px] font-semibold text-avizor-green">Gracias por tu feedback.</p>}
          {feedbackStatus === "error" && <p className="mt-3 text-center text-[13px] font-semibold text-[#c51f1f]">No pudimos guardar el feedback.</p>}
        </div>

        <div className="lg:pl-7">
          <h3 className="text-[16px] font-bold">¿Qué te gustaría que incorpore Avizor?</h3>
          <p className="text-[13px] text-[#52657a]">(opcional)</p>
          <textarea value={sugerencia} onChange={(event) => setSugerencia(event.target.value.slice(0, 300))} className="mt-5 h-32 w-full resize-none rounded-md border border-[#d8e3dd] p-4 text-[14px] outline-none focus:border-avizor-green" placeholder="Contanos tu sugerencia..." />
          <p className="mt-1 text-right text-[12px] text-[#52657a]">{sugerencia.length} / 300</p>
        </div>
      </div>

      <div className="grid border-t border-[#e1e8e4] lg:grid-cols-2 lg:divide-x lg:divide-[#e1e8e4]">
        <div className="flex items-center gap-5 p-7">
          <ToneIcon icon={MessageCircle} tone="green" />
          <div>
            <h3 className="font-bold">Compartir este resultado</h3>
            <p className="mt-1 text-[14px] text-[#52657a]">Compartí este análisis con tu equipo o asesor.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#9ccdad] px-5 text-[#087238]"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#9ccdad] px-5 text-[#087238]"><LinkIcon className="h-4 w-4" /> Copiar enlace</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 p-7">
          <ToneIcon icon={Bell} tone="green" />
          <div className="flex-1">
            <h3 className="font-bold">¿Querés recibir un aviso si las condiciones cambian?</h3>
            <p className="mt-1 text-[14px] text-[#52657a]">Te enviaremos un email si es necesario que prestes atención.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8493a3]" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 w-full rounded-md border border-[#d8e3dd] pl-11 pr-4 outline-none focus:border-avizor-green" placeholder="Ingresá tu email" /></div>
              <button onClick={submitInteresado} disabled={interesadoStatus === "saving"} className="h-11 rounded-md bg-avizor-green px-6 text-white disabled:opacity-70">{interesadoStatus === "saving" ? "Guardando..." : "Guardar seguimiento"}</button>
            </div>
            {interesadoStatus === "saved" && <p className="mt-3 text-[13px] font-semibold text-avizor-green">Seguimiento guardado.</p>}
            {interesadoStatus === "error" && <p className="mt-3 text-[13px] font-semibold text-[#c51f1f]">No pudimos guardar el seguimiento.</p>}
          </div>
          <Heart className="hidden h-12 w-12 text-[#64b56d] lg:block" />
        </div>
      </div>
    </section>
  );
}
function AttentionHeader({ setView }: { setView: (view: View) => void }) {
  return (
    <section>
      <button onClick={() => setView("resumen")} className="inline-flex items-center gap-3 text-[15px] font-semibold text-avizor-green">
        <ArrowLeft className="h-5 w-5" /> Volver a Resultados
      </button>
      <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <ToneIcon icon={Bell} tone="amber" />
          <div>
            <h1 className="text-[34px] font-bold uppercase leading-tight text-[#d71920]">Atención</h1>
            <p className="mt-2 text-[18px] font-semibold">Las condiciones actuales merecen atención.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 text-avizor-green" /><p><strong>Basado en 14 días completos</strong><br />de datos climáticos</p></div>
          <div className="flex items-start gap-3"><CalendarDays className="h-6 w-6 text-[#173a67]" /><p>Consulta realizada:<br />hoy, 08:30 h</p></div>
        </div>
      </div>
      <div className="mt-8 max-w-[760px]"><QuerySummary /></div>
    </section>
  );
}

function AttentionMetric({ icon: Icon, label, value }: { icon: typeof Leaf; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 text-[15px]">
      <span className="inline-flex items-center gap-3 text-[#40556c]"><Icon className="h-5 w-5 text-[#5d7897]" /> {label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AttentionCard({ expanded = false, icon: Icon, title, text, date, metrics, recommendation }: {
  expanded?: boolean;
  icon: typeof Leaf;
  title: string;
  text: string;
  date: string;
  metrics: Array<{ icon: typeof Leaf; label: string; value: string }>;
  recommendation: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#f0b8b8] bg-[linear-gradient(135deg,#fffafa,#ffffff)] shadow-sm">
      <div className="grid gap-7 p-7 lg:grid-cols-[1.08fr_1fr_1fr]">
        <div className="flex gap-6">
          <ToneIcon icon={Icon} tone="red" />
          <div className="flex-1">
            <h3 className="text-[24px] font-bold">{title}</h3>
            <StatusPill tone="amber">Condiciones moderadas</StatusPill>
            <p className="mt-6 text-[17px] leading-relaxed">{text}</p>
            <div className="mt-7 border-t border-[#eddada] pt-5 text-[15px]">Nivel de atención: <span className="ml-2 inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f2a51b]" /> Media</span></div>
          </div>
        </div>

        <div className="border-[#eddada] lg:border-l lg:pl-8">
          <h4 className="mb-5 font-bold">¿Qué está viendo Avizor?</h4>
          <div className="space-y-4">
            {metrics.map((metric) => <AttentionMetric key={metric.label} {...metric} />)}
          </div>
        </div>

        <div className="border-[#eddada] lg:border-l lg:pl-8">
          <h4 className="mb-5 font-bold">Recomendación</h4>
          <p className="text-[16px] leading-relaxed">{recommendation}</p>
          <button className="mt-7 rounded-md border border-[#ef8d8d] px-5 py-3 text-[14px] font-semibold text-[#d71920]">Ver evolución histórica</button>
        </div>
      </div>

      <div className="grid border-y border-[#f0caca] bg-[#fff8f8] px-7 py-4 text-[14px] md:grid-cols-3">
        <p className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-avizor-green" /> Detectado: {date}</p>
        <p className="text-center">Estado: <strong className="text-[#d71920]">Activa</strong></p>
        <p className="text-right">Última actualización: hoy, 08:30 h</p>
      </div>

      {expanded && (
        <div className="grid gap-7 p-7 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <h4 className="font-bold">Información adicional</h4>
            <div className="mt-5 rounded-lg bg-white p-3"><Sparkline color="#208b42" /></div>
            <div className="mt-3 flex justify-center gap-6 text-[13px]"><span className="text-[#208b42]">Humedad media (%)</span><span className="text-[#2f80ed]">Lluvias (mm)</span></div>
          </div>
          <div className="border-[#e4ebe6] lg:border-l lg:pl-8">
            <h4 className="font-bold">Explicación</h4>
            <p className="mt-5 text-[16px] leading-relaxed">La combinación de humedad elevada y lluvias acumuladas en los últimos días puede favorecer la germinación de esporas y el desarrollo de enfermedades foliares.</p>
            <p className="mt-6 text-avizor-green">Ver metodología aplicada</p>
          </div>
          <div className="border-[#e4ebe6] lg:border-l lg:pl-8">
            <h4 className="font-bold">Impacto potencial</h4>
            <StatusPill tone="amber">Moderado</StatusPill>
            <p className="mt-5 text-[16px] leading-relaxed">Si las condiciones persisten, puede generar pérdidas moderadas en rendimiento.</p>
            <p className="mt-7 text-avizor-green">Ver más sobre enfermedades foliares</p>
          </div>
        </div>
      )}
    </article>
  );
}

function DetailHeader({ title, subtitle, setView }: { title: string; subtitle: string; setView: (view: View) => void }) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#d8e3dd] pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <button onClick={() => setView("resumen")} className="mb-5 inline-flex items-center gap-2 text-[14px] font-semibold text-avizor-green"><ArrowLeft className="h-4 w-4" /> Volver al resumen</button>
        <h1 className="text-[42px] font-bold leading-tight">{title}</h1>
        <p className="mt-2 text-[18px] text-[#40556c]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 text-[#0b2138]"><ShieldCheck className="h-6 w-6 text-avizor-green" /><p><strong>Basado en 14 días completos</strong><br />de datos climáticos</p></div>
    </div>
  );
}

function AttentionDetail({ setView }: { setView: (view: View) => void }) {
  const foliarMetrics = [
    { icon: Droplets, label: "Humedad media", value: "82%" },
    { icon: Droplets, label: "Lluvias últimos 5 días", value: "42 mm" },
    { icon: Thermometer, label: "Temperatura media", value: "22 °C" },
    { icon: Wind, label: "Viento medio", value: "12 km/h" },
  ];
  const waterMetrics = [
    { icon: Droplets, label: "Déficit hídrico", value: "Moderado" },
    { icon: Thermometer, label: "Temperaturas máximas", value: "28-32 °C" },
    { icon: Wind, label: "Viento medio", value: "12 km/h" },
    { icon: CalendarDays, label: "Días con alta demanda", value: "4 días" },
  ];

  return (
    <>
      <AttentionHeader setView={setView} />
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-5">
          <h2 className="text-[22px] font-bold">Atenciones activas (2)</h2>
          <div className="flex items-center gap-3 text-[14px]">Ordenar por <button className="rounded-md border border-[#d8e3dd] bg-white px-5 py-3 font-semibold">Más relevantes <ChevronDown className="ml-2 inline h-4 w-4" /></button></div>
        </div>
        <div className="space-y-5">
          <AttentionCard expanded icon={Leaf} title="Enfermedades foliares" date="27/06/2026" text="Las condiciones actuales pueden favorecer el desarrollo de enfermedades foliares." metrics={foliarMetrics} recommendation="Monitorear el lote durante los próximos 5 días. Prestar especial atención a hojas del tercio inferior." />
          <AttentionCard icon={Droplets} title="Estrés hídrico" date="26/06/2026" text="Se registraron días con alta demanda evaporativa en la última semana." metrics={waterMetrics} recommendation="Revisar disponibilidad de agua y evaluar estrategias de manejo para reducir estrés." />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[22px] font-bold">En vigilancia (3)</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#efd8ab] bg-white">
          {watchItems.map((item) => (
            <div key={item.title} className="grid gap-4 border-b border-[#f0dfba] px-6 py-4 last:border-b-0 md:grid-cols-[360px_1fr_auto_auto] md:items-center">
              <div className="flex items-center gap-4"><ToneIcon icon={item.icon} tone={item.tone} /><p className="font-bold">{item.title}</p><StatusPill tone={item.status.includes("moderadas") ? "amber" : "green"}>{item.status}</StatusPill></div>
              <p className="text-[#40556c]">{item.title === "Heladas" ? "Por el momento no se esperan heladas en los próximos días." : "Algunas variables se encuentran en el rango que puede favorecer esta categoría."}</p>
              <button className="rounded-md border border-[#9ccdad] px-5 py-2 text-avizor-green">Ver detalle</button>
              <ChevronDown />
            </div>
          ))}
        </div>
      </section>

      <FeedbackSection />
      <section className="mt-8 flex flex-col gap-5 rounded-xl border border-[#d8e3dd] bg-[#f7fbf8] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4"><ToneIcon icon={ShieldCheck} tone="green" /><p className="text-[#40556c]">Este resultado se genera con datos climáticos y reglas agronómicas validadas.<br />No reemplaza la observación a campo ni el criterio de tu asesor agronómico.</p></div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccdad] bg-white px-6 text-[#087238]">Ver metodología completa <ArrowRight className="h-4 w-4" /></button>
      </section>
    </>
  );
}
function MonitorDetail({ setView }: { setView: (view: View) => void }) {
  const metricCards = [
    { icon: Droplets, title: "Humedad media", value: "82%", help: "Promedio del período", note: "Rango: 65% - 95%", color: "#145edc", chart: "line" as const },
    { icon: Droplets, title: "Lluvias acumuladas", value: "42 mm", help: "Últimos 5 días", note: "Total 14 días: 68 mm", color: "#2f80ed", chart: "bars" as const },
    { icon: Thermometer, title: "Temperatura media", value: "22 °C", help: "Promedio del período", note: "Rango: 14 °C - 30 °C", color: "#8a5bd6", chart: "line" as const },
    { icon: Wind, title: "Viento medio", value: "12 km/h", help: "Promedio del período", note: "Rango: 5 - 28 km/h", color: "#158b83", chart: "line" as const },
    { icon: CalendarDays, title: "Días con lluvia", value: "3 días", help: "Últimos 14 días", note: "Máx. consecutivos: 2 días", color: "#4f8c45", chart: "line" as const },
  ];
  const variableTabs = ["Humedad", "Lluvias", "Temperatura", "Viento", "Días con lluvia"];
  const history = [
    ["27/06/2026 08:30", "Tandil, Buenos Aires", "Soja", "2", "3", "3"],
    ["24/06/2026 08:15", "Tandil, Buenos Aires", "Soja", "1", "2", "2"],
    ["21/06/2026 08:20", "Tandil, Buenos Aires", "Soja", "0", "2", "3"],
    ["18/06/2026 08:10", "Tandil, Buenos Aires", "Soja", "1", "3", "2"],
    ["15/06/2026 08:05", "Tandil, Buenos Aires", "Soja", "2", "4", "3"],
  ];

  const LargeHumidityChart = () => {
    const points = "0,124 60,106 120,82 180,86 240,34 300,74 360,58 420,96 480,96 540,30 600,78 660,76 720,90 780,64 840,90";
    const area = `0,188 ${points} 840,188`;
    return (
      <svg viewBox="0 0 900 250" className="h-[270px] w-full">
        <defs>
          <linearGradient id="humidityArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#145edc" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#145edc" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((row) => <line key={`h-${row}`} x1="28" x2="868" y1={28 + row * 40} y2={28 + row * 40} stroke="#dfe7f0" strokeWidth="1" />)}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => <line key={`v-${col}`} x1={28 + col * 105} x2={28 + col * 105} y1="28" y2="188" stroke="#edf2f6" strokeWidth="1" />)}
        {["100%", "75%", "50%", "25%", "0%"].map((label, i) => <text key={label} x="0" y={32 + i * 40} fill="#58708a" fontSize="12">{label}</text>)}
        <polygon points={area} fill="url(#humidityArea)" transform="translate(28 0)" />
        <polyline points={points} fill="none" stroke="#145edc" strokeWidth="3" transform="translate(28 0)" />
        {points.split(" ").map((point, i) => {
          const [x, y] = point.split(",").map(Number);
          return <circle key={i} cx={x + 28} cy={y} r="4" fill="#145edc" stroke="white" strokeWidth="2" />;
        })}
        {["14/06", "15/06", "16/06", "17/06", "18/06", "19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06", "26/06", "27/06"].map((label, i) => (
          <text key={label} x={28 + i * 64} y="222" fill="#223b57" fontSize="12">{label}</text>
        ))}
        <line x1="420" x2="444" y1="240" y2="240" stroke="#145edc" strokeWidth="3" />
        <text x="456" y="244" fill="#0b2138" fontSize="13">Humedad media (%)</text>
      </svg>
    );
  };

  return (
    <>
      <section>
        <button onClick={() => setView("resumen")} className="inline-flex items-center gap-3 text-[15px] font-semibold text-[#145edc]">
          <ArrowLeft className="h-5 w-5" /> Volver a Resultados
        </button>
        <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <ToneIcon icon={TrendingUp} tone="blue" />
            <div>
              <h1 className="text-[34px] font-bold uppercase leading-tight text-[#145edc]">Monitoreo</h1>
              <p className="mt-2 text-[17px] text-[#263d55]">Seguimiento de la evolución de las condiciones ambientales.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 text-avizor-green" /><p><strong>Basado en 14 días completos</strong><br />de datos climáticos</p></div>
            <div className="flex items-start gap-3"><CalendarDays className="h-6 w-6 text-[#173a67]" /><p>Consulta realizada:<br />hoy, 08:30 h</p></div>
          </div>
        </div>
        <div className="mt-8 max-w-[760px]"><QuerySummary /></div>
      </section>

      <section className="mt-8">
        <h2 className="text-[22px] font-bold">Evolución general (últimos 14 días)</h2>
        <div className="mt-5 overflow-hidden rounded-xl border border-[#d8e3dd] bg-white shadow-sm">
          <div className="grid md:grid-cols-5 md:divide-x md:divide-[#e1e8e4]">
            {metricCards.map((metric) => (
              <article key={metric.title} className="p-6">
                <div className="flex items-start gap-4">
                  <metric.icon className="h-8 w-8" style={{ color: metric.color }} />
                  <div>
                    <h3 className="text-[15px] font-bold">{metric.title}</h3>
                    <p className="mt-1 text-[28px] font-bold leading-none">{metric.value}</p>
                    <p className="mt-2 text-[12px] text-[#52657a]">{metric.help}</p>
                  </div>
                </div>
                <div className="mt-7"><Sparkline color={metric.color} bars={metric.chart === "bars"} /></div>
                <p className="mt-5 text-[13px] text-[#40556c]">{metric.note}</p>
              </article>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-[#e1e8e4] bg-[#fbfdff] px-5 py-4 text-[14px] text-[#52657a]">
            <Info className="h-5 w-5 text-[#145edc]" /> Los datos se actualizan diariamente. Última actualización: hoy, 08:30 h.
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[22px] font-bold">Evolución por variable</h2>
            <div className="mt-5 flex flex-wrap gap-4">
              {variableTabs.map((tab, index) => (
                <button key={tab} className={`h-11 min-w-[112px] rounded-md border px-5 text-[14px] font-semibold ${index === 0 ? "border-[#145edc] bg-[#145edc] text-white" : "border-[#cddae7] bg-white text-[#173a67]"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <button className="inline-flex h-11 items-center justify-center gap-3 rounded-md border border-[#cddae7] bg-white px-5 text-[14px] font-semibold text-[#145edc]"><CalendarDays className="h-5 w-5" /> 14 días <ChevronDown className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_230px]">
          <article className="overflow-hidden rounded-xl border border-[#d8e3dd] bg-white shadow-sm">
            <div className="p-6">
              <h3 className="text-[18px] font-bold">Humedad media relativa (%)</h3>
              <LargeHumidityChart />
            </div>
            <div className="flex items-center gap-3 border-t border-[#dbe7f5] bg-[#f8fbff] px-5 py-4 text-[14px] text-[#40556c]">
              <Info className="h-5 w-5 text-[#145edc]" /> La humedad se mantuvo elevada durante gran parte del período, con picos los días 17/06 y 23/06.
            </div>
          </article>
          <aside className="rounded-xl border border-[#d8e3dd] bg-white p-6 shadow-sm">
            <h3 className="text-[17px] font-bold">Resumen del período</h3>
            <div className="mt-6 space-y-8">
              <div className="flex justify-between gap-4"><span className="text-[#40556c]">Promedio</span><strong className="text-[22px]">82%</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[#40556c]">Máximo</span><strong className="text-[22px]">95%<br /><span className="text-[12px] font-normal text-[#52657a]">(17/06)</span></strong></div>
              <div className="flex justify-between gap-4"><span className="text-[#40556c]">Mínimo</span><strong className="text-[22px]">65%<br /><span className="text-[12px] font-normal text-[#52657a]">(17/06)</span></strong></div>
              <div className="flex justify-between gap-4"><span className="text-[#40556c]">Tendencia</span><strong className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f2a51b]" /> Estable</strong></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[22px] font-bold">Historial de consultas</h2>
        <p className="mt-2 text-[#40556c]">Compará la evolución entre tus últimas consultas.</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-[#d8e3dd] bg-white shadow-sm">
          <div className="grid grid-cols-[1.25fr_1.3fr_0.8fr_0.75fr_0.85fr_1.1fr_0.9fr] border-b border-[#e1e8e4] bg-[#fbfcfd] px-5 py-3 text-[13px] font-bold text-[#173a67]">
            <span>Fecha de consulta</span><span>Localidad</span><span>Cultivo</span><span>Atención</span><span>Monitoreo</span><span>Recomendaciones</span><span>Ver detalle</span>
          </div>
          {history.map((row, index) => (
            <div key={row[0]} className="grid grid-cols-[1.25fr_1.3fr_0.8fr_0.75fr_0.85fr_1.1fr_0.9fr] items-center border-b border-[#e1e8e4] px-5 py-3 text-[13px] last:border-b-0">
              <span>{row[0]}</span>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
              <span className="inline-flex items-center gap-2"><Bell className={`h-4 w-4 ${index === 2 ? "text-avizor-green" : index === 1 || index === 3 ? "text-[#d99000]" : "text-[#d71920]"}`} /> {row[3]}</span>
              <span className="inline-flex items-center gap-2 text-[#145edc]"><TrendingUp className="h-4 w-4" /> {row[4]}</span>
              <span className="inline-flex items-center gap-2 text-avizor-green"><ShieldCheck className="h-4 w-4" /> {row[5]}</span>
              <button className="h-8 rounded-md border border-[#9fc0ff] px-3 text-[12px] font-semibold text-[#145edc]">Ver detalle</button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <button className="h-11 min-w-[260px] rounded-md border border-[#cddae7] bg-white px-6 font-semibold text-[#145edc]">Ver historial completo</button>
        </div>
      </section>

      <FeedbackSection accent="blue" />
      <section className="mt-8 flex flex-col gap-5 rounded-xl border border-[#d8e3dd] bg-[#f7fbf8] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4"><ToneIcon icon={ShieldCheck} tone="green" /><p className="text-[#40556c]">Este resultado se genera con datos climáticos y reglas agronómicas validadas.<br />No reemplaza la observación a campo ni el criterio de tu asesor agronómico.</p></div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccdad] bg-white px-6 text-[#087238]">Ver metodología completa <ArrowRight className="h-4 w-4" /></button>
      </section>
    </>
  );
}

function RecommendationDetail({ setView }: { setView: (view: View) => void }) {
  const recommendations = [
    {
      icon: Search,
      title: "Monitorear el lote durante los próximos 5 días",
      text: "Se recomienda intensificar el monitoreo, especialmente en el tercio inferior del cultivo.",
      priority: "Media",
      priorityTone: "amber" as Tone,
      reason: "Humedad relativa elevada y lluvias recientes pueden favorecer enfermedades foliares.",
    },
    {
      icon: Leaf,
      title: "Prestar especial atención a hojas del tercio inferior",
      text: "Revisar síntomas iniciales de enfermedades foliares como mancha ojo de rana, septoria y cercospora.",
      priority: "Media",
      priorityTone: "amber" as Tone,
      reason: "Condiciones actuales moderadas para desarrollo de enfermedades foliares.",
    },
    {
      icon: Droplets,
      title: "Revisar disponibilidad de agua y evaluar estrategias de manejo",
      text: "Evaluar el estado hídrico del lote y considerar prácticas para reducir el estrés.",
      priority: "Baja",
      priorityTone: "green" as Tone,
      reason: "Déficit hídrico moderado en la última semana.",
    },
    {
      icon: Wind,
      title: "Vigilar enfermedades de tallo",
      text: "Mantener el monitoreo en estadios vegetativos avanzados.",
      priority: "Baja",
      priorityTone: "green" as Tone,
      reason: "Condiciones actuales poco favorables, pero con riesgo en el corto plazo.",
    },
  ];
  const context = [
    { icon: Droplets, value: "82%", label: "Humedad media", help: "rango: 65% - 95%" },
    { icon: Droplets, value: "42 mm", label: "Lluvias últimos 5 días", help: "total 14 días: 68 mm" },
    { icon: Thermometer, value: "22 °C", label: "Temperatura media", help: "rango: 14 - 30 °C" },
    { icon: Wind, value: "12 km/h", label: "Viento medio", help: "rango: 5 - 28 km/h" },
    { icon: CalendarDays, value: "3 días", label: "Días con lluvia", help: "consecutivos (máx. 2)" },
    { icon: Sprout, value: "V6", label: "Estado fenológico", help: "estimado" },
  ];
  const rules = [
    "Modelo de enfermedades foliares en soja v1.0",
    "Modelo de estrés hídrico v1.0",
    "Modelo de plagas clave v1.0",
    "Reglas basadas en umbrales climáticos históricos",
    "Validación técnica: Ing. Agr. Laboratorio Agropecuario",
  ];

  return (
    <>
      <section>
        <button onClick={() => setView("resumen")} className="inline-flex items-center gap-3 text-[15px] font-semibold text-avizor-green">
          <ArrowLeft className="h-5 w-5" /> Volver a Resultados
        </button>
        <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <ToneIcon icon={ShieldCheck} tone="green" />
            <div>
              <h1 className="text-[34px] font-bold uppercase leading-tight text-[#087238]">Recomendaciones</h1>
              <p className="mt-2 text-[17px] text-[#263d55]">Acciones sugeridas según las condiciones actuales y las reglas agronómicas aplicadas.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 text-avizor-green" /><p><strong>Basado en 14 días completos</strong><br />de datos climáticos</p></div>
            <div className="flex items-start gap-3"><CalendarDays className="h-6 w-6 text-avizor-green" /><p>Consulta realizada:<br />hoy, 08:30 h</p></div>
          </div>
        </div>
        <div className="mt-8 max-w-[760px]"><QuerySummary /></div>
      </section>

      <section className="mt-8 flex flex-col gap-5 rounded-xl border border-[#bcdcc6] bg-[linear-gradient(135deg,#f7fff8,#ffffff)] p-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Leaf className="h-9 w-9 text-avizor-green" />
          <div>
            <h2 className="text-[20px] font-bold">Acciones sugeridas principales</h2>
            <p className="mt-1 text-[#40556c]">Estas recomendaciones consideran las condiciones actuales y el estado fenológico del cultivo.</p>
          </div>
        </div>
        <button className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-[#9ccdad] bg-white px-7 font-semibold text-[#087238]"><Download className="h-5 w-5" /> Descargar recomendaciones</button>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-[#d8e3dd] bg-white shadow-sm">
        <div className="p-6"><h2 className="text-[20px] font-bold">Recomendaciones para tu lote</h2></div>
        <div className="hidden grid-cols-[1.55fr_0.35fr_1fr_0.55fr] border-y border-[#e1e8e4] px-6 py-4 text-[14px] font-bold lg:grid">
          <span>Recomendación</span><span>Prioridad</span><span>Fundamento</span><span>Acción</span>
        </div>
        <div>
          {recommendations.map((item) => (
            <article key={item.title} className="grid gap-5 border-b border-[#e1e8e4] px-6 py-6 last:border-b-0 lg:grid-cols-[1.55fr_0.35fr_1fr_0.55fr] lg:items-center">
              <div className="flex gap-5">
                <ToneIcon icon={item.icon} tone="green" />
                <div>
                  <h3 className="text-[18px] font-bold">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#40556c]">{item.text}</p>
                </div>
              </div>
              <div><StatusPill tone={item.priorityTone}>{item.priority}</StatusPill></div>
              <p className="text-[15px] leading-relaxed">{item.reason}</p>
              <button className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-[#9ccdad] px-5 font-semibold text-[#087238]">Ver detalle <ArrowRight className="h-4 w-4" /></button>
            </article>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-[#e1e8e4] px-6 py-4 text-[#40556c]"><Info className="h-5 w-5 text-avizor-green" /> Las recomendaciones no reemplazan la consulta con tu asesor agronómico.</div>
      </section>

      <section className="mt-8 grid gap-7 lg:grid-cols-2">
        <article className="rounded-xl border border-[#d8e3dd] bg-white p-7 shadow-sm">
          <h2 className="text-[20px] font-bold">Contexto actual</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {context.map((item) => (
              <div key={item.label} className="flex gap-4">
                <item.icon className="mt-1 h-7 w-7 text-[#1f78ff]" />
                <div><p className="text-[24px] font-bold">{item.value}</p><p className="text-[13px] text-[#40556c]">{item.label}</p><p className="mt-1 text-[11px] text-[#6c7d8e]">({item.help})</p></div>
              </div>
            ))}
          </div>
          <button className="mt-8 inline-flex items-center gap-3 font-semibold text-avizor-green">Ver evolución completa <ArrowRight className="h-4 w-4" /></button>
        </article>

        <article className="rounded-xl border border-[#d8e3dd] bg-white p-7 shadow-sm">
          <h2 className="text-[20px] font-bold">Reglas agronómicas aplicadas</h2>
          <div className="mt-6 space-y-5">
            {rules.map((rule) => (
              <p key={rule} className="flex items-start gap-3 text-[15px] text-[#40556c]"><CheckCircle2 className="h-5 w-5 shrink-0 text-avizor-green" /> {rule}</p>
            ))}
          </div>
          <button className="mt-8 inline-flex items-center gap-3 font-semibold text-avizor-green">Ver metodología completa <ArrowRight className="h-4 w-4" /></button>
        </article>
      </section>

      <FeedbackSection />
      <section className="mt-8 flex flex-col gap-5 rounded-xl border border-[#d8e3dd] bg-[#f7fbf8] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4"><ToneIcon icon={ShieldCheck} tone="green" /><p className="text-[#40556c]">Este resultado se genera con datos climáticos y reglas agronómicas validadas.<br />No reemplaza la observación a campo ni el criterio de tu asesor agronómico.</p></div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccdad] bg-white px-6 text-[#087238]">Ver metodología completa <ArrowRight className="h-4 w-4" /></button>
      </section>
    </>
  );
}

function SummaryView({ setView, consulta, resultado }: { setView: (view: View) => void; consulta?: StoredConsulta | null; resultado?: ResultadoConsulta | null }) {
  return (
    <>
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[42px] font-bold leading-tight">Resultados</h1>
          <p className="mt-3 text-[18px] text-[#40556c]">Resumen de las condiciones para tu consulta</p>
          <div className="mt-6"><QuerySummary consulta={consulta} resultado={resultado} /></div>
        </div>
        <div className="flex flex-col gap-8 lg:items-end">
          <div className="flex items-start gap-4"><ShieldCheck className="h-7 w-7 text-avizor-green" /><p><strong>Basado en {resultado?.dias_datos ?? 14} días de datos</strong><br />climáticos disponibles</p></div>
          <button className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-[#d8e3dd] bg-white px-7 text-[16px] font-semibold"><Map className="h-6 w-6 text-[#5d7897]" /> Ver en mapa</button>
        </div>
      </section>

      <SummaryCards setView={setView} />
      <ClimateSummary resultado={resultado} />
      <FeedbackSection />
      <section className="mt-8 flex flex-col gap-5 rounded-xl border border-[#d8e3dd] bg-[#f7fbf8] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4"><ToneIcon icon={ShieldCheck} tone="green" /><p className="text-[#40556c]">Este resultado se genera con datos climáticos y reglas agronómicas validadas.<br />No reemplaza la observación a campo ni el criterio de tu asesor agronómico.</p></div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccdad] bg-white px-6 text-[#087238]">Ver metodología completa <ArrowRight className="h-4 w-4" /></button>
      </section>
    </>
  );
}

export default function ResultadoPage() {
  const [view, setView] = useState<View>("resumen");
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  const [consulta, setConsulta] = useState<StoredConsulta | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialView = new URLSearchParams(window.location.search).get("vista");
    if (initialView === "atencion" || initialView === "monitoreo" || initialView === "recomendaciones") {
      setView(initialView);
    }

    try {
      const storedResultado = window.sessionStorage.getItem("avizor_resultado");
      const storedConsulta = window.sessionStorage.getItem("avizor_consulta");

      if (storedResultado) setResultado(JSON.parse(storedResultado));
      if (storedConsulta) setConsulta(JSON.parse(storedConsulta));
    } catch {
      setResultado(null);
      setConsulta(null);
    }
  }, []);

  return (
    <div className="bg-[#fbfdfc] text-[#0b2138]">
      <main className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10">
        {view === "resumen" && <SummaryView setView={setView} consulta={consulta} resultado={resultado} />}
        {view === "atencion" && <AttentionDetail setView={setView} />}
        {view === "monitoreo" && <MonitorDetail setView={setView} />}
        {view === "recomendaciones" && <RecommendationDetail setView={setView} />}
      </main>
    </div>
  );
}

