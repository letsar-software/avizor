"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Leaf,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sprout,
  X,
} from "lucide-react";

const BULLETS = [
  { Icon: BadgeCheck, titulo: "Datos confiables", desc: "Clima histórico y en tiempo real" },
  { Icon: Leaf, titulo: "Reglas agronómicas", desc: "Validadas por expertos" },
  { Icon: MessageSquare, titulo: "Recomendaciones claras", desc: "Para que decidas mejor" },
];

export default function HeroSection() {
  const router = useRouter();
  const [showSowingDate, setShowSowingDate] = useState(false);
  const [localidad, setLocalidad] = useState("Tandil, Buenos Aires");
  const [cultivo, setCultivo] = useState("soja");
  const [fechaSiembra, setFechaSiembra] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function getSessionId() {
    const existingSessionId = window.localStorage.getItem("avizor_session_id");

    if (existingSessionId) return existingSessionId;

    const sessionId = crypto.randomUUID();
    window.localStorage.setItem("avizor_session_id", sessionId);
    return sessionId;
  }

  async function handleConsulta() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localidad,
          cultivo,
          session_id: getSessionId(),
          fecha_siembra: fechaSiembra || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No pudimos completar la consulta. Intentá nuevamente.");
        return;
      }

      window.sessionStorage.setItem("avizor_resultado", JSON.stringify(data));
      window.sessionStorage.setItem("avizor_consulta", JSON.stringify({ localidad, cultivo, fechaSiembra }));
      router.push("/resultado");
    } catch {
      setError("No pudimos completar la consulta. Intentá nuevamente en unos minutos.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#eef4f1]">
      <div className="absolute inset-x-0 top-0 h-[calc(100%-145px)] min-h-[650px]">
        <Image
          src="/campo-hojas.png"
          alt="Campo de soja"
          fill
          className="object-cover object-[65%_center]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4f8f5] via-[#f4f8f5]/82 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/42 via-transparent to-[#eef4ef]/55" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white/45 via-white/15 to-transparent" />
      </div>

      <div className="pointer-events-none absolute right-[7%] top-[92px] hidden h-[390px] w-[390px] rounded-full border border-white/55 lg:block" />
      <div className="pointer-events-none absolute right-[10%] top-[132px] hidden h-[310px] w-[310px] rounded-full border border-white/50 lg:block" />
      <div className="pointer-events-none absolute right-[13%] top-[172px] hidden h-[230px] w-[230px] rounded-full border border-white/45 lg:block" />
      <div className="pointer-events-none absolute right-[22%] top-[214px] hidden h-2 w-2 rounded-full bg-white/85 lg:block" />
      <div className="pointer-events-none absolute right-[27%] top-[142px] hidden h-1.5 w-1.5 rounded-full bg-white/85 lg:block" />
      <div className="pointer-events-none absolute right-[7%] top-[126px] hidden h-2 w-2 rounded-full bg-white/80 lg:block" />

      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col">
        <div className="flex flex-col px-7 pb-7 pt-16 sm:px-10 lg:px-14">
          <div className="max-w-[430px]">
            <h1 className="text-[42px] font-extrabold leading-[0.9] text-[#071322] sm:text-[52px]">
              La señal
              <br />
              antes del
              <br />
              <span className="text-avizor-green">problema.</span>
            </h1>
            <p className="mt-4 max-w-[330px] text-[17px] font-medium leading-[1.35] text-[#102333]">
              Monitoreo inteligente de condiciones que pueden afectar tu cultivo.
            </p>

            <div className="mt-7 space-y-[24px]">
              {BULLETS.map((item) => (
                <div key={item.titulo} className="flex items-start gap-4">
                  <div className="flex h-[43px] w-[43px] flex-shrink-0 items-center justify-center rounded-full bg-white/55 text-avizor-green shadow-sm ring-1 ring-white/60">
                    <item.Icon size={19} strokeWidth={1.8} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[13px] font-extrabold text-[#102333]">{item.titulo}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#22313d]/80">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 w-full max-w-[1310px] rounded-xl bg-white p-6 shadow-[0_22px_55px_rgba(12,42,33,0.16)] ring-1 ring-black/5 sm:p-6">
            <h2 className="text-[20px] font-extrabold leading-tight text-[#071322]">
              Consultá las condiciones de tu lote
            </h2>
            <p className="mt-1.5 text-[12px] font-semibold text-[#66727a]">
              Obtené una señal clara en menos de 30 segundos.
            </p>

            <div className="mt-6 grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase text-[#66727a]">
                  Localidad
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-avizor-green"
                    size={17}
                    strokeWidth={1.9}
                  />
                  <input
                    className="h-[50px] w-full rounded-lg border border-[#d7dfda] bg-white pl-11 pr-11 text-[13px] font-semibold text-[#102333] outline-none transition focus:border-avizor-green focus:ring-2 focus:ring-avizor-green/15"
                    value={localidad}
                    onChange={(event) => setLocalidad(event.target.value)}
                    aria-label="Localidad"
                  />
                  <X
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a9690]"
                    size={15}
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase text-[#66727a]">
                  Cultivo
                </label>
                <div className="relative">
                  <Sprout
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-avizor-green"
                    size={17}
                    strokeWidth={1.9}
                  />
                  <select
                    className="h-[50px] w-full appearance-none rounded-lg border border-[#d7dfda] bg-white pl-11 pr-11 text-[13px] font-semibold text-[#102333] outline-none transition focus:border-avizor-green focus:ring-2 focus:ring-avizor-green/15"
                    aria-label="Cultivo"
                    value={cultivo}
                    onChange={(event) => setCultivo(event.target.value)}
                  >
                    <option value="soja">Soja</option>
                    <option value="maiz">Maíz</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8a9690]"
                    size={17}
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              <button
                onClick={handleConsulta}
                disabled={isLoading}
                className="inline-flex h-[50px] items-center justify-center gap-5 rounded-lg bg-avizor-green px-9 text-[13px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#256427] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Consultando..." : "Consultar"} <ArrowRight size={17} strokeWidth={2} />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-[#f2b1aa] bg-[#fff4f4] px-4 py-3 text-[13px] font-semibold text-[#b42318]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowSowingDate((current) => !current)}
              aria-expanded={showSowingDate}
              className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-center text-[11px] font-semibold text-[#67736e] transition-colors hover:text-avizor-green"
            >
              <CalendarDays size={15} strokeWidth={1.9} className="text-avizor-green" />
              <span>¿Querés mejorar la precisión?</span>
              <span>Agregá la fecha de siembra después del resultado.</span>
              <ChevronDown
                size={14}
                strokeWidth={1.9}
                className={`transition-transform ${showSowingDate ? "rotate-180" : ""}`}
              />
            </button>

            {showSowingDate && (
              <div className="mx-auto mt-4 grid max-w-[460px] grid-cols-1 gap-3 rounded-lg border border-[#d7dfda] bg-[#f7faf8] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-2 block text-[10px] font-extrabold uppercase text-[#66727a]">
                    Fecha de siembra
                  </label>
                  <div className="relative">
                    <CalendarDays
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-avizor-green"
                      size={17}
                      strokeWidth={1.9}
                    />
                    <input
                      type="date"
                      value={fechaSiembra}
                      onChange={(event) => setFechaSiembra(event.target.value)}
                      className="h-[46px] w-full rounded-lg border border-[#d7dfda] bg-white pl-11 pr-4 text-[13px] font-semibold text-[#102333] outline-none transition focus:border-avizor-green focus:ring-2 focus:ring-avizor-green/15"
                      aria-label="Fecha de siembra"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConsulta}
                  disabled={isLoading}
                  className="inline-flex h-[46px] items-center justify-center gap-3 rounded-lg border border-avizor-green/20 bg-white px-5 text-[12px] font-extrabold text-avizor-green transition-colors hover:bg-avizor-green-light disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Consultando..." : "Usar fecha"} <ArrowRight size={15} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}




