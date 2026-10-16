import { enforcePublicResultReadLimit } from "@/lib/security/rate-limit";
import { getPublicResult } from "@/lib/consultas/public-result";
import { failure, requestId, success } from "@/lib/http/responses";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try { await enforcePublicResultReadLimit(request); return success(await getPublicResult((await params).id), rid); }
  catch (error) { return failure(error, rid); }
}
