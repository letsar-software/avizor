import type { LucideIcon } from "lucide-react";

export function CategoryInformationCard({
  Icon,
  title,
  lines,
}: {
  Icon: LucideIcon;
  title: string;
  lines: string[];
}) {
  const content = (
    <ul className="mt-4 space-y-3">
      {lines.map((line, index) => (
        <li key={index} className="text-sm leading-6 text-[#405369]">
          › {line}
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <details className="rounded-xl border bg-white p-5 md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-bold">
          <Icon className="h-5 w-5 text-[#087b4b]" />
          <span className="flex-1">{title}</span>
          <span aria-hidden="true">⌄</span>
        </summary>
        {content}
      </details>
      <section className="hidden rounded-xl border bg-white p-5 md:block">
        <h2 className="flex gap-2 text-base font-bold">
          <Icon className="h-5 w-5 text-[#087b4b]" />
          {title}
        </h2>
        {content}
      </section>
    </>
  );
}
