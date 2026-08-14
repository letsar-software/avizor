"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, CloudRain, Info, Loader2, Search, ShieldCheck, Sprout, Thermometer, Wind } from "lucide-react";
import LocalidadAutocomplete from "@/components/LocalidadAutocomplete";

export default function HeroSection() {
  const router = useRouter();
  const [localidad, setLocalidad] = useState("Tandil, Buenos Aires");
  const [cultivo, setCultivo] = useState("soja");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [precision, setPrecision] = useState(false);
  const [fechaSiembra, setFechaSiembra] = useState("");
  const [grupoMadurez, setGrupoMadurez] = useState("IV corto");
  const [cultivar, setCultivar] = useState("");

  function sessionId() {
    const current = localStorage.getItem("avizor_session_id");
    if (current) return current;
    const id = crypto.randomUUID();
    localStorage.setItem("avizor_session_id", id);
    return id;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!localidad.trim()) { setError("Ingresá una localidad."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/public/consultas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localidad, cultivo, sessionId: sessionId(), ...(precision && fechaSiembra ? { fechaSiembra, grupoMadurez, cultivar: cultivar || undefined } : {}) }) });
      const payload = await response.json();
      if (!response.ok) { setError(payload.error?.message || "No pudimos completar la consulta."); return; }
      const data = payload.data;
      const query = { localidad, cultivo, fechaSiembra: fechaSiembra || undefined, grupoMadurez: precision ? grupoMadurez : undefined, cultivar: cultivar || undefined, createdAt: new Date().toISOString(), estado: data.estado_general, categoria: data.reglas?.[0]?.riesgo, resumen: data.explicacion, share_token: data.share_token, result: data };
      sessionStorage.setItem("avizor_resultado", JSON.stringify(data));
      sessionStorage.setItem("avizor_consulta", JSON.stringify(query));
      const history = JSON.parse(localStorage.getItem("avizor_historial") || "[]");
      localStorage.setItem("avizor_historial", JSON.stringify([query, ...history].slice(0, 20)));
      router.push("/resultado");
    } catch { setError("No pudimos obtener los datos climáticos. Intentá nuevamente en unos minutos."); }
    finally { setLoading(false); }
  }

  return <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-[980px] px-5 py-9 text-[#081a31] sm:px-8 sm:py-12">
    <header><h1 className="text-[30px] font-bold tracking-tight sm:text-3xl">Realizá una consulta</h1><span className="mt-3 block h-0.5 w-9 bg-[#168c50]"/><p className="mt-5 text-sm leading-5 text-[#405369]">Elegí tu ubicación y cultivo<br className="sm:hidden"/> para comenzar.</p></header>
    <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_360px] lg:items-center">
      <form onSubmit={submit} className="order-2 space-y-4 lg:order-1">
        <div><label htmlFor="crop" className="mb-2 block text-xs font-bold text-[#405369]">Cultivo</label><div className="relative"><Sprout className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#087b4b]"/><select id="crop" value={cultivo} onChange={(event) => setCultivo(event.target.value)} className="h-12 w-full appearance-none rounded-lg border border-[#dce4df] bg-white pl-11 pr-10 text-sm"><option value="soja">Soja</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2"/></div></div>
        <div><label htmlFor="place" className="mb-2 block text-xs font-bold text-[#405369]">Localidad</label><LocalidadAutocomplete value={localidad} onChange={setLocalidad}/><p className="mt-1.5 text-[11px] leading-4 text-[#526477]">Podés consultar cualquier ciudad de Argentina. Elegí una opción para identificar correctamente la provincia.</p></div>
        <div className="rounded-xl border border-[#dce7e0] bg-[#f8fbf9] p-4">
          <button type="button" onClick={() => setPrecision(!precision)} aria-expanded={precision} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-[#087b4b]"><span className="flex items-center gap-2"><CalendarDays className="h-5 w-5"/>Quiero mejorar la precisión</span><ChevronDown className={`h-4 w-4 transition-transform ${precision ? "rotate-180" : ""}`}/></button>
          {precision && <div className="mt-4 grid gap-4 border-t border-[#dce7e0] pt-4 sm:grid-cols-2"><div><label htmlFor="planting-date" className="mb-2 block text-xs font-bold text-[#405369]">Fecha de siembra</label><input id="planting-date" type="date" value={fechaSiembra} onChange={(event) => setFechaSiembra(event.target.value)} className="h-12 w-full rounded-lg border border-[#dce4df] bg-white px-4 text-sm"/></div><div><label htmlFor="maturity-group" className="mb-2 block text-xs font-bold text-[#405369]">Grupo de madurez</label><select id="maturity-group" value={grupoMadurez} onChange={(event) => setGrupoMadurez(event.target.value)} className="h-12 w-full rounded-lg border border-[#dce4df] bg-white px-4 text-sm"><option>III</option><option>IV corto</option><option>IV largo</option><option>V</option></select></div><div className="sm:col-span-2"><label htmlFor="cultivar" className="mb-2 block text-xs font-bold text-[#405369]">Cultivar <span className="font-normal">(opcional)</span></label><input id="cultivar" value={cultivar} onChange={(event) => setCultivar(event.target.value)} placeholder="Ej.: DM 40R16" className="h-12 w-full rounded-lg border border-[#dce4df] bg-white px-4 text-sm"/></div><p className="text-[11px] leading-5 text-[#526477] sm:col-span-2">Estos datos permiten estimar la fenología. La estimación no modifica automáticamente las reglas agronómicas.</p></div>}
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#087b4b] text-sm font-bold text-white shadow-sm disabled:opacity-60">{loading ? <><Loader2 className="h-5 w-5 animate-spin"/>Consultando…</> : <><Search className="h-5 w-5"/>Consultar</>}</button>
      </form>
      <aside className="relative order-1 mx-auto flex h-56 w-56 items-center justify-center rounded-full bg-[radial-gradient(circle,#f5faf7_15%,#eef7f1_70%)] lg:order-2 lg:h-72 lg:w-72" aria-label="Variables climáticas analizadas"><Sprout className="h-28 w-28 text-[#087b4b] lg:h-32 lg:w-32" strokeWidth={1.8}/><span className="absolute left-0 top-20 flex h-12 w-12 items-center justify-center rounded-full border bg-white text-[#ef793a] shadow-sm"><Thermometer className="h-6 w-6"/></span><span className="absolute right-12 top-0 flex h-12 w-12 items-center justify-center rounded-full border bg-white text-[#328bd0] shadow-sm"><CloudRain className="h-6 w-6"/></span><span className="absolute right-0 top-24 flex h-12 w-12 items-center justify-center rounded-full border bg-white text-[#5286a6] shadow-sm"><Wind className="h-6 w-6"/></span></aside>
    </div>
    <section className="mt-5 flex gap-4 rounded-xl border border-[#bfe1cd] bg-[#f6fbf8] p-4"><Info className="h-5 w-5 shrink-0 text-[#087b4b]"/><div><h2 className="text-sm font-bold">Sin cuenta, sin complicaciones</h2><p className="mt-1 text-xs leading-5 text-[#526477]">Hacé tu consulta sin registrarte. Si querés recibir novedades, podés dejarnos tu email al final.</p></div></section>
    <p className="mt-7 flex items-start justify-center gap-3 text-center text-[10px] leading-4 text-[#718093]"><ShieldCheck className="h-4 w-4 shrink-0"/>Avizor no diagnostica ni reemplaza el asesoramiento profesional. La información es de carácter orientativo.</p>
  </main>;
}
