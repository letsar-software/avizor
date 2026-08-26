"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/admin/auth";
import type { ReglaAgronomicaV2 } from "@/types";
import { hasAccess } from "@/lib/admin/permissions";
import { REGLA_ESTADOS } from "@/lib/rules/condition-spec";
import { useRuleDefinitionEditor } from "@/components/admin/rule-editor/useRuleDefinitionEditor";
import RuleMetaFields from "@/components/admin/rule-editor/RuleMetaFields";
import NivelEditor from "@/components/admin/rule-editor/NivelEditor";

export default function RuleEditor({ regla, rol }: { regla: ReglaAgronomicaV2; rol: AdminRole }) {
  const router = useRouter();
  const locked = regla.estado === "vigente"; // RN-004: una vigente no se edita in place.
  const puedePromover = hasAccess(rol, "reglas_promover", "write");
  const estadoOptions = REGLA_ESTADOS.filter((value) => value !== "vigente" || puedePromover);

  const [estado, setEstado] = useState<ReglaAgronomicaV2["estado"]>(regla.estado);
  const [validadoPor, setValidadoPor] = useState(regla.validado_por ?? "");
  const [validadoEn, setValidadoEn] = useState(regla.validado_en ? regla.validado_en.slice(0, 16) : "");
  const [saving, setSaving] = useState(false);
  const [forking, setForking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const editor = useRuleDefinitionEditor(regla.definicion.niveles);

  async function handleFork() {
    setForking(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/reglas/${regla.id}/versiones`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos crear la nueva versión.");
      router.push(`/admin/reglas/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la nueva versión.");
      setForking(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      if (estado !== regla.estado) payload.estado = estado;
      if (!locked) payload.definicion = { niveles: editor.niveles, sin_coincidencia: regla.definicion.sin_coincidencia };
      if (validadoPor && validadoPor !== (regla.validado_por ?? "")) payload.validado_por = validadoPor;
      if (validadoEn) payload.validado_en = new Date(validadoEn).toISOString();

      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios para guardar.");
        return;
      }

      const response = await fetch(`/api/admin/reglas/${regla.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "No pudimos guardar los cambios.");
      setMessage("Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {locked && (
        <div className="flex items-center justify-between gap-4 rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>Esta regla está vigente: la definición no se puede editar in place. Para cambiar umbrales hay que crear una nueva versión.</p>
          <button type="button" onClick={handleFork} disabled={forking} className="shrink-0 rounded border border-amber-700 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60">
            {forking ? "Creando..." : "Crear nueva versión"}
          </button>
        </div>
      )}
      {error && <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded bg-avizor-green-light px-4 py-3 text-sm text-avizor-green">{message}</p>}

      <RuleMetaFields
        estado={estado}
        estadoOptions={estadoOptions}
        onEstadoChange={setEstado}
        validadoPor={validadoPor}
        onValidadoPorChange={setValidadoPor}
        validadoEn={validadoEn}
        onValidadoEnChange={setValidadoEn}
      />

      <div className="space-y-4">
        {editor.niveles.map((nivel, nivelIndex) => (
          <NivelEditor
            key={nivelIndex}
            nivel={nivel}
            locked={locked}
            onUpdateField={(field, value) => editor.updateNivelField(nivelIndex, field, value)}
            onRemove={() => editor.removeNivel(nivelIndex)}
            onAddCondicion={() => editor.addCondicion(nivelIndex)}
            onRemoveCondicion={(condIndex) => editor.removeCondicion(nivelIndex, condIndex)}
            onUpdateCondicion={(condIndex, updater) => editor.updateCondicion(nivelIndex, condIndex, updater)}
            onOperadorChange={(condIndex, operador) => editor.handleOperadorChange(nivelIndex, condIndex, operador)}
            onAgregadorChange={(condIndex, agregador) => editor.handleAgregadorChange(nivelIndex, condIndex, agregador)}
          />
        ))}
        {!locked && (
          <button type="button" onClick={editor.addNivel} className="text-sm text-avizor-green hover:underline">
            + Agregar nivel
          </button>
        )}
      </div>

      <button type="submit" disabled={saving} className="rounded bg-avizor-green px-4 py-2 text-sm font-medium text-white hover:bg-avizor-green-mid disabled:opacity-60">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
