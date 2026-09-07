"use client";

import { CalendarDays } from "lucide-react";

interface ModernDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function ModernDateInput({ id, value, onChange, required = false }: ModernDateInputProps) {
  return (
    <div className="group relative">
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="modern-date-input h-12 w-full rounded-xl border border-[#d7e3dc] bg-white px-4 pr-12 text-sm font-medium text-[#142b3f] shadow-[0_1px_2px_rgba(8,26,49,0.04)] transition hover:border-[#9bc8ad] focus:border-[#087b4b] focus:outline-none focus:ring-4 focus:ring-[#087b4b]/10"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#edf7f1] text-[#087b4b] transition group-focus-within:bg-[#087b4b] group-focus-within:text-white">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  );
}
