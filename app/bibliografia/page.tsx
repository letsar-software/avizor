"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { InfoMessage } from "@/components/ui/InfoMessage";

type Source = {
  title: string;
  meta: string;
  tag: string;
  categories: string[];
  action: string;
  href: string;
};

const sources: Source[] = [
  {
    title: "Fehr, W. R. y Caviness, C. E. Stages of soybean development",
    meta: "Special Report 80, Iowa State University, Ames, 1977.",
    tag: "Fenología",
    categories: ["Fenología"],
    action: "Ver fuente",
    href: "https://dr.lib.iastate.edu/handle/20.500.12876/90239",
  },
  {
    title: "Carmona, M. A.; Gally, M. E.; Grijalba, P. E. y Sautua, F. J. Evolución de las enfermedades de la soja en Argentina",
    meta: "Agronomía & Ambiente 35(1): 37–52, FAUBA, 2015.",
    tag: "Enfermedades foliares",
    categories: ["Enfermedades foliares"],
    action: "Ver artículo",
    href: "https://agronomiayambiente.agro.uba.ar/index.php?journal=AyA&op=view&page=article&path%5B%5D=34",
  },
  {
    title: "Allen, R. G.; Pereira, L. S.; Raes, D. y Smith, M. Crop evapotranspiration",
    meta: "FAO Irrigation and Drainage Paper 56, FAO, Roma, 1998.",
    tag: "Estrés y exceso hídrico",
    categories: ["Estrés hídrico", "Exceso hídrico"],
    action: "Ver publicación",
    href: "https://www.fao.org/4/x0490e/x0490e00.htm",
  },
  {
    title: "Fernández Long, M. E.; Barnatán, I. E.; Spescha, L. B.; Hurtado, R. H. y Murphy, G. M. Caracterización de las heladas en la región pampeana y su variabilidad en los últimos 10 años",
    meta: "Revista de la Facultad de Agronomía UBA 25(3): 247–257, 2005.",
    tag: "Heladas",
    categories: ["Heladas"],
    action: "Ver registro",
    href: "https://agris.fao.org/search/en/records/6790c3be65d8e90e60b0f5b0",
  },
  {
    title: "Servicio Meteorológico Nacional. Estadísticas Climatológicas Normales de la República Argentina",
    meta: "Período 1991–2020. SMN, 2023.",
    tag: "Clima",
    categories: [],
    action: "Ver fuente",
    href: "https://repositorio.smn.gob.ar/handle/20.500.12160/2506",
  },
  {
    title: "Introna, J.; Prece, N. M. y Llanes, M. R. Evaluación de cultivares comerciales de soja",
    meta: "EEA Pergamino, INTA, 2025.",
    tag: "Soja",
    categories: ["Fenología"],
    action: "Ver PDF",
    href: "https://repositorio.inta.gob.ar/bitstream/handle/20.500.12123/23121/INTA_CRBsAsNorte_EEAPergamino_Introna_Jimena_Evaluaci%C3%B3n_de_cultivares_comerciales_de_soja_de_primera_y_de_segunda_en_la_EEA_INTA_Pergamino.pdf?isAllowed=y&sequence=1",
  },
  {
    title: "Conforto, E. C. Desarrollo y validación de escalas de severidad para enfermedades de fin de ciclo de la soja",
    meta: "Universidad Nacional de Córdoba e INTA, 2011.",
    tag: "Enfermedades foliares",
    categories: ["Enfermedades foliares"],
    action: "Ver fuente",
    href: "https://repositorio.inta.gob.ar/handle/20.500.12123/12615",
  },
  {
    title: "INTA. Cómo afectan las inundaciones a la soja y al algodón",
    meta: "INTA Las Breñas, 2019.",
    tag: "Exceso hídrico",
    categories: ["Exceso hídrico"],
    action: "Ver sitio",
    href: "https://intainforma.inta.gob.ar/como-afectan-las-inundaciones-en-los-rendimientos-en-soja-y-algodon/",
  },
];

const tabs = ["Todas", "Fenología", "Enfermedades foliares", "Heladas", "Estrés hídrico", "Exceso hídrico"];

export default function Bibliography() {
  const [activeTab, setActiveTab] = useState("Todas");
  const visibleSources = useMemo(
    () => activeTab === "Todas" ? sources : sources.filter(source => source.categories.includes(activeTab)),
    [activeTab],
  );

  return <main className="mx-auto max-w-[1180px] px-5 py-9 text-[#081a31] sm:px-8 sm:py-12">
    <header>
      <h1 className="text-[34px] font-bold">Bibliografía</h1>
      <span className="mt-3 block h-0.5 w-9 bg-[#168c50]"/>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-[#405369]">Las reglas agronómicas utilizadas por Avizor se basan en publicaciones técnicas y científicas de referencia.</p>
    </header>

    <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-b border-[#e4eae6]" role="tablist" aria-label="Categorías bibliográficas">
      {tabs.map(tab => <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={activeTab === tab}
        onClick={() => setActiveTab(tab)}
        className={'border-b-2 px-1 pb-3 text-xs font-semibold ' + (activeTab === tab ? "border-[#087b4b] text-[#087b4b]" : "border-transparent text-[#405369]")}
      >{tab}</button>)}
    </div>

    <section className="mt-5 grid gap-3 lg:grid-cols-2" aria-live="polite">
      {visibleSources.map(source => <article key={source.title} className="rounded-2xl border border-[#e0e7e3] bg-white p-4 shadow-[0_4px_16px_rgba(8,26,49,.025)]">
        <div className="flex gap-4">
          <FileText className="h-7 w-7 shrink-0 text-[#087b4b]"/>
          <div>
            <h2 className="text-sm font-bold leading-5">{source.title}</h2>
            <p className="mt-1 text-xs text-[#526477]">{source.meta}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 pl-11">
          <span className="rounded-md bg-green-50 px-3 py-1.5 text-[11px] text-[#087b4b]">{source.tag}</span>
          <a href={source.href} target="_blank" rel="noreferrer" aria-label={source.action + ": " + source.title} className="inline-flex min-h-9 items-center gap-2 rounded-xl border px-4 text-xs font-semibold text-[#087b4b] transition hover:border-[#087b4b] hover:bg-green-50">
            {source.action}<ExternalLink className="h-3.5 w-3.5"/>
          </a>
        </div>
      </article>)}
    </section>

    <div className="mt-5">
      <InfoMessage variant="warning">Las reglas se revisan y actualizan periódicamente en base a nueva evidencia técnica y validación con especialistas.</InfoMessage>
    </div>
  </main>;
}