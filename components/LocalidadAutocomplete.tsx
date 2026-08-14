"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { LocalidadNormalizada } from "@/types";

interface Props { value: string; onChange: (value: string) => void; }

export default function LocalidadAutocomplete({ value, onChange }: Props) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<LocalidadNormalizada[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || !open) { setSuggestions([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/localidades?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const payload = await response.json() as { data?: LocalidadNormalizada[] };
        setSuggestions(response.ok ? payload.data ?? [] : []);
        setActive(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSuggestions([]);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, open]);

  function select(localidad: LocalidadNormalizada) {
    onChange(`${localidad.nombre}, ${localidad.provincia}`);
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current) => Math.min(current + 1, suggestions.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((current) => Math.max(current - 1, 0)); }
    else if (event.key === "Enter" && active >= 0) { event.preventDefault(); select(suggestions[active]); }
    else if (event.key === "Escape") setOpen(false);
  }

  return <div className="relative">
    <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#087b4b]"/>
    <input id="place" role="combobox" aria-autocomplete="list" aria-expanded={open && suggestions.length > 0} aria-controls={listId} aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} value={value} onChange={(event) => { onChange(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} placeholder="Ej.: Rafaela, Santa Fe" autoComplete="off" className="h-12 w-full rounded-lg border border-[#dce4df] bg-white pl-11 pr-10 text-sm outline-none focus:border-[#53ad7b] focus:ring-2 focus:ring-[#dff3e7]"/>
    {loading && <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-[#087b4b]" aria-label="Buscando localidades"/>}
    {open && suggestions.length > 0 && <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#dce4df] bg-white py-1 shadow-lg">
      {suggestions.map((localidad, index) => <li id={`${listId}-${index}`} role="option" aria-selected={active === index} key={`${localidad.nombre}-${localidad.provincia}-${localidad.latitud}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => select(localidad)} className={`cursor-pointer px-4 py-2.5 text-sm ${active === index ? "bg-[#edf8f1]" : "bg-white"}`}>
        <span className="block font-semibold text-[#152c40]">{localidad.nombre}</span>
        <span className="mt-0.5 block text-xs text-[#526477]">{localidad.provincia}, Argentina</span>
      </li>)}
    </ul>}
  </div>;
}
