import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Cpu,
  Database,
  Leaf,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Sprout,
  UserRoundCheck,
} from "lucide-react";
import { ScopeDisclaimer } from "@/components/PublicPage";

const principles = [
  { Icon: BookOpen, title: "Basado en ciencia", text: "Reglas construidas a partir de bibliografía técnica y validadas por profesionales." },
  { Icon: Lightbulb, title: "Claro y simple", text: "Señales fáciles de entender para tomar mejores decisiones." },
  { Icon: UserRoundCheck, title: "Siempre orientativo", text: "No reemplaza el asesoramiento profesional ni la evaluación del lote." },
];

const people = [
  {
    image: "/sobre-avizor-andrea.svg",
    name: "Andrea",
    role: "Producto · IA · Desarrollo",
    text: "Creadora de Avizor. Lidera el diseño del producto, define la metodología funcional y participa activamente en el desarrollo de la plataforma y en la integración de inteligencia artificial para transformar datos complejos en herramientas simples y útiles.",
  },
  {
    image: "/sobre-avizor-ezequiel.svg",
    name: "Ezequiel",
    role: "Arquitectura · Agentes de IA",
    text: "Especialista en desarrollo de software y agentes de inteligencia artificial. Responsable de la arquitectura técnica, el backend y la construcción de los componentes de IA que permiten que Avizor evolucione.",
  },
  {
    image: "/sobre-avizor-natali.svg",
    name: "Natali",
    role: "Validación técnica agronómica",
    text: "Ingeniera Agrónoma del Laboratorio Agropecuario Horizonte. Colabora en la validación técnica de las reglas agronómicas, revisando umbrales y criterios para asegurar que cada recomendación esté respaldada por conocimiento agronómico actualizado.",
  },
];

const disciplines = [
  { Icon: Sprout, label: "Agro" },
  { Icon: Cpu, label: "Tecnología" },
  { Icon: ShieldCheck, label: "Calidad de software" },
  { Icon: BarChart3, label: "Datos" },
  { Icon: Leaf, label: "Producto" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8 text-[#081a31] sm:px-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#087b4b]">Sobre Avizor</p>
          <h1 className="mt-4 max-w-[530px] text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
            Tecnología y conocimiento<br className="hidden sm:block" /> al servicio del productor
          </h1>
          <span className="mt-6 block h-0.5 w-12 bg-[#168c50]" />
          <p className="mt-7 max-w-[530px] text-sm leading-7 text-[#405369]">
            Avizor nació para acercar información climática y conocimiento agronómico de forma simple, clara y confiable.
          </p>
          <p className="mt-5 max-w-[560px] text-sm leading-7 text-[#405369]">
            Nuestro objetivo es ayudarte a tomar decisiones informadas observando las condiciones ambientales que pueden coincidir con reglas documentadas.
          </p>
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-2xl sm:min-h-[360px]">
          <Image src="/campo-hojas.png" alt="Cultivo de soja al amanecer" fill priority className="object-cover object-center" sizes="(min-width: 1024px) 540px, 100vw" />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Principios de Avizor">
        {principles.map(({ Icon, title, text }) => (
          <article key={title} className="flex gap-4 rounded-xl border border-[#e0e8e3] bg-white p-5 shadow-[0_5px_18px_rgba(8,26,49,.025)]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf7f0] text-[#087b4b]"><Icon className="h-6 w-6" /></span>
            <div><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 text-xs leading-6 text-[#405369]">{text}</p></div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-[#dfe8e2] bg-[linear-gradient(135deg,#f8fbf8,#f2f7f3)] p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Detrás de Avizor</h2>
        <p className="mt-2 text-sm font-semibold text-[#087b4b]">Tecnología, inteligencia artificial y agronomía trabajando juntas.</p>
        <div className="mt-7 grid gap-7 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div className="flex items-center justify-center border-b border-[#d9e5dd] pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
            <Image src="/sobre-avizor-lab.svg" alt="Tecnología y monitoreo agrícola de Avizor" width={430} height={386} className="h-auto w-full max-w-[270px]" />
          </div>
          {people.map((person) => (
            <article key={person.name} className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Image src={person.image} alt={`Ilustración de ${person.name}`} width={112} height={112} className="h-24 w-24" />
              <h3 className="mt-4 text-base font-bold">{person.name}</h3>
              <p className="mt-1 text-xs font-bold text-[#087b4b]">{person.role}</p>
              <p className="mt-3 text-xs leading-6 text-[#405369]">{person.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#d9e5dd] pt-6 sm:grid-cols-5">
          {disciplines.map(({ Icon, label }) => <div key={label} className="flex items-center justify-center gap-2 text-xs font-bold text-[#087b4b]"><Icon className="h-5 w-5" />{label}</div>)}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#e0e8e3] bg-white p-6 sm:p-8">
        <div className="grid gap-7 md:grid-cols-[1.35fr_repeat(3,.65fr)] md:items-center">
          <div>
            <h2 className="text-xl font-bold">El proyecto</h2>
            <p className="mt-3 text-sm leading-7 text-[#405369]">Avizor es un proyecto en crecimiento continuo. Combinamos datos climáticos de múltiples fuentes, reglas agronómicas validadas y tecnología para generar señales accionables que te ayuden a anticiparte.</p>
          </div>
          <ProjectMetric Icon={CalendarDays} value="2026" label="Año de inicio" />
          <ProjectMetric Icon={MapPin} value="+150" label="Localidades cubiertas" />
          <ProjectMetric Icon={Leaf} value="1" label="Cultivo disponible (Soja)" />
        </div>
      </section>

      <ScopeDisclaimer />
    </main>
  );
}

function ProjectMetric({ Icon, value, label }: { Icon: typeof Database; value: string; label: string }) {
  return (
    <div className="border-t border-[#e3eae6] pt-5 text-center md:border-l md:border-t-0 md:pl-5 md:pt-0">
      <Icon className="mx-auto h-8 w-8 text-[#087b4b]" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#405369]">{label}</p>
    </div>
  );
}
