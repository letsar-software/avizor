import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CloudSun, Database, MapPin, Search, ShieldCheck } from "lucide-react";

const benefits = [
  { Icon: Search, title: "Anticipar qué mirar", description: "Detectá condiciones que merecen atención antes de recorrer el lote." },
  { Icon: CloudSun, title: "Entender el clima aplicado a tu cultivo", description: "No veas solamente temperatura o lluvia: entendé qué pueden significar esas condiciones para tu cultivo." },
  { Icon: MapPin, title: "Priorizar el monitoreo", description: "Identificá qué situaciones conviene observar con mayor atención." },
  { Icon: BarChart3, title: "Decidir con más contexto", description: "Recibí una señal clara, entendé qué la genera y conocé qué conviene observar." },
];

const steps = [
  { title: "Ingresás tu ubicación y cultivo", description: "Indicás dónde está tu cultivo y qué estás produciendo." },
  { title: "Analizamos las condiciones ambientales", description: "Avizor analiza los datos recientes y su evolución." },
  { title: "Aplicamos criterios agronómicos validados", description: "Evaluamos las condiciones utilizando reglas revisadas por especialistas." },
  { title: "Recibís una señal clara", description: "Te mostramos qué merece atención, por qué y qué conviene observar en el lote." },
];

const values = [
  { Icon: CloudSun, label: "Datos climáticos de calidad" },
  { Icon: BookOpen, label: "Reglas agronómicas validadas" },
  { Icon: ShieldCheck, label: "Metodología transparente" },
  { Icon: Database, label: "Información simple y accionable" },
];

export default function HomeLanding() {
  return <main className="text-[#081a31]">
    <section className="relative min-h-[610px] overflow-hidden sm:min-h-[540px]">
      <Image src="/campo-hojas.png" alt="Cultivo de soja al amanecer" fill priority className="object-cover object-[68%_center]"/>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.98)_0%,rgba(255,255,255,.90)_52%,rgba(255,255,255,.10)_86%)] sm:bg-[linear-gradient(90deg,rgba(255,255,255,.98)_0%,rgba(255,255,255,.93)_48%,rgba(255,255,255,.08)_76%)]"/>
      <div className="relative mx-auto flex min-h-[610px] max-w-[1440px] items-center px-5 py-10 sm:min-h-[540px] sm:px-8 sm:py-12 lg:px-14">
        <div className="w-full max-w-[620px]">
          <h1 className="text-[40px] font-bold leading-[1.08] tracking-tight sm:text-5xl">La señal<br/>antes del problema.</h1>
          <p className="mt-5 max-w-[540px] text-lg font-semibold leading-7 text-[#152c40] sm:text-xl sm:leading-8">Identificá qué condiciones merecen atención en tu cultivo.</p>
          <p className="mt-3 max-w-[580px] text-sm leading-6 text-[#263a4d]">Ingresá tu localidad y cultivo. Avizor analiza las condiciones ambientales recientes y te muestra de forma simple qué factores conviene observar, por qué y qué podés hacer.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href="/consultar" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#087b4b] px-6 text-sm font-bold text-white">Realizar una consulta</Link><Link href="/metodologia" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#53ad7b] bg-white/90 px-6 text-sm font-bold text-[#087b4b]">Cómo funciona</Link></div>
          <p className="mt-5 max-w-[580px] border-l-2 border-[#53ad7b] pl-3 text-xs leading-5 text-[#4c5e6d]">Avizor identifica condiciones ambientales que pueden favorecer determinados riesgos agrícolas. No diagnostica ni reemplaza el asesoramiento agronómico.</p>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-14">
      <h2 className="text-[22px] font-bold">¿Para qué te sirve Avizor?</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ Icon, title, description }) => <article key={title} className="rounded-xl border border-[#dfe6e2] bg-white p-5 shadow-[0_3px_10px_rgba(8,26,49,.03)]"><Icon className="h-7 w-7 text-[#2886c2]"/><h3 className="mt-4 text-sm font-bold leading-5">{title}</h3><p className="mt-2 text-sm leading-5 text-[#4c5e6d]">{description}</p></article>)}</div>
    </section>

    <section className="bg-white sm:border-y sm:bg-[#fafcfb]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-14">
        <h2 className="text-[22px] font-bold">¿Cómo funciona Avizor?</h2>
        <div className="mt-6 space-y-0 md:hidden">{steps.map((step, index) => <article key={step.title} className="relative grid min-h-[104px] grid-cols-[32px_1fr] items-start gap-4"><span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#087b4b] text-sm font-bold text-white">{index + 1}</span><div className="pt-1"><h3 className="text-sm font-bold leading-5">{step.title}</h3><p className="mt-1 text-xs leading-5 text-[#526477]">{step.description}</p></div>{index < 3 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-[#b9ddc8]"/>}</article>)}</div>
        <div className="mt-6 hidden grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start gap-x-4 md:grid lg:gap-x-6">{steps.map((step, index) => <div className="contents" key={step.title}><article className="grid grid-cols-[32px_1fr] items-start gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#087b4b] text-sm font-bold text-white">{index + 1}</span><div><h3 className="text-sm font-bold leading-5">{step.title}</h3><p className="mt-2 text-xs leading-5 text-[#526477]">{step.description}</p></div></article>{index < 3 && <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true"><ArrowRight className="h-5 w-5 text-[#76b28f]"/></span>}</div>)}</div>
        <p className="mt-7 border-t border-[#dfe8e2] pt-5 text-center text-sm font-semibold leading-6 text-[#087b4b]">Avizor transforma datos ambientales en información útil para ayudarte a decidir dónde poner la atención.</p>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-14"><div className="rounded-2xl border border-[#cfe1d6] bg-[#f8fbf9] p-5 sm:p-6"><h2 className="text-xl font-bold">Tecnología + conocimiento agronómico</h2><p className="mt-3 max-w-none text-sm leading-6 text-[#263a4d] lg:whitespace-nowrap">Combinamos datos climáticos de múltiples fuentes con reglas agronómicas validadas por especialistas para generar señales confiables y útiles.</p><div className="mt-5 grid gap-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">{values.map(({ Icon, label }) => <div key={label} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#dfe8e2] bg-white px-4 text-sm font-semibold"><Icon className="h-5 w-5 shrink-0 text-[#087b4b]"/>{label}</div>)}</div></div></section>
  </main>;
}
