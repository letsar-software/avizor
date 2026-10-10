import Link from "next/link";
export default function SharedResultNotFound() {
  return <main className="mx-auto max-w-2xl px-5 py-16 text-center text-avizor-navy"><h1 className="text-2xl font-bold">No encontramos ese resultado</h1><p className="mt-3 text-sm text-[#526477]">Revisá el enlace recibido o realizá una nueva consulta.</p><Link href="/consultar" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-avizor-green px-5 text-sm font-bold text-white">Realizar nueva consulta</Link></main>;
}
