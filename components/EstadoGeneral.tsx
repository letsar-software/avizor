import { AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

export type EstadoType = "atencion" | "monitoreo" | "ok";

function PlantSignalIllustration() {
  return (
    <div className="opacity-20 flex-shrink-0 hidden sm:block">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="40" y1="70" x2="40" y2="35" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 50 Q25 40 22 25 Q35 28 40 42" fill="#2E7D32" />
        <path d="M40 45 Q55 35 58 20 Q45 23 40 37" fill="#4CAF50" />
        <path d="M25 30 Q40 15 55 30" stroke="#2E7D32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 24 Q40 12 50 24" stroke="#2E7D32" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="32" r="3" fill="#2E7D32" />
        <path d="M28 70 Q40 65 52 70" stroke="#2E7D32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const CONFIG = {
  atencion: {
    Icon: AlertTriangle,
    iconClass: "text-amber-500",
    label: "Atención recomendada",
    desc: "Las condiciones actuales merecen atención.",
    bgClass: "bg-orange-50 border-orange-100",
    titleClass: "text-orange-800",
  },
  monitoreo: {
    Icon: TrendingUp,
    iconClass: "text-blue-500",
    label: "Monitoreo preventivo sugerido",
    desc: "Las condiciones sugieren mantener vigilancia.",
    bgClass: "bg-blue-50 border-blue-100",
    titleClass: "text-blue-800",
  },
  ok: {
    Icon: CheckCircle,
    iconClass: "text-avizor-green",
    label: "Sin alertas activas",
    desc: "Las condiciones no presentan riesgo elevado.",
    bgClass: "bg-green-50 border-green-100",
    titleClass: "text-green-800",
  },
};

export default function EstadoGeneral({ estado }: { estado: EstadoType }) {
  const c = CONFIG[estado];

  return (
    <div className={`${c.bgClass} border rounded-xl p-5 flex items-start justify-between gap-4`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <c.Icon size={24} className={`${c.iconClass} flex-shrink-0 mt-0.5`} />
        <div>
          <h2 className={`font-bold text-xl ${c.titleClass}`}>{c.label}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{c.desc}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-sm text-gray-500">Soja · Tandil · hoy</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-avizor-green" />
              Confianza{" "}
              <span className="font-semibold text-avizor-green">Alta</span>
            </span>
          </div>
        </div>
      </div>
      <PlantSignalIllustration />
    </div>
  );
}
