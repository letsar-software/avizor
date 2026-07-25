"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = { id: string; title: string; summary?: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean };

export default function Accordion({ id, title, summary, icon, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${id}-panel`;
  return (
    <article className="overflow-hidden rounded-xl border border-[#dce6e0] bg-white shadow-sm">
      <h3><button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition hover:bg-[#f7fbf8] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-avizor-green sm:px-5">
        {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-avizor-green-light text-avizor-green">{icon}</span>}
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold text-[#0b2138]">{title}</span>{summary && <span className="mt-0.5 block text-[12px] leading-snug text-[#607083]">{summary}</span>}</span>
        <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-avizor-green transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button></h3>
      <div id={panelId} hidden={!open} className="border-t border-[#e8eeea] px-4 py-4 text-[14px] leading-relaxed text-[#31465a] sm:px-5">{children}</div>
    </article>
  );
}
