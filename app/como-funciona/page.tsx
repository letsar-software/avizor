import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Droplets,
  HelpCircle,
  Info,
  Leaf,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Share2,
  Sprout,
  Thermometer,
  UserRound,
  Wind,
  X,
} from "lucide-react";

const processSteps = [
  {
    number: "1",
    title: "Ingresás tu localidad",
    text: "Indicás la localidad y el cultivo que querés consultar.",
    Icon: MapPinned,
  },
  {
    number: "2",
    title: "Analizamos el clima reciente",
    text: "Avizor recopila datos climáticos históricos de los últimos 14 días.",
    Icon: CloudRain,
  },
  {
    number: "3",
    title: "Aplicamos reglas agronómicas",
    text: "Las condiciones climáticas se comparan con reglas técnicas basadas en bibliografía y validadas por especialistas.",
    Icon: Sprout,
  },
  {
    number: "4",
    title: "Recibís un resultado simple",
    text: "Obtenés un estado general, las causas detectadas y recomendaciones de monitoreo.",
    Icon: BarChart3,
  },
];

const dataItems = [
  { title: "Temperatura", text: "Media, máxima y mínima", Icon: Thermometer },
  { title: "Humedad relativa", text: "Promedio diario de humedad", Icon: Droplets },
  { title: "Precipitaciones", text: "Acumuladas en milímetros", Icon: CloudRain },
  { title: "Viento", text: "Velocidad media diaria", Icon: Wind },
  { title: "Días consecutivos con lluvia", text: "Cálculo interno", Icon: CalendarDays },
];

const metrics = [
  { label: "Humedad promedio", value: "82 %", Icon: Droplets },
  { label: "Lluvias últimos 5 días", value: "42 mm", Icon: CloudRain },
  { label: "Temperatura media", value: "22 °C", Icon: Thermometer },
  { label: "Viento medio", value: "12 km/h", Icon: Wind },
  { label: "Días consecutivos con lluvia", value: "3 días", Icon: CalendarDays },
];

const noHace = [
  ["No diagnostica enfermedades", "Avizor no identifica enfermedades ni plagas en el cultivo."],
  ["No predice con certeza", "No garantiza que un evento vaya a ocurrir."],
  ["No reemplaza al asesor agronómico", "Las decisiones deben tomarse junto a tu asesor y con observación de campo."],
  ["No sustituye recorridas a campo", "La información de Avizor debe complementarse con monitoreo presencial."],
  ["No es una aplicación meteorológica", "No reemplaza las apps del clima ni su propósito es el pronóstico."],
];

const faqs = [
  { title: "¿Necesito crear una cuenta?", text: "No. Podés realizar consultas sin registrarte.", Icon: UserRound },
  { title: "¿Qué cultivos están disponibles?", text: "Actualmente el MVP está disponible para soja.", Icon: Leaf },
  { title: "¿Cada cuánto se actualizan los datos?", text: "Los datos climáticos se actualizan periódicamente para reflejar las condiciones recientes.", Icon: RefreshCw },
  { title: "¿Puedo compartir los resultados?", text: "Sí. Los resultados pueden compartirse fácilmente por WhatsApp o mediante un enlace permanente.", Icon: Share2 },
];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-[23px] font-extrabold leading-tight text-[#071322]">{title}</h2>
      {subtitle && <p className="mt-1 text-[14px] font-medium text-[#1b2b38]">{subtitle}</p>}
    </div>
  );
}

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-white text-[#071322]">
      <section className="relative overflow-hidden border-b border-[#e5ebe6]">
        <div className="absolute inset-0">
          <Image
            src="/campo-hojas.png"
            alt="Campo de soja iluminado por el sol"
            fill
            priority
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/12" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/45" />
        </div>

        <div className="relative mx-auto flex min-h-[420px] max-w-[1320px] items-center px-8 py-12">
          <div className="max-w-[560px]">
            <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#071322]">
              ¿Cómo funciona <span className="text-avizor-green">Avizor?</span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[14px] font-medium leading-relaxed text-[#102333]">
              Avizor analiza las condiciones climáticas recientes y las traduce en señales simples para ayudarte a decidir dónde poner el foco de monitoreo.
            </p>

            <div className="mt-5 flex max-w-[510px] items-start gap-4 rounded-lg border border-[#cfe3d2] bg-white/70 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#eaf6eb] text-avizor-green">
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <p className="text-[13px] font-medium leading-relaxed text-[#132c3c]">
                No reemplaza al asesor agronómico ni realiza diagnósticos. Su objetivo es ayudarte a identificar situaciones que merecen atención.
              </p>
            </div>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-3 rounded-lg bg-avizor-green px-7 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-green-900/15 transition-colors hover:bg-[#256427]"
            >
              <ClipboardList size={18} strokeWidth={2} /> Realizar consulta <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-8 py-14">
        <SectionTitle title="El proceso en 4 pasos" subtitle="Así es como Avizor transforma datos en información útil para vos." />

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-4">
          {processSteps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < processSteps.length - 1 && (
                <ArrowRight className="absolute right-[-34px] top-[88px] hidden text-avizor-green md:block" size={42} strokeWidth={1.6} />
              )}
              <article className="min-h-[245px] rounded-lg border border-[#dce5df] bg-white p-5 shadow-[0_8px_28px_rgba(18,44,36,0.10)]">
                <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#eaf6eb] text-avizor-green">
                  <step.Icon size={34} strokeWidth={1.8} />
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-avizor-green text-[16px] font-extrabold text-white">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-extrabold leading-tight text-[#071322]">{step.title}</h3>
                    <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#1b2b38]">{step.text}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-8 py-8">
        <div className="rounded-xl bg-white px-8 py-10 shadow-[0_10px_36px_rgba(18,44,36,0.06)]">
          <SectionTitle title="¿Qué datos utiliza Avizor?" subtitle="Trabajamos con datos climáticos confiables y actualizados." />

          <div className="mt-9 grid grid-cols-1 divide-y divide-[#dfe7e2] md:grid-cols-5 md:divide-x md:divide-y-0">
            {dataItems.map((item) => (
              <div key={item.title} className="px-5 py-5 text-center">
                <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#99d0a3] bg-[#f0faf1] text-avizor-green">
                  <item.Icon size={31} strokeWidth={1.65} />
                </div>
                <h3 className="mt-3 text-[13px] font-extrabold leading-tight text-[#071322]">{item.title}</h3>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#1b2b38]">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-[#cfe3d2] bg-[#f4fbf4] px-5 py-2.5 text-center text-[11px] font-medium text-[#17324a]">
            <Info size={18} className="flex-shrink-0 text-avizor-green" />
            Los datos meteorológicos son obtenidos de proveedores climáticos especializados y procesados por Avizor para generar la evaluación.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 px-8 py-12 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <h2 className="text-[23px] font-extrabold leading-tight text-[#071322]">¿Qué está viendo Avizor?</h2>
          <p className="mt-2 text-[15px] font-medium text-[#1b2b38]">Ejemplo de cómo se construye un resultado.</p>

          <div className="mt-3 overflow-hidden rounded-lg border border-[#dce5df] bg-white shadow-sm">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex h-[40px] items-center justify-between border-b border-[#e4ebe6] px-5 last:border-b-0">
                <div className="flex items-center gap-4">
                  <metric.Icon size={20} strokeWidth={1.8} className="text-[#1f63ae]" />
                  <span className="text-[13px] font-medium text-[#071322]">{metric.label}</span>
                </div>
                <span className="text-[16px] font-extrabold text-avizor-green">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#fff6d9] p-4 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#ffe6a7] text-[#d69016]">
              <AlertTriangle size={30} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[23px] font-extrabold text-[#d08110]">Atención recomendada</h2>
              <p className="mt-2 text-[14px] font-medium leading-snug text-[#071322]">
                Condiciones moderadas para enfermedades foliares.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-4 rounded-lg border border-[#ead9a9] bg-white/45 p-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#dff4df] text-avizor-green">
                <ClipboardList size={24} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-[#071322]">Recomendación</h3>
                <p className="mt-2 text-[14px] font-medium leading-snug text-[#071322]">Monitorear el lote durante los próximos 5 días.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-[#ead9a9] bg-white/45 p-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#dff4df] text-avizor-green">
                <ShieldCheck size={25} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-[#071322]">Confianza</h3>
                <p className="mt-2 text-[13px] font-medium leading-snug text-[#071322]">Basado en 14 días completos de datos climáticos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-8 py-12">
        <SectionTitle title="Lo que Avizor NO hace" />

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {noHace.map(([title, text]) => (
            <article key={title} className="rounded-lg border border-[#dce5df] bg-white p-3 text-center shadow-sm">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#df4048] text-white">
                <X size={24} strokeWidth={3} />
              </div>
              <h3 className="mt-3 text-[13px] font-extrabold leading-tight text-[#071322]">{title}</h3>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#1b2b38]">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 rounded-lg border border-[#f0b7b7] bg-[#ffe8e8] px-5 py-3 text-center text-[13px] font-medium leading-relaxed text-[#ad101b]">
          <AlertTriangle size={22} strokeWidth={1.8} />
          Avizor identifica condiciones que pueden favorecer determinados riesgos agrícolas, pero las decisiones deben complementarse con observaciones de campo y criterio profesional.
        </div>
      </section>

      <section id="preguntas" className="mx-auto max-w-[1160px] px-8 py-14">
        <SectionTitle title="Preguntas frecuentes" />
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          {faqs.map((faq) => (
            <article key={faq.title} className="rounded-lg border border-[#dce5df] bg-white p-4 shadow-sm">
              <faq.Icon size={34} strokeWidth={1.8} className="text-avizor-green" />
              <h3 className="mt-3 text-[13px] font-extrabold leading-tight text-[#071322]">{faq.title}</h3>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#1b2b38]">{faq.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}




