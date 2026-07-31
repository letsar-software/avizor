import Image from "next/image";
import { BarChart3, BookOpen, Check, CloudRain, Eye, Lightbulb, RefreshCw, Search, ShieldCheck, Signpost, Sprout, UserRound, X } from "lucide-react";
import Accordion from "@/components/Accordion";

const process=[
  {Icon:CloudRain,title:"Datos climáticos",text:"Obtenemos datos de múltiples fuentes confiables."},
  {Icon:BookOpen,title:"Reglas agronómicas",text:"Aplicamos reglas basadas en bibliografía técnica y experiencia."},
  {Icon:BarChart3,title:"Evaluación",text:"Analizamos las condiciones de los últimos 14 días."},
  {Icon:Sprout,title:"Señal y recomendación",text:"Generamos una señal clara y sugerimos cómo actuar."},
];
const readings=[
  {Icon:ShieldCheck,title:"Estado general",text:"Resume el nivel de atención que requieren las condiciones observadas."},
  {Icon:BarChart3,title:"Categorías evaluadas",text:"Muestra el resultado de cada regla agronómica evaluada."},
  {Icon:Eye,title:"Explicación causal",text:"Detalla qué variables coincidieron con cada regla."},
  {Icon:Lightbulb,title:"Recomendación",text:"Sugiere qué observar y cómo continuar el monitoreo."},
];
const principles=[
  {Icon:Search,title:"Basado en evidencia",text:"Tomamos decisiones basadas en datos reales y fuentes confiables."},
  {Icon:ShieldCheck,title:"Claro y simple",text:"Comunicamos de manera comprensible, sin tecnicismos innecesarios."},
  {Icon:Signpost,title:"Siempre orientativo",text:"Brindamos señales para orientar, no certezas absolutas."},
  {Icon:ShieldCheck,title:"Prudente y responsable",text:"Usamos un lenguaje prudente y evitamos alarmas innecesarias."},
  {Icon:Eye,title:"Transparente y verificable",text:"Mostramos cómo llegamos a cada señal y con qué datos trabajamos."},
  {Icon:UserRound,title:"Pensado para el productor",text:"Diseñamos cada funcionalidad pensando en sus necesidades reales."},
];

export default function MethodPage(){return <main className="text-[#081a31]">
  <section className="relative min-h-[410px] overflow-hidden sm:min-h-[360px]"><Image src="/campo-hojas.png" alt="Hojas de soja" fill priority className="object-cover object-[72%_center]"/><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.99)_0%,rgba(255,255,255,.91)_50%,rgba(255,255,255,.15)_88%)]"/><div className="relative mx-auto flex min-h-[410px] max-w-[1180px] items-center px-6 py-10 sm:min-h-[360px] sm:px-8"><header className="max-w-[520px]"><h1 className="text-[38px] font-bold leading-[1.1] sm:text-5xl">Nuestra<br className="sm:hidden"/> metodología</h1><p className="mt-5 text-sm font-bold leading-6 text-[#087b4b]">Datos, ciencia y conocimiento agronómico.</p><p className="mt-4 max-w-[330px] text-sm leading-6 text-[#263a4d] sm:max-w-lg">Avizor combina datos climáticos históricos de alta calidad con reglas agronómicas documentadas y validadas por especialistas para generar señales simples y confiables.</p></header></div></section>
  <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-8">
    <section><h2 className="text-[22px] font-bold">¿Cómo generamos las señales?</h2><div className="mt-7 grid gap-0 md:grid-cols-4 md:gap-5">{process.map(({Icon,title,text},index)=><article key={title} className="relative flex min-h-[118px] gap-5 md:block md:min-h-0 md:text-center"><span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-[#087b4b] md:mx-auto"><Icon className="h-8 w-8"/></span><div><h3 className="pt-3 text-base font-bold md:pt-0 md:mt-4">{title}</h3><p className="mt-2 text-sm leading-6 text-[#405369]">{text}</p></div>{index<process.length-1&&<span className="absolute bottom-0 left-[31px] top-16 border-l border-dashed border-[#42a16b] md:hidden"/>}</article>)}</div></section>
    <section className="mt-9"><h2 className="text-[22px] font-bold">¿Cómo leer los resultados?</h2><div className="mt-5 grid gap-0 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">{readings.map(({Icon,title,text},index)=><Accordion key={title} id={`reading-${index}`} title={title} icon={<Icon className="h-5 w-5"/>}><p>{text}</p></Accordion>)}</div></section>
    <section className="mt-11 grid gap-6 md:grid-cols-2"><article className="rounded-2xl border border-[#b9dec8] bg-[#f7fbf8] p-5"><h2 className="text-xl font-bold text-[#087b4b]">Qué es Avizor</h2>{["Una herramienta de monitoreo ambiental para el productor.","Una herramienta basada en ciencia y evidencia.","Una señal simple para ayudarte a decidir mejor."].map(item=><p key={item} className="mt-5 flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#72be91] text-[#087b4b]"><Check className="h-4 w-4"/></span>{item}</p>)}</article><article className="rounded-2xl border border-red-200 bg-red-50/70 p-5"><h2 className="text-xl font-bold text-red-600">Qué NO es Avizor</h2>{["No diagnostica enfermedades.","No reemplaza al asesor agronómico.","No predice con certeza la aparición de riesgos.","No es una app meteorológica general."].map(item=><p key={item} className="mt-5 flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-500"><X className="h-4 w-4"/></span>{item}</p>)}</article></section>
    <section className="mt-7 flex gap-5 rounded-2xl border border-[#dfe7e3] bg-white p-5 shadow-[0_5px_18px_rgba(8,26,49,.03)]"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-[#087b4b]"><RefreshCw className="h-7 w-7"/></span><div><h2 className="text-lg font-bold">Mejora continua</h2><p className="mt-2 text-sm leading-6 text-[#405369]">Revisamos y actualizamos nuestras reglas y fuentes de datos en forma periódica para seguir brindando información confiable y relevante.</p></div></section>
    <section className="mt-10"><h2 className="text-[22px] font-bold">Principios que nos guían</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{principles.map(({Icon,title,text})=><article key={title} className="relative flex min-h-[112px] gap-4 overflow-hidden rounded-xl border bg-white p-4 pl-5 shadow-[0_5px_18px_rgba(8,26,49,.04)] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#14945a]"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-[#087b4b]"><Icon className="h-7 w-7"/></span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-sm leading-5 text-[#405369]">{text}</p></div></article>)}</div></section>
  </div>
</main>}
