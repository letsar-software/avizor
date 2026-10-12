"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Bug,
  Eye,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { FICHAS_SANITARIAS } from "@/lib/plagas/catalogo-publico";
import type { FichaSanitaria } from "@/lib/plagas/catalogo-publico";
import {
  useResult,
  type ResultViewProps,
} from "@/components/results/useResult";

export default function PestFichaDetailV2({
  fichaId,
  initialResult,
  basePath = "/resultado",
  tipo = "plaga",
}: { fichaId: string; tipo?: FichaSanitaria["tipo"] } & ResultViewProps) {
  const { result, loaded } = useResult(initialResult);
  const ficha = FICHAS_SANITARIAS.find(
    (item) => item.id === fichaId && item.tipo === tipo,
  );
  if (!loaded) return <main className="min-h-[60vh]" />;
  if (!ficha)
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Ficha no encontrada</h1>
        <Link
          href={basePath + "/" + (tipo === "plaga" ? "plagas" : "patogenos")}
          className="mt-5 inline-flex text-[#087b4b]"
        >
          Volver al catálogo
        </Link>
      </main>
    );
  const cultivo = result?.cultivo ?? ficha.cultivo;
  const localidad = result?.localidad
    ? result.localidad.nombre + ", " + result.localidad.provincia
    : "Localidad no disponible";
  return (
    <main className="mx-auto max-w-[980px] px-4 py-5 text-[#081a31] sm:px-7 lg:py-8">
      <Link
        href={basePath + "/" + (tipo === "plaga" ? "plagas" : "patogenos")}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#087b4b]"
      >
        <ArrowLeft className="h-4 w-4" />
        {tipo === "plaga" ? "Volver a Plagas" : "Volver a Patógenos"}
      </Link>
      <section className="mt-2 rounded-xl border bg-white p-5 lg:p-7">
        <div className="flex gap-4">
          <Bug className="h-9 w-9 shrink-0 text-[#087b4b]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#087b4b]">
              Ficha informativa
            </p>
            <h1 className="mt-1 text-2xl font-bold">{ficha.nombre}</h1>
            <p className="mt-1 text-sm italic text-[#526477]">
              {ficha.cientifico ?? "Nombre científico no disponible."}
            </p>
            <p className="mt-3 text-sm text-[#405369]">
              Cultivo: <strong>{cultivo}</strong> · Localidad:{" "}
              <strong>{localidad}</strong>
            </p>
          </div>
        </div>
        <p className="mt-6 leading-7 text-[#405369]">{ficha.descripcion}</p>
      </section>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Block
          Icon={Bug}
          title="Daños y descripción"
          lines={[ficha.descripcion]}
        />
        <Block
          Icon={Eye}
          title="Qué observar"
          lines={
            ficha.observar ?? [
              "Información específica pendiente de validación.",
            ]
          }
        />
        <Block
          Icon={MapPin}
          title="Condiciones ambientales documentadas"
          lines={
            ficha.ambiente ?? [
              "No hay condiciones climáticas específicas presentadas para esta ficha.",
            ]
          }
        />
        <Block
          Icon={Bug}
          title="Momento fenológico relevante"
          lines={[ficha.etapa ?? "Momento relevante no disponible."]}
        />
        {ficha.regiones && (
          <Block
            Icon={MapPin}
            title="Regiones de relevancia"
            lines={ficha.regiones}
          />
        )}
        {tipo !== "plaga" && ficha.observaciones && (
          <Block
            Icon={BookOpen}
            title="Observaciones de revisión"
            lines={ficha.observaciones}
          />
        )}
        <Block Icon={BookOpen} title="Fuentes técnicas" lines={ficha.fuentes} />
        <Block
          Icon={TriangleAlert}
          title="Limitaciones"
          lines={[
            "La información es descriptiva y no diagnostica presencia de plagas.",
            "La evaluación climática de plagas todavía no está disponible.",
          ]}
        />
      </div>
    </main>
  );
}

function Block({
  Icon,
  title,
  lines,
}: {
  Icon: typeof Bug;
  title: string;
  lines: string[];
}) {
  return (
    <details
      open
      className="rounded-xl border bg-white p-5 md:[&:not([open])>.block-content]:block"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold md:hidden">
        <Icon className="h-5 w-5 text-[#087b4b]" />
        <span className="flex-1">{title}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="block-content">
        <h2 className="hidden items-center gap-2 font-bold md:flex">
          <Icon className="h-5 w-5 text-[#087b4b]" />
          {title}
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#405369]">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
