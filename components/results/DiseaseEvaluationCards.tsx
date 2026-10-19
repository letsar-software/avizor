"use client";

import { useState } from "react";
import type { ResultadoConsultaV2Publica } from "@/types";
import {
  FICHAS_SANITARIAS,
  type FichaSanitaria,
} from "@/lib/plagas/catalogo-publico";
import { statusLabel } from "@/lib/results/presentation";
import { SEVERITY_TONES, severityOf } from "@/components/results/shared";

const PAGE_SIZE = 9;

export function DiseaseEvaluationCards({
  rules,
  cultivo,
}: {
  rules: ResultadoConsultaV2Publica["reglas"];
  cultivo: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todas" | FichaSanitaria["estado"]>(
    "todas",
  );
  const fichas = FICHAS_SANITARIAS.filter(
    (ficha) => ficha.cultivo === cultivo && ficha.tipo === "enfermedad",
  );
  const filtered = fichas.filter(
    (ficha) =>
      (status === "todas" || ficha.estado === status) &&
      normalize(`${ficha.nombre} ${ficha.cientifico ?? ""}`).includes(
        normalize(search),
      ),
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const displayed = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  return (
    <section className="mt-3 rounded-xl border bg-white p-5">
      <h2 className="text-base font-bold">
        Patógenos del cultivo ({fichas.length} fichas)
      </h2>
      <p className="mt-1 text-sm text-[#526477]">
        Todas las fichas documentadas para el cultivo. La evaluación climática
        solo se muestra cuando existe una regla aplicable.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Buscar patógenos"
          placeholder="Buscar por nombre común o científico"
          className="min-h-11 flex-1 rounded-lg border px-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          aria-label="Filtrar patógenos por estado"
          className="min-h-11 rounded-lg border px-3 text-sm"
        >
          <option value="todas">Todos los estados</option>
          <option value="informacion">Información disponible</option>
          <option value="en_validacion">En validación</option>
          <option value="no_evaluable">Monitoreo recomendado</option>
        </select>
      </div>
      <p className="mt-3 text-sm text-[#526477]">
        {filtered.length} resultados de {fichas.length} fichas disponibles.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((ficha) => (
          <Card
            key={ficha.id}
            ficha={ficha}
            rule={rules.find((rule) => matches(ficha, rule))}
          />
        ))}
      </div>
      {totalPages > 1 ? (
        <nav
          className="mt-5 flex flex-wrap justify-center gap-2"
          aria-label="Paginación de patógenos"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <button
                key={number}
                type="button"
                aria-current={number === currentPage ? "page" : undefined}
                onClick={() => setPage(number)}
                className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-bold ${number === currentPage ? "border-[#087b4b] bg-green-50 text-[#087b4b]" : "bg-white text-[#405369]"}`}
              >
                {number}
              </button>
            ),
          )}
        </nav>
      ) : null}
    </section>
  );
}

function Card({
  ficha,
  rule,
}: {
  ficha: FichaSanitaria;
  rule?: ResultadoConsultaV2Publica["reglas"][number];
}) {
  const [open, setOpen] = useState(false);
  const tone = rule ? SEVERITY_TONES[severityOf(rule)] : null;
  const state = rule
    ? statusLabel(rule)
    : ficha.estado === "no_evaluable"
      ? "Monitoreo recomendado"
      : "Información disponible";
  return (
    <article
      className={`flex min-h-[190px] flex-col rounded-xl border p-4 ${tone?.border ?? ""}`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-[#087b4b]">
        Patógeno
      </span>
      <h3 className="mt-3 text-base font-bold">{ficha.nombre}</h3>
      <p className="mt-1 text-xs italic text-[#526477]">
        {ficha.cientifico ?? "Nombre científico no disponible."}
      </p>
      <p
        className={`mt-3 text-sm font-semibold ${tone?.text ?? "text-[#087b4b]"}`}
      >
        {state}
      </p>
      <p className="mt-3 text-sm leading-5 text-[#405369]">
        {ficha.descripcion}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`pathogen-detail-${ficha.id}`}
        onClick={() => setOpen((value) => !value)}
        className="mt-auto inline-flex min-h-11 items-center pt-3 text-left text-sm font-bold text-[#087b4b]"
      >
        Ver detalle {open ? "↑" : "↓"}
      </button>
      {open ? (
        <div
          id={`pathogen-detail-${ficha.id}`}
          className="mt-3 border-t pt-3 text-sm text-[#405369]"
        >
          {rule ? (
            <p>
              {rule.explicacion ??
                "La evaluación climática disponible se muestra en la comparación de la regla."}
            </p>
          ) : (
            <p>
              Ficha informativa disponible. No hay una evaluación climática
              activa para este patógeno.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function matches(
  ficha: FichaSanitaria,
  rule: ResultadoConsultaV2Publica["reglas"][number],
) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-AR");
  const name = normalize(ficha.nombre);
  const ruleName = normalize(
    rule.regla.nombre ?? rule.riesgo.replaceAll("_", " "),
  );
  return ruleName.includes(name) || name.includes(ruleName);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}
