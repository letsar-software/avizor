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

const andreaTags: { Icon: LucideIcon; label: string }[] = [
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
        <article className="grid gap-9 rounded-xl border border-[#d9e2dc] bg-white p-4 shadow-[0_10px_35px_rgba(7,29,54,0.05)] md:grid-cols-[380px_1fr] md:p-5">
          <div className="relative min-h-[320px] overflow-hidden rounded-lg md:min-h-[360px]">
            <Image src="/Andrea.jpg" alt="Andrea, creadora de Avizor" fill priority className="object-cover object-center" sizes="(max-width: 768px) 100vw, 380px" />
          </div>
          <div className="px-2 py-3 md:px-4">
            <h2 className="text-[29px] font-extrabold text-[#071d36]">Detrás de Avizor</h2>
            <h3 className="mt-1 text-[31px] font-extrabold text-avizor-green">Hola, soy Andrea 🌿</h3>
            <div className="mt-4 max-w-[770px] space-y-2 text-[17px] leading-[1.45] text-[#071d36]">
              <p>Soy Técnica Superior en Administración Agropecuaria y Analista Programadora en Desarrollo de Aplicaciones.</p>
              <p>Durante años trabajé tanto en tecnología como en el sector agropecuario y siempre observé el mismo problema: mucha información disponible, pero pocas herramientas que la transformen en decisiones simples.</p>
              <p>Creé Avizor con la convicción de que la tecnología debe acompañar al productor, no reemplazarlo.</p>
              <p>Mi objetivo es acercar información clara, basada en evidencia y fácil de interpretar para ayudar a tomar mejores decisiones en el campo.</p>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[#e6eee8] pt-5 sm:grid-cols-5">
              {andreaTags.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-[14px] font-semibold text-[#0c6f3d]">
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




