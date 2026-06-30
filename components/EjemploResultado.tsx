import DatosClimaticos from "./DatosClimaticos";

export default function EjemploResultado() {
  return (
    <section className="bg-avizor-cream py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {/* Encabezado */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-avizor-navy-dark">
            Ejemplo de resultado
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tandil, Buenos Aires Â· Soja Â· 14/06/2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna resultado â€” 2/3 */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            {/* Estado */}
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">âš ï¸</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg leading-tight">
                  AtenciÃ³n recomendada
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Las condiciones actuales merecen atenciÃ³n.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            {/* CondiciÃ³n */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700">
                Condiciones para enfermedades foliares
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full flex-shrink-0">
                Moderadas
              </span>
            </div>

            {/* RecomendaciÃ³n */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                RecomendaciÃ³n
              </p>
              <p className="text-sm text-gray-700">
                Monitorear el lote durante los prÃ³ximos 5 dÃ­as.
              </p>
            </div>

            {/* Footer card */}
            <div className="border-t border-gray-100 pt-3 mt-4">
              <p className="text-xs text-gray-400">
                Basado en 14 dÃ­as completos de datos climÃ¡ticos
              </p>
            </div>
          </div>

          {/* Columna lateral â€” 1/3 */}
          <div className="flex flex-col gap-4">
            <DatosClimaticos />

            {/* Card verde */}
            <div className="bg-avizor-green-light rounded-xl p-6 border border-[#c8e6c9]">
              <span className="text-avizor-green text-2xl">ðŸŒ¿</span>
              <h4 className="font-bold text-avizor-navy-dark mt-3 text-sm">
                Siempre en simple
              </h4>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                No predecimos.<br />
                Identificamos condiciones<br />
                que pueden favorecer riesgos.
              </p>
              <p className="font-semibold text-avizor-green mt-3 text-sm">
                Vos decidÃ­s.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

