"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Bug,
  CalendarDays,
  CheckCircle2,
  Eye,
  Leaf,
  MapPin,
  Timer,
  TriangleAlert,
} from "lucide-react";
import {
  FICHAS_SANITARIAS,
  type FichaSanitaria,
} from "@/lib/plagas/catalogo-publico";
import {
  formatDate,
  formatDateTime,
  rulesForDefinition,
} from "@/lib/results/presentation";
import { ResultScopeNote } from "@/components/results/shared";
import { CategoryNavigation } from "@/components/results/CategoryNavigation";
import { CategoryRuleComparison } from "@/components/results/CategoryRuleComparison";
import { CategoryClimate } from "@/components/results/CategoryClimate";
import {
  useResult,
  type ResultViewProps,
} from "@/components/results/useResult";

const CATALOG_PAGE_SIZE = 9;

export default function PestDetailV2({
  initialResult,
  basePath = "/resultado",
  tipo = "plaga",
}: ResultViewProps & { tipo?: FichaSanitaria["tipo"] } = {}) {
  const { result, loaded } = useResult(initialResult);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todas" | FichaSanitaria["estado"]>(
    "todas",
  );
  const [selectedEvaluation, setSelectedEvaluation] = useState("");
  const [page, setPage] = useState(1);
  if (!loaded) return <main className="min-h-[60vh]" />;
  if (!result)
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">
          Necesitamos una consulta actualizada
        </h1>
        <Link
          href="/consultar"
          className="mt-5 inline-flex rounded-lg bg-[#087b4b] px-5 py-3 text-white"
        >
          Realizar consulta
        </Link>
      </main>
    );
  const series = result.clima.serie,
    pathogenRules =
      tipo === "enfermedad"
        ? rulesForDefinition(result, "enfermedades_foliares")
        : [],
    fichas = FICHAS_SANITARIAS.filter(
      (ficha) => ficha.cultivo === result.cultivo && ficha.tipo === tipo,
    );
  const visibleFichas = fichas.filter((ficha) => {
    const term = normalizedText(search);
    return (
      (status === "todas" || ficha.estado === status) &&
      (!term ||
        normalizedText(`${ficha.nombre} ${ficha.cientifico ?? ""}`).includes(
          term,
        ))
    );
  });
  const totalPages = Math.max(
    1,
    Math.ceil(visibleFichas.length / CATALOG_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedFichas = visibleFichas.slice(
    (currentPage - 1) * CATALOG_PAGE_SIZE,
    currentPage * CATALOG_PAGE_SIZE,
  );
  const activePathogenRule =
    pathogenRules.find(
      (rule) =>
        `${rule.regla.clave}-${rule.regla.version}` === selectedEvaluation,
    ) ?? pathogenRules[0];
  return (
    <main className="mx-auto max-w-[1420px] px-4 py-5 text-[#081a31] sm:px-7 lg:py-8">
      <Link
        href={basePath}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#087b4b]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al resultado
      </Link>
      <section className="mt-2 grid gap-5 rounded-xl bg-white p-1 lg:grid-cols-[1fr_1.05fr] lg:border lg:p-6">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#edf7f0] text-[#087b4b]">
            {tipo === "plaga" ? (
              <Bug className="h-8 w-8" />
            ) : (
              <Leaf className="h-8 w-8" />
            )}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#087b4b]">
              Detalle por categoría
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {tipo === "plaga" ? "Plagas" : "Patógenos"}
            </h1>
            <p className="mt-2 text-base font-bold text-[#526477]">
              {tipo === "plaga"
                ? "Información para el monitoreo"
                : "Información agronómica disponible"}{" "}
              del cultivo de {result.cultivo}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#405369]">
              Las condiciones ambientales observadas se muestran como contexto y
              no como una evaluación de riesgo.
            </p>
          </div>
        </div>
        <div className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
          <Fact
            Icon={CalendarDays}
            label="Período analizado"
            value={
              formatDate(series[0]?.fecha ?? "", true) +
              " – " +
              formatDate(result.clima.rango_temporal.hasta, true)
            }
          />
          <Fact
            Icon={MapPin}
            label="Ubicación"
            value={
              result.localidad
                ? result.localidad.nombre + ", " + result.localidad.provincia
                : "—"
            }
          />
          <Fact
            Icon={CheckCircle2}
            label="Cobertura de datos"
            value={
              Math.round(result.clima.cobertura * 100) +
              " % · datos meteorológicos"
            }
          />
          <Fact
            Icon={Timer}
            label="Última actualización"
            value={formatDateTime(result.generado_en)}
          />
        </div>
      </section>
      <CategoryNavigation
        result={result}
        activeSlug={tipo === "plaga" ? "plagas" : "enfermedades_foliares"}
        basePath={basePath}
      />
      <details
        open
        className="mt-4 rounded-xl border bg-white p-5 md:[&:not([open])>.catalog-content]:block"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-bold md:hidden">
          <span className="flex-1">
            {tipo === "plaga" ? "Plagas del cultivo" : "Patógenos del cultivo"}
          </span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div className="catalog-content">
          <h2 className="hidden text-lg font-bold md:block">
            {tipo === "plaga" ? "Plagas del cultivo" : "Patógenos del cultivo"}
          </h2>
          <p className="mt-1 text-sm text-[#526477]">
            Fichas informativas disponibles para {result.cultivo}.{" "}
            {tipo === "plaga"
              ? "La evaluación climática de plagas todavía no está disponible."
              : "El estado de evaluación se informa individualmente en cada ficha."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              aria-label="Buscar fichas"
              placeholder="Buscar por nombre común o científico"
              className="min-h-11 flex-1 rounded-lg border px-3 text-sm"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
              }}
              aria-label="Filtrar por estado"
              className="min-h-11 rounded-lg border px-3 text-sm"
            >
              <option value="todas">Todos los estados</option>
              <option value="informacion">Información disponible</option>
              <option value="en_validacion">En validación</option>
              <option value="no_evaluable">Monitoreo recomendado</option>
            </select>
          </div>
          <p className="mt-3 text-sm text-[#526477]">
            {visibleFichas.length} resultado
            {visibleFichas.length === 1 ? "" : "s"} de {fichas.length} fichas
            disponibles.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pagedFichas.map((ficha) => (
              <PestCard
                key={ficha.id}
                ficha={ficha}
                expandable={tipo === "plaga"}
                hasEvaluation={
                  tipo === "enfermedad" &&
                  pathogenRules.some((rule) => matchesFichaRule(ficha, rule))
                }
                href={
                  basePath +
                  "/" +
                  (tipo === "plaga" ? "plagas" : "patogenos") +
                  "/" +
                  ficha.id
                }
              />
            ))}
          </div>
          {!visibleFichas.length ? (
            <p className="mt-4 rounded-lg border border-dashed p-5 text-sm text-[#526477]">
              No encontramos fichas con esos filtros.
            </p>
          ) : null}
          {visibleFichas.length > CATALOG_PAGE_SIZE ? (
            <nav
              className="mt-5 flex flex-wrap items-center justify-center gap-2"
              aria-label="Paginación del catálogo"
            >
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={
                      pageNumber === currentPage ? "page" : undefined
                    }
                    onClick={() => setPage(pageNumber)}
                    className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-bold ${
                      pageNumber === currentPage
                        ? "border-[#087b4b] bg-green-50 text-[#087b4b]"
                        : "bg-white text-[#405369]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
            </nav>
          ) : null}
        </div>
      </details>
      <div className="mt-3">
        <CategoryClimate
          series={series.slice(-14)}
          historico={result.historico_temperatura}
        />
      </div>
      {tipo === "plaga" ? (
        <section className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-[#263a4d]">
          <strong className="block text-[#087b4b]">
            La evaluación climática de plagas todavía no está disponible.
          </strong>
          <p className="mt-1">
            Podés consultar las fichas informativas y las recomendaciones de
            monitoreo disponibles para tu cultivo.
          </p>
        </section>
      ) : null}
      {tipo === "enfermedad" && activePathogenRule ? (
        <section className="mt-3 rounded-xl border bg-white p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold">
                Evaluaciones climáticas disponibles
              </h2>
              <p className="mt-1 text-sm text-[#526477]">
                Seleccioná una enfermedad con regla activa para consultar el
                resultado de su evaluación.
              </p>
            </div>
            <label className="text-sm font-semibold">
              Enfermedad evaluada
              <select
                value={
                  selectedEvaluation ||
                  `${activePathogenRule.regla.clave}-${activePathogenRule.regla.version}`
                }
                onChange={(event) => setSelectedEvaluation(event.target.value)}
                className="mt-1 block min-h-11 w-full rounded-lg border bg-white px-3 text-sm font-normal sm:min-w-72"
              >
                {pathogenRules.map((rule) => (
                  <option
                    key={`${rule.regla.clave}-${rule.regla.version}`}
                    value={`${rule.regla.clave}-${rule.regla.version}`}
                  >
                    {rule.regla.nombre ?? rule.riesgo.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <CategoryRuleComparison
              rule={activePathogenRule}
              categoryName={activePathogenRule.regla.nombre ?? "Patógenos"}
            />
          </div>
        </section>
      ) : null}
      <section className="mt-3 rounded-xl border border-[#9ed7bd] bg-[#f7fcf8] p-5">
        <h2 className="flex items-center gap-2 font-bold text-[#087b4b]">
          <Eye className="h-5 w-5" />
          Recomendación general
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#405369]">
          Continuá con el monitoreo habitual del lote y consultá el detalle de
          cada plaga para conocer qué observar.
        </p>
      </section>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Info
          Icon={Eye}
          title="Qué observar"
          lines={unique(fichas.flatMap((x) => x.observar ?? []))}
        />
        <Info
          Icon={BookOpen}
          title="Fuente y evidencia"
          lines={unique(fichas.flatMap((x) => x.fuentes))}
        />
        <Info
          Icon={TriangleAlert}
          title="Limitaciones"
          lines={[
            "La evaluación climática de plagas todavía no está disponible.",
            "No diagnostica presencia de plagas.",
          ]}
        />
        <Info
          Icon={CheckCircle2}
          title="Calidad de los datos"
          lines={[
            "Fuente: " + result.proveedor_climatico,
            "Cobertura: " + Math.round(result.clima.cobertura * 100) + " %",
          ]}
        />
      </div>
      <div className="mt-3">
        <ResultScopeNote />
      </div>
    </main>
  );
}
function PestCard({
  ficha,
  href,
  hasEvaluation = false,
  expandable = false,
}: {
  ficha: FichaSanitaria;
  href: string;
  hasEvaluation?: boolean;
  expandable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const estado =
    ficha.estado === "informacion"
      ? "Información disponible para monitoreo"
      : ficha.estado === "en_validacion"
        ? "Información en validación"
        : "Monitoreo recomendado";
  const label = hasEvaluation ? "Con evaluación climática" : estado;
  return (
    <article className="flex min-h-[190px] flex-col rounded-xl border p-4">
      <h3 className="text-base font-bold">{ficha.nombre}</h3>
      {ficha.cientifico ? (
        <p className="mt-1 text-xs italic text-[#526477]">{ficha.cientifico}</p>
      ) : (
        <p className="mt-1 text-xs italic text-[#526477]">
          Nombre científico no disponible.
        </p>
      )}
      <p className="mt-3 text-sm font-semibold text-[#087b4b]">{label}</p>
      <p className="mt-3 text-sm leading-5 text-[#405369]">
        {ficha.descripcion}
      </p>
      {expandable ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`pest-detail-${ficha.id}`}
            onClick={() => setOpen((value) => !value)}
            className="mt-auto inline-flex min-h-11 items-center pt-3 text-left text-sm font-bold text-[#087b4b]"
          >
            Ver detalle {open ? "↑" : "↓"}
          </button>
          {open ? (
            <div id={`pest-detail-${ficha.id}`} className="mt-3 border-t pt-3">
              {ficha.ambiente?.length ? (
                <DetailGroup
                  title="Condiciones ambientales documentadas"
                  lines={ficha.ambiente}
                />
              ) : null}
              {ficha.observar?.length ? (
                <DetailGroup title="Qué observar" lines={ficha.observar} />
              ) : null}
              {ficha.etapa ? (
                <DetailGroup
                  title="Momento fenológico relevante"
                  lines={[ficha.etapa]}
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <Link
          href={href}
          className="mt-auto inline-flex min-h-11 items-center pt-3 text-left text-sm font-bold text-[#087b4b]"
        >
          Ver ficha →
        </Link>
      )}
    </article>
  );
}
function DetailGroup({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="mt-3 rounded-lg bg-[#f7f9f8] p-3">
      <h5 className="font-semibold">{title}</h5>
      <ul className="mt-1 space-y-1 text-[#405369]">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
function Fact({
  Icon,
  label,
  value,
}: {
  Icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 shrink-0 text-[#087b4b]" />
      <p className="text-xs text-[#526477]">
        {label}
        <strong className="mt-1 block text-sm text-[#081a31]">{value}</strong>
      </p>
    </div>
  );
}
function Info({
  Icon,
  title,
  lines,
}: {
  Icon: typeof Eye;
  title: string;
  lines: string[];
}) {
  return (
    <details
      open
      className="rounded-xl border bg-white p-5 md:[&:not([open])>.info-content]:block"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold md:hidden">
        <Icon className="h-5 w-5 text-[#087b4b]" />
        <span className="flex-1">{title}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="info-content">
        <h2 className="hidden items-center gap-2 text-sm font-bold md:flex">
          <Icon className="h-5 w-5 text-[#087b4b]" />
          {title}
        </h2>
        <List lines={lines} />
      </div>
    </details>
  );
}
function List({ lines }: { lines: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-5 text-[#405369]">
      {lines.slice(0, 4).map((line) => (
        <li key={line} className="flex gap-2">
          <span className="text-[#087b4b]">•</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

function matchesFichaRule(
  ficha: FichaSanitaria,
  rule: ReturnType<typeof rulesForDefinition>[number],
) {
  const normalized = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-AR");
  const name = normalized(ficha.nombre);
  const ruleName = normalized(
    rule.regla.nombre ?? rule.riesgo.replaceAll("_", " "),
  );
  return ruleName === name || normalized(rule.riesgo).includes(name);
}
