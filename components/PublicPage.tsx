import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: { label: string; href: string } }) {
  return <header className="flex flex-col gap-5 border-b border-[#e4ebe7] pb-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl">{eyebrow && <p className="text-xs font-bold uppercase tracking-[.12em] text-[#087b4b]">{eyebrow}</p>}<h1 className="mt-2 text-3xl font-bold tracking-tight text-[#081a31] sm:text-4xl">{title}</h1><p className="mt-3 text-[15px] leading-relaxed text-[#405369]">{description}</p></div>{action && <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-[#087b4b]">{action.label}<ArrowRight className="h-4 w-4" /></Link>}</header>;
}

export function PublicPage({ children }: { children: ReactNode }) { return <main className="mx-auto min-h-[70vh] max-w-[1180px] px-5 py-8 text-[#081a31] sm:px-8 sm:py-12">{children}</main>; }
export function InfoCard({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) { return <article className="rounded-xl border border-[#e0e8e3] bg-white p-5 shadow-[0_5px_18px_rgba(8,26,49,.03)]">{icon && <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#edf7f0] text-[#087b4b]">{icon}</span>}<h2 className="font-bold">{title}</h2><div className="mt-3 text-sm leading-relaxed text-[#405369]">{children}</div></article>; }
export function ScopeDisclaimer() { return <p className="mt-8 flex items-start justify-center gap-3 rounded-lg border border-[#e0e8e3] bg-[#f7f9f8] p-4 text-center text-xs leading-relaxed text-[#526477]"><ShieldCheck className="h-5 w-5 shrink-0 text-[#087b4b]" />Avizor describe condiciones ambientales y no el estado sanitario del lote. No diagnostica ni reemplaza el asesoramiento profesional.</p>; }
