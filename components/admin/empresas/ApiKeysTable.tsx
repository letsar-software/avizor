import RevokeApiKeyButton from "@/components/admin/empresas/RevokeApiKeyButton";
import type { ApiKeyConUso } from "@/types";

export default function ApiKeysTable({ apiKeys, puedeEscribir }: { apiKeys: ApiKeyConUso[]; puedeEscribir: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Scopes</th>
            <th className="px-4 py-3">Consumo (mes)</th>
            <th className="px-4 py-3">Límite</th>
            <th className="px-4 py-3">Estado</th>
            {puedeEscribir && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {apiKeys.map((apiKey) => (
            <tr key={apiKey.id}>
              <td className="px-4 py-3 font-medium text-avizor-navy">{apiKey.nombre}</td>
              <td className="px-4 py-3 text-gray-600">{apiKey.scopes.length ? apiKey.scopes.join(", ") : "—"}</td>
              <td className="px-4 py-3 text-gray-600">{apiKey.uso_mes_actual}</td>
              <td className="px-4 py-3 text-gray-600">{apiKey.limite_mensual ?? "sin límite"}</td>
              <td className="px-4 py-3">
                {apiKey.activa ? (
                  <span className="rounded bg-avizor-green-light px-2 py-1 text-xs font-medium text-avizor-green">activa</span>
                ) : (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">revocada</span>
                )}
              </td>
              {puedeEscribir && <td className="px-4 py-3">{apiKey.activa && <RevokeApiKeyButton id={apiKey.id} />}</td>}
            </tr>
          ))}
          {apiKeys.length === 0 && (
            <tr><td colSpan={puedeEscribir ? 6 : 5} className="px-4 py-6 text-center text-gray-400">Todavía no hay API keys para esta empresa.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
