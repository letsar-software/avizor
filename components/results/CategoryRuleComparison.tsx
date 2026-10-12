import type { ResultadoConsultaV2Publica } from "@/types";
import { formatNumber } from "@/lib/results/presentation";

type Rule = ResultadoConsultaV2Publica["reglas"][number] | undefined;

export function CategoryRuleComparison({
  rule,
  categoryName,
}: {
  rule: Rule;
  categoryName: string;
}) {
  return (
    <>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-base font-bold text-[#081a31]">
          Comparación con la regla
        </h2>
        <p className="mt-1 text-sm text-[#526477]">
          Resultado de las condiciones evaluadas para {categoryName}.
        </p>
        <div className="mt-3 divide-y rounded-lg border">
          {rule?.observado.map((item) => (
            <div
              key={`${item.variable}-${item.agregador}`}
              className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
            >
              <div>
                <strong>{variableName(item.variable)}</strong>
                <p className="mt-1 text-xs text-[#526477]">
                  Observado: {formatNumber(item.valor)} {item.unidad} ·
                  Requerido: {item.umbral} {item.unidad}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${item.cumple ? "bg-[#e8f7ee] text-[#087b4b]" : "bg-[#fff0f0] text-[#be2530]"}`}
              >
                {item.cumple ? "Cumple" : "No cumple"}
              </span>
            </div>
          ))}
          {!rule?.observado.length ? (
            <p className="p-3 text-sm text-[#526477]">
              No hay condiciones evaluables disponibles para esta regla.
            </p>
          ) : null}
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-base font-bold text-[#081a31]">
          ¿Cómo evaluó Avizor esta regla?
        </h2>
        <p className="mt-1 text-sm text-[#526477]">
          Variables, operadores, ventana y trazabilidad técnica.
        </p>
        {rule?.observado.length ? (
          <div className="mt-3 divide-y rounded-lg border">
            {rule.observado.map((item) => (
              <div
                key={`${item.variable}-${item.agregador}`}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <div>
                  <strong>{variableName(item.variable)}</strong>
                  <p className="mt-1 text-xs text-[#526477]">
                    {aggregateName(item.agregador)} · Observado:{" "}
                    {formatNumber(item.valor)} {item.unidad} · Umbral:{" "}
                    {item.umbral} {item.unidad}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${item.cumple ? "bg-[#e8f7ee] text-[#087b4b]" : "bg-[#fff0f0] text-[#be2530]"}`}
                >
                  {item.cumple ? "Cumple" : "No cumple"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#526477]">
            {rule?.motivo === "datos_insuficientes"
              ? "No hay cobertura suficiente para evaluar todas las condiciones."
              : "No hay variables evaluadas disponibles para esta regla."}
          </p>
        )}
      </section>
    </>
  );
}

function variableName(value: string) {
  return (
    (
      {
        humedad_relativa: "Humedad relativa",
        dias_humedad_favorable: "Días con humedad favorable",
        precipitacion: "Precipitación",
        temperatura_media: "Temperatura media",
        temperatura_min: "Temperatura mínima",
      } as Record<string, string>
    )[value] ?? value.replaceAll("_", " ")
  );
}

function aggregateName(value: string) {
  return (
    (
      {
        media_ventana: "media del período",
        suma_ventana: "acumulado del período",
        min_ventana: "mínimo del período",
        max_ventana: "máximo del período",
        conteo_dias: "cantidad de días",
      } as Record<string, string>
    )[value] ?? value.replaceAll("_", " ")
  );
}
