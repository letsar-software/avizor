export type LimitationGroup = { title: string; items: string[] };

const GROUPS = [
  { title: "Evaluación parcial", pattern: /evaluaci[oó]n parcial|parcialmente evaluable|implementaci[oó]n parcial/i },
  { title: "Datos no observados / no disponibles", pattern: /no (?:se )?(?:observa|dispone|incluye|cuenta)|datos? (?:no disponible|faltante)|sin datos/i },
  { title: "Alcance de la evaluación", pattern: /alcance|no reemplaza|no constituye|solo considera|s[oó]lo considera/i },
  { title: "Reglas experimentales", pattern: /experimental|en validaci[oó]n|pendiente de validar/i },
] as const;

export function groupLimitations(limitations: string[]): LimitationGroup[] {
  const grouped = new Map<string, string[]>();
  for (const limitation of limitations) {
    const title = GROUPS.find(({ pattern }) => pattern.test(limitation))?.title ?? "Otras limitaciones";
    grouped.set(title, [...(grouped.get(title) ?? []), limitation]);
  }
  return [...GROUPS.map(({ title }) => title), "Otras limitaciones"]
    .filter((title) => grouped.has(title))
    .map((title) => ({ title, items: grouped.get(title) ?? [] }));
}
