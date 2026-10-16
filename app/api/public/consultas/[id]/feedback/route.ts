import { addFeedback } from "@/lib/consultas/interactions-v2";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { feedbackV2Schema, parseInput, parsePublicId } from "@/lib/security/validation";
import { enforceConsultationInteractionLimit } from "@/lib/security/rate-limit";
export async function POST(request: Request, {params}: {params: Promise<{id:string}>}) {
  const rid=requestId(request);
  try {
    await enforceConsultationInteractionLimit(request);
    const body=parseInput(feedbackV2Schema,await readJsonBody(request));

    const result=await addFeedback(parsePublicId((await params).id),body,request.headers.get("x-consulta-token"));
    return success({id:result.rows[0]?.id},rid,{},201);
  } catch(error) { return failure(error,rid); }
}
