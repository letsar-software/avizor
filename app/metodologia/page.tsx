import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Leaf,
  LucideIcon as LucideIconValue,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Thermometer,
  UsersRound,
  Wind,
  X,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Metodología · Avizor",
  description: "Cómo Avizor transforma datos climáticos y reglas agronómicas en señales simples.",
};

const processSteps: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: CloudRain,
    title: "Datos climáticos",
    text: "Recolectamos información histórica y actual de fuentes públicas y confiables.",
  },
  {
    Icon: Leaf,
    title: "Reglas agronómicas",
    text: "Evaluamos los datos mediante reglas basadas en bibliografía técnica y validadas por especialistas.",
  },
  {
    Icon: Gauge,
    title: "Motor de evaluación",
    text: "Nuestro motor analiza las condiciones y calcula el nivel de riesgo por cada categoría.",
  },
  {
    Icon: ClipboardCheck,
    title: "Resultado y recomendación",
    text: "Generamos una señal clara, explicamos las causas y te sugerimos qué hacer.",
  },
];

const climateVariables: { Icon: LucideIcon; label: string; detail: string }[] = [
  { Icon: Thermometer, label: "Temperatura", detail: "media, máx. y mín." },
  { Icon: Droplets, label: "Humedad relativa", detail: "" },
  { Icon: CloudRain, label: "Precipitaciones acumuladas", detail: "" },
  { Icon: Wind, label: "Viento", detail: "velocidad media" },
  { Icon: CalendarDays, label: "Días consecutivos con lluvia", detail: "" },
];

const dataSources = [
  {
    name: "Open-Meteo",
    src: "",
    alt: "Open-Meteo",
  },
  {
    name: "NASA POWER",
    src: "https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg",
    alt: "NASA POWER",
  },
  {
    name: "SMN",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/SMN_Logo_Alta.png",
    alt: "Servicio Meteorológico Nacional",
  },
  {
    name: "INTA",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_INTA.svg",
    alt: "INTA Argentina",
  },
];

const isItems = [
  "Monitoreo ambiental.",
  "Señales simples y fáciles de interpretar.",
  "Información basada en evidencia.",
  "Recomendaciones para ayudar en la toma de decisiones.",
  "Una herramienta de apoyo para el trabajo en conjunto con tu asesor.",
];

const isNotItems = [
  "No diagnostica enfermedades.",
  "No reemplaza al asesor agronómico.",
  "No predice el futuro.",
  "No garantiza la aparición de plagas o enfermedades.",
  "No es una aplicación meteorológica general.",
];

const principles: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Search, title: "Transparencia", text: "Mostramos cómo llegamos a cada resultado." },
  { Icon: BookOpen, title: "Basado en evidencia", text: "Cada recomendación surge de datos y reglas técnicas validadas." },
  { Icon: UsersRound, title: "Construido junto al agro", text: "Escuchamos, aprendemos y mejoramos continuamente." },
];

function LogoMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${inverse ? "text-white" : "text-avizor-green"}`}>
      <span className="absolute inset-x-1 top-1 h-5 rounded-t-full border-4 border-current border-b-0" />
      <span className="absolute inset-x-1 bottom-1 h-5 rounded-b-full border-4 border-current border-t-0" />
      <span className="absolute h-3.5 w-3.5 rounded-full border-[3px] border-current" />
      <Leaf className="absolute -bottom-0.5 left-1 h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

function SourceLogo({ source }: { source: { name: string; src: string; alt: string } }) {
  if (source.name === "Open-Meteo") {
    return (
      <div className="flex min-h-16 items-center justify-center rounded-md bg-white px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf4ff] text-[#1f80d0]">
            <CloudRain className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <span className="text-[13px] font-semibold leading-tight text-[#0b4f8a]">Open-<br />Meteo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-16 items-center justify-center rounded-md bg-white px-2 py-2 text-center">
      <img src={source.src} alt={source.alt} className="max-h-12 max-w-[82px] object-contain" />
      {source.name === "NASA POWER" && <span className="ml-2 text-[12px] font-semibold text-[#1d3158]">POWER</span>}
    </div>
  );
}

export default function MetodologiaPage() {
  return (
    <main className="bg-white text-[#071d36]">
      <section className="relative min-h-[430px] overflow-hidden border-b border-[#dfe8df]">
        <Image src="/campo-hojas.png" alt="Cultivo de soja al atardecer" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,54,36,0.97)_0%,rgba(0,54,36,0.88)_36%,rgba(0,54,36,0.30)_62%,rgba(0,54,36,0.02)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[58%] opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="relative mx-auto flex min-h-[360px] max-w-[1320px] items-center px-5 py-12 sm:min-h-[430px] sm:px-8 sm:py-14">
          <div className="max-w-[640px] text-white">
            <h1 className="text-[42px] font-extrabold leading-none tracking-normal sm:text-[56px] md:text-[72px]">Metodología</h1>
            <p className="mt-5 max-w-[620px] text-[20px] font-extrabold leading-[1.3] sm:mt-7 sm:text-[26px]">
              Así transformamos datos climáticos en <span className="text-[#8fd341]">señales simples</span> para ayudarte a decidir mejor.
            </p>
            <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-white/95 sm:mt-6 sm:text-[20px]">
              Basado en datos abiertos, reglas agronómicas y evidencia técnica.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[#3aaa35] px-9 py-4 text-[17px] font-extrabold text-white shadow-sm transition hover:bg-[#2f8f2c]"
            >
              Realizar consulta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8">
        <h2 className="text-center text-[27px] font-extrabold tracking-normal text-[#071d36] sm:text-[34px]">¿Cómo genera Avizor sus recomendaciones?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {processSteps.map(({ Icon, title, text }, index) => (
            <article key={title} className="relative rounded-xl border border-[#dfe7e2] bg-white px-8 py-9 text-center shadow-[0_8px_28px_rgba(7,29,54,0.04)]">
              {index < processSteps.length - 1 && <ArrowRight className="absolute -right-5 top-[74px] z-10 hidden h-9 w-9 text-avizor-green md:block" />}
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#cde6ce] bg-[#f0f8f0] text-avizor-green">
                <Icon className="h-16 w-16" strokeWidth={1.9} />
              </div>
              <div className="mt-7 flex items-center justify-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-avizor-green text-[14px] font-extrabold text-white">{index + 1}</span>
                <h3 className="text-[17px] font-extrabold text-[#071d36]">{title}</h3>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-[#071d36]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-5 px-5 pb-8 sm:px-8 md:grid-cols-3">
        <article className="rounded-xl border border-[#d6e0dc] bg-white p-7 shadow-[0_8px_28px_rgba(7,29,54,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef6ff] text-[#2b75d6]"><CloudRain className="h-6 w-6" /></span>
            <h3 className="text-[21px] font-extrabold sm:text-[24px]">1. Datos climáticos</h3>
          </div>
          <p className="text-[16px] leading-relaxed">Utilizamos variables climáticas de los últimos 14 días:</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-lg border border-[#dfe7e2]">
              {climateVariables.map(({ Icon, label, detail }) => (
                <div key={label} className="flex min-h-[58px] items-center gap-2 border-b border-[#edf1ef] px-3 last:border-b-0">
                  <Icon className="h-5 w-5 shrink-0 text-avizor-green" />
                  <div>
                    <p className="text-[12px] font-extrabold leading-tight">{label}</p>
                    {detail && <p className="text-[10px] leading-tight text-[#52657a]">({detail})</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#dfe7e2] p-3">
              <p className="mb-3 text-center text-[12px] font-extrabold">Fuentes de datos</p>
              <div className="space-y-4">
                {dataSources.map((source) => <SourceLogo key={source.name} source={source} />)}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#d6e0dc] bg-white p-7 shadow-[0_8px_28px_rgba(7,29,54,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef8ef] text-avizor-green"><Leaf className="h-6 w-6" /></span>
            <h3 className="text-[21px] font-extrabold sm:text-[24px]">2. Reglas agronómicas</h3>
          </div>
          <p className="text-[16px] leading-relaxed">Los datos climáticos son evaluados mediante reglas agronómicas basadas en bibliografía técnica y validadas por especialistas.</p>
          <div className="mt-8 rounded-lg border border-[#cde6ce] bg-[linear-gradient(135deg,#f4fbf4,#eef8ee)] p-6">
            <h4 className="text-[20px] font-extrabold text-avizor-green">Ejemplo de regla</h4>
            <div className="mt-6 space-y-4 text-[17px]">
              <p className="flex items-center gap-3"><Check className="h-5 w-5 text-avizor-green" /> Humedad &gt; 80%</p>
              <p className="text-center font-extrabold text-avizor-green">+</p>
              <p className="flex items-center gap-3"><Check className="h-5 w-5 text-avizor-green" /> Lluvias en 3 de los últimos 5 días</p>
              <p className="text-center font-extrabold text-avizor-green">+</p>
              <p className="flex items-center gap-3"><Check className="h-5 w-5 text-avizor-green" /> Temperatura entre 18 y 28 °C</p>
              <p className="pt-2 text-center text-[32px] leading-none text-avizor-green">↓</p>
              <p className="text-[20px] font-extrabold leading-snug text-avizor-green">Condiciones favorables para enfermedades foliares</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#d6e0dc] bg-white p-7 shadow-[0_8px_28px_rgba(7,29,54,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef8ef] text-avizor-green"><Eye className="h-6 w-6" /></span>
            <h3 className="text-[21px] font-extrabold sm:text-[24px]">3. Transparencia del resultado</h3>
          </div>
          <p className="text-[16px] leading-relaxed">Mostramos siempre qué está viendo Avizor para que entiendas por qué se genera cada recomendación.</p>
          <div className="mt-8 rounded-lg border border-[#e5d8bc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#d68100]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2d9]"><Gauge className="h-6 w-6" /></span>
              <h4 className="text-[22px] font-extrabold">Atención recomendada</h4>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-[16px] font-extrabold">¿Qué está viendo Avizor?</p>
              <div className="space-y-3 text-[16px]">
                <p className="flex items-center gap-3"><Droplets className="h-5 w-5 text-avizor-green" /> Humedad media: 82%</p>
                <p className="flex items-center gap-3"><CloudRain className="h-5 w-5 text-avizor-green" /> Lluvias últimos 5 días: 42 mm</p>
                <p className="flex items-center gap-3"><Thermometer className="h-5 w-5 text-avizor-green" /> Temperatura media: 22 °C</p>
              </div>
            </div>
            <div className="mt-6 border-t border-[#edf1ef] pt-5">
              <p className="text-[16px] font-extrabold">Recomendación</p>
              <p className="mt-2 text-[16px] leading-relaxed">Monitorear el lote durante los próximos 5 días.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-7 px-5 py-2 sm:px-8 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-xl border border-[#b9dec1] bg-[linear-gradient(135deg,#fbfffb,#ffffff)] p-8">
          <div className="absolute bottom-5 right-10 opacity-[0.07]"><Sprout className="h-52 w-52 text-avizor-green" /></div>
          <div className="relative flex items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-avizor-green" />
            <h3 className="text-[25px] font-extrabold text-avizor-green">Lo que Avizor ES</h3>
          </div>
          <div className="relative mt-6 space-y-4">
            {isItems.map((item) => (
              <p key={item} className="flex items-start gap-4 text-[17px] leading-relaxed"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-avizor-green text-white"><Check className="h-4 w-4" /></span>{item}</p>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#f0bbb7] bg-[linear-gradient(135deg,#fffafa,#ffffff)] p-8">
          <div className="flex items-center gap-4">
            <XCircle className="h-10 w-10 text-[#d92727]" />
            <h3 className="text-[25px] font-extrabold text-[#d92727]">Lo que Avizor NO ES</h3>
          </div>
          <div className="mt-6 space-y-4">
            {isNotItems.map((item) => (
              <p key={item} className="flex items-start gap-4 text-[17px] leading-relaxed"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d92727] text-white"><X className="h-4 w-4" /></span>{item}</p>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8">
        <article className="grid gap-6 rounded-xl border border-[#cfe3d2] bg-[linear-gradient(135deg,#fbfffb,#ffffff)] p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#cde6ce] bg-[#eef8ef] text-avizor-green"><RefreshCw className="h-11 w-11" /></div>
          <div>
            <h3 className="text-[23px] font-extrabold">Mejora continua</h3>
            <p className="mt-2 text-[17px] leading-relaxed">Las reglas agronómicas utilizadas por Avizor son revisadas y actualizadas periódicamente a medida que incorporamos nueva evidencia, observaciones de campo y validaciones técnicas.</p>
          </div>
          <div className="rounded-lg border border-[#cde6ce] bg-[#edf7ed] px-12 py-6 text-center">
            <p className="text-[16px] font-bold text-avizor-green">Versión actual</p>
            <p className="mt-2 text-[30px] font-extrabold text-avizor-green">v1.0</p>
            <p className="text-[16px]">Junio 2026</p>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 pb-8 pt-3 sm:px-8">
        <h2 className="text-center text-[32px] font-extrabold">Nuestros principios</h2>
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {principles.map(({ Icon, title, text }) => (
            <article key={title} className="flex items-center gap-6 rounded-xl border border-[#dfe7e2] bg-white p-7 shadow-[0_8px_28px_rgba(7,29,54,0.03)]">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#cde6ce] bg-[#eef8ef] text-avizor-green"><Icon className="h-11 w-11" /></div>
              <div>
                <h3 className="text-[19px] font-extrabold text-avizor-green">{title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}










