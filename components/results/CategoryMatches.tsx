import React from "react";
import type { MatchedRule, VariableValueSource } from "@/types";
import { requiredDataLabel } from "@/lib/rules/required-data";
import { toneOf } from "@/lib/results/category-presentation";
import { formatDate } from "@/lib/results/presentation";
import { SEVERITY_TONES } from "@/components/results/shared";

const SOURCE_LABEL: Record<VariableValueSource, string> = {
  weather: "Estimación climática",
  field_data: "Dato de campo",
  sensor: "Sensor",
  import: "Importación",
  calculated: "Cálculo",
};

/** Todas las coincidencias de la categoría; la primera es el resultado principal. */
export function CategoryMatches({ matches }: { matches: MatchedRule[] }) {
  if (!matches.length) return null;
  return (
    <section className="mt-3 rounded-xl border bg-white p-5" aria-labelledby="category-matches-title">
      <h2 id="category-matches-title" className="text-base font-bold">
        {matches.length > 1 ? "Condiciones compatibles" : "Condición compatible"}
      </h2>
      <p className="mt-1 text-sm text-[#526477]">
        Cada coincidencia corresponde a una regla ambiental específica y no constituye un diagnóstico.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((match, index) => {
          const tone = SEVERITY_TONES[toneOf(match.internal_status)];
          return (
            <article key={`${match.rule_id}-${index}`} className={`min-w-0 rounded-lg border p-4 ${tone.border}`} data-testid="category-match">
              <h3 className="text-sm font-bold">{match.rule_name}</h3>
              {match.scientific_name ? <p className="text-xs italic text-[#526477]">{match.scientific_name}</p> : null}
              <p className={`mt-2 text-sm font-semibold ${tone.text}`}>{match.display_status}</p>
              <p className="mt-1 text-sm leading-6 text-[#405369]">{match.message}</p>
              <p className="mt-2 text-sm font-semibold text-[#081a31]">{match.recommended_action}</p>
              {match.variables_used.length ? (
                <div className="mt-3 text-xs text-[#405369]">
                  <p className="font-semibold text-[#081a31]">Variables utilizadas</p>
                  <ul className="mt-1 space-y-0.5">
                    {match.variables_used.map((variable) => (
                      <li key={variable.key}>{requiredDataLabel(variable.key)} · {SOURCE_LABEL[variable.source]}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {match.required_data.length ? (
                <div className="mt-3 text-xs text-[#405369]">
                  <p className="font-semibold text-[#081a31]">Para completar la evaluación</p>
                  <ul className="mt-1 space-y-0.5">{match.required_data.map((item) => <li key={item.variable}>• {item.label}</li>)}</ul>
                </div>
              ) : null}
              {match.source_name || match.reviewed_at ? (
                <p className="mt-3 break-words text-xs text-[#526477]">
                  {match.source_name ? (
                    match.source_url ? <a href={match.source_url} target="_blank" rel="noreferrer" className="underline">{match.source_name}</a> : match.source_name
                  ) : null}
                  {match.reviewed_at ? `${match.source_name ? " · " : ""}revisada ${formatDate(match.reviewed_at.slice(0, 10), true)}` : null}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
