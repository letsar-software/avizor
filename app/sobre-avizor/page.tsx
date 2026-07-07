import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  FileText,
  Leaf,
  MessageCircle,
  Monitor,
  RadioTower,
  Rocket,
  ShieldCheck,
  Sprout,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre Avizor · Avizor",
  description: "Conocé Avizor, la señal antes del problema.",
};

const producerSources: { Icon: LucideIcon; label: string }[] = [
  { Icon: CloudRain, label: "Clima" },
  { Icon: MessageCircle, label: "WhatsApp" },
  { Icon: UserRound, label: "Asesor" },
  { Icon: FileText, label: "Noticias" },
  { Icon: CalendarDays, label: "Planillas" },
];

const answerPoints = [
  "Una única señal clara y simple.",
  "Basada en datos reales y reglas agronómicas.",
  "Explicamos por qué llegamos a cada resultado.",
  "Te ayudamos a decidir dónde poner el foco.",
];

const processSteps: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: CloudRain,
    title: "Datos climáticos",
    text: "Obtenemos datos históricos de los últimos 14 días para tu localidad.",
  },
  {
    Icon: Sprout,
    title: "Reglas agronómicas",
    text: "Aplicamos reglas técnicas basadas en bibliografía y validadas por especialistas.",
  },
  {
    Icon: RadioTower,
    title: "Motor de evaluación",
    text: "Nuestro motor analiza las condiciones y calcula el nivel de riesgo por cada categoría.",
  },
  {
    Icon: ClipboardCheck,
    title: "Recomendación simple",
    text: "Recibís un estado general, las causas y una recomendación concreta para monitorear tu cultivo.",
  },
];

const teamMembers: { image: string; name: string; role: string; bio: string }[] = [
  {
    image: "/sobre-avizor-andrea.svg",
    name: "Andrea",
    role: "Producto · IA · Desarrollo",
    bio: "Creadora de Avizor. Lidera el diseño del producto, define la metodología funcional y participa activamente en el desarrollo de la plataforma y en la integración de inteligencia artificial para transformar datos complejos en herramientas simples y útiles.",
  },
  {
    image: "/sobre-avizor-ezequiel.svg",
    name: "Ezequiel",
    role: "Arquitectura · Agentes de IA",
    bio: "Especialista en desarrollo de software y agentes de inteligencia artificial. Responsable de la arquitectura técnica, el backend y la construcción de los componentes de IA que permiten que Avizor evolucione.",
  },
  {
    image: "/sobre-avizor-natali.svg",
    name: "Ing. Agr. Natali",
    role: "Validación técnica agronómica",
    bio: "Ingeniera Agrónoma del Laboratorio Agropecuario Horizonte. Colabora en la validación técnica de las reglas agronómicas, revisando umbrales y criterios para asegurar que cada recomendación esté respaldada por conocimiento agronómico actualizado.",
  },
];

const teamTags: { Icon: LucideIcon; label: string }[] = [
  { Icon: Sprout, label: "Agro" },
  { Icon: Monitor, label: "Tecnología" },
  { Icon: ShieldCheck, label: "Calidad de software" },
  { Icon: BarChart3, label: "Datos" },
  { Icon: Rocket, label: "Producto" },
];

const roadmap: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Sprout, title: "Hoy - MVP", text: "Señales simples y recomendaciones básicas para soja." },
  { Icon: RadioTower, title: "Alertas inteligentes", text: "Notificaciones automáticas cuando las condiciones ameriten atención." },
  { Icon: UsersRound, title: "Dashboard para asesores", text: "Herramientas para monitorear múltiples lotes y compartir información." },
  { Icon: Leaf, title: "Más cultivos", text: "Incorporación de nuevos cultivos y más variables relevantes." },
];

const principles: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: ShieldCheck, title: "Transparencia", text: "Mostramos cómo llegamos a cada resultado." },
  { Icon: FileText, title: "Basado en evidencia", text: "Cada recomendación surge de datos reales y reglas técnicas validadas." },
  { Icon: UserRound, title: "Responsable", text: "La tecnología acompaña al productor, no reemplaza su experiencia." },
];

export default function SobreAvizorPage() {
  return (
    <main className="bg-white text-[#071d36]">
      <section className="relative min-h-[520px] overflow-hidden border-b border-[#dfe8df]">
        <Image src="/campo-hojas.png" alt="Cultivo de soja al amanecer" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.90)_35%,rgba(255,255,255,0.36)_62%,rgba(255,255,255,0.04)_100%)]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-[1320px] items-center px-8 py-16">
          <div className="max-w-[600px]">
            <p className="mb-3 text-[24px] font-extrabold tracking-wide text-avizor-green">AVIZOR</p>
            <h1 className="text-[56px] font-extrabold leading-[0.96] tracking-normal text-[#071d36] md:text-[72px]">
              La <span className="text-avizor-green">señal</span> antes del problema.
            </h1>
            <p className="mt-6 max-w-[540px] text-[20px] leading-[1.55] text-[#071d36]">
              Ayudamos a productores y asesores a entender mejor las condiciones ambientales para tomar decisiones con más información y menos incertidumbre.
            </p>
            <div className="mt-8 flex max-w-[520px] items-start gap-4 text-[18px] leading-relaxed text-[#071d36]">
              <Target className="mt-1 h-8 w-8 shrink-0 text-avizor-green" />
              <p>Democratizar el acceso a información agrícola clara, simple y basada en evidencia.</p>
            </div>
            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-3 rounded-lg bg-avizor-green px-8 py-4 text-[17px] font-extrabold text-white shadow-sm transition hover:bg-[#246b2c]"
            >
              Hacer una consulta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 py-10 md:py-12">
        <h2 className="text-center text-[35px] font-extrabold tracking-normal text-[#071d36]">El problema y nuestra respuesta</h2>
        <div className="relative mt-7 grid gap-9 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-xl border border-[#f0cbc7] bg-[linear-gradient(135deg,#fff8f6,#ffffff)] p-8">
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffe9e7] text-[#d71919]">
                <span className="text-[32px] font-extrabold leading-none">?</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[25px] font-extrabold text-[#d71919]">El productor hoy</h3>
                <p className="mt-3 text-[16px] text-[#071d36]">Consulta múltiples fuentes desconectadas:</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-5 gap-4 text-center">
              {producerSources.map(({ Icon, label }) => (
                <div key={label} className="min-w-0">
                  <Icon className="mx-auto h-9 w-9 text-[#0c6f3d]" />
                  <p className="mt-3 text-[14px] font-medium text-[#071d36]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[17px] text-[#071d36]">Y aun así sigue preguntándose:</p>
            <div className="mt-3 rounded-md border border-[#f1c9c4] bg-[#fff4f2] px-4 py-3 text-center text-[18px] font-extrabold text-[#d71919]">
              ¿Debo preocuparme hoy por mi cultivo?
            </div>
          </article>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-72 -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:flex">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#e0e8de] bg-white shadow-[0_8px_28px_rgba(7,29,54,0.12)]">
              <ArrowRight className="h-9 w-9 text-avizor-green" />
            </div>
          </div>

          <article className="rounded-xl border border-[#cde5ce] bg-[linear-gradient(135deg,#fbfffb,#ffffff)] p-8 lg:pl-12">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-avizor-green text-white">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="text-[25px] font-extrabold text-[#137530]">La propuesta de Avizor</h3>
            </div>
            <div className="mt-8 space-y-6">
              {answerPoints.map((point) => (
                <div key={point} className="flex items-start gap-4">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 fill-[#137530] text-white" />
                  <p className="text-[18px] leading-relaxed text-[#071d36]">{point}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1220px] px-8 py-4 md:py-6">
        <h2 className="text-center text-[35px] font-extrabold tracking-normal text-[#071d36]">Cómo funciona Avizor</h2>
        <p className="mt-2 text-center text-[17px] text-[#071d36]">Transformamos datos climáticos en señales simples para ayudarte a decidir mejor.</p>
        <div className="mt-8 grid gap-8 md:grid-cols-4">
          {processSteps.map(({ Icon, title, text }, index) => (
            <div key={title} className="relative text-center md:text-left">
              {index < processSteps.length - 1 && (
                <div className="absolute left-[66%] top-[44px] hidden w-[62%] border-t-2 border-dotted border-avizor-green md:block" />
              )}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#cae3ca] bg-[#eff8ef] text-avizor-green md:mx-0 md:ml-8">
                <Icon className="h-14 w-14" strokeWidth={1.8} />
              </div>
              <div className="mt-5 flex items-start justify-center gap-3 md:justify-start">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avizor-green text-[14px] font-extrabold text-white">{index + 1}</span>
                <div>
                  <h3 className="text-[17px] font-extrabold leading-tight text-[#071d36]">{title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#071d36]">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 py-8">
        <article className="grid items-center gap-8 rounded-xl border border-[#cfe1d4] bg-white px-6 py-8 shadow-[0_10px_35px_rgba(7,29,54,0.04)] lg:grid-cols-[430px_1fr] lg:px-7 lg:py-9">
          <div className="relative mx-auto aspect-[430/386] w-full max-w-[430px]">
            <Image
              src="/sobre-avizor-lab.svg"
              alt="Estación meteorológica, cultivo y panel de Avizor"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 430px"
            />
          </div>
          <div className="min-w-0 px-1 py-1 lg:px-3">
            <h2 className="text-center text-[29px] font-extrabold leading-tight text-[#071d36] lg:text-left">Detrás de Avizor</h2>
            <h3 className="mt-2 text-center text-[15px] font-extrabold text-avizor-green lg:text-left">
              Tecnología, inteligencia artificial y agronomía trabajando juntas.
            </h3>
            <div className="mt-6 grid gap-7 md:grid-cols-3 lg:gap-8">
              {teamMembers.map(({ image, name, role, bio }) => (
                <div key={name} className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="relative h-[136px] w-[136px] overflow-hidden rounded-full border border-[#cfe3cf] bg-[#eef7ec]">
                    <Image src={image} alt={name} fill className="object-cover" sizes="136px" />
                  </div>
                  <h4 className="mt-4 text-[17px] font-extrabold leading-tight text-[#071d36]">{name}</h4>
                  <p className="mt-1 text-[14px] font-extrabold leading-snug text-avizor-green">{role}</p>
                  <p className="mt-3 text-[13px] leading-[1.65] text-[#071d36]">{bio}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-[#cfded3] pt-6 sm:grid-cols-5">
              {teamTags.map(({ Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2 text-[13px] font-semibold text-[#0c6f3d] sm:justify-start">
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[1220px] px-8 py-6">
        <h2 className="text-center text-[31px] font-extrabold text-[#071d36]">Hacia dónde vamos</h2>
        <div className="relative mt-9 grid gap-8 md:grid-cols-4">
          <div className="absolute left-[10%] right-[10%] top-[32px] hidden border-t-2 border-avizor-green/60 md:block" />
          {roadmap.map(({ Icon, title, text }) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#cae3ca] bg-[#eff8ef] text-avizor-green">
                <Icon className="h-10 w-10" strokeWidth={1.8} />
              </div>
              <h3 className="mt-3 text-[16px] font-extrabold text-[#071d36]">{title}</h3>
              <p className="mx-auto mt-2 max-w-[210px] text-[14px] leading-relaxed text-[#071d36]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 pb-4 pt-2">
        <h2 className="text-center text-[27px] font-extrabold text-[#071d36]">Nuestros principios</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {principles.map(({ Icon, title, text }) => (
            <article key={title} className="flex items-center gap-5 rounded-lg border border-[#d9e2dc] bg-white p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#cae3ca] bg-[#eff8ef] text-avizor-green">
                <Icon className="h-10 w-10" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-[#137530]">{title}</h3>
                <p className="mt-1 text-[14px] leading-snug text-[#071d36]">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}




