import { createAgronomicAdvisory, listAgronomicAdvisories } from "@/lib/advisories/repository";
import { requireAdminAccess } from "@/lib/admin/access";
import { failure, requestId, success } from "@/lib/http/responses";
import { adminAdvisoryCreateSchema, parseInput } from "@/lib/security/validation";

export async function GET(request: Request) {
  const id = requestId(request);
  try { await requireAdminAccess(request, "reglas", "read"); return success(await listAgronomicAdvisories(), id); }
  catch (error) { return failure(error, id); }
}
export async function POST(request: Request) {
  const id = requestId(request);
  try {
    await requireAdminAccess(request, "reglas", "write");
    const value = parseInput(adminAdvisoryCreateSchema, await request.json());
    const advisory = await createAgronomicAdvisory({
      crop_id: value.crop_id ?? null, category_id: value.category_id, scope_type: value.scope_type,
      scope_id: value.scope_id ?? null, status: value.status, title: value.title, message: value.message,
      recommended_action: value.recommended_action, starts_at: value.starts_at, ends_at: value.ends_at ?? null,
      active: value.active ?? true, priority: value.priority ?? 0, source_type: value.source_type,
      source_name: value.source_name, source_url: value.source_url ?? null, validated_by: value.validated_by,
      reviewed_at: value.reviewed_at, notes: value.notes ?? null,
    });
    return success(advisory, id, {}, 201);
  } catch (error) { return failure(error, id); }
}
