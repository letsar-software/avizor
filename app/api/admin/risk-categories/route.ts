import { requireAdminAccess } from "@/lib/admin/access";
import { createRiskCategory, getActiveRiskCategories } from "@/lib/rules/category-repository";
import { failure, requestId, success } from "@/lib/http/responses";
import { adminRiskCategoryCreateSchema, parseInput } from "@/lib/security/validation";

export async function GET(request: Request) {
  const id = requestId(request);
  try { await requireAdminAccess(request, "reglas", "read"); return success(await getActiveRiskCategories(), id); }
  catch (error) { return failure(error, id); }
}
export async function POST(request: Request) {
  const id = requestId(request);
  try {
    await requireAdminAccess(request, "reglas", "write");
    const input = parseInput(adminRiskCategoryCreateSchema, await request.json());
    return success(await createRiskCategory(input), id, {}, 201);
  } catch (error) { return failure(error, id); }
}
