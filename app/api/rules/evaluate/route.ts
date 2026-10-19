import { RulesEvaluationService } from "@/lib/rules/evaluation-service";
import { internalOrAnonymous } from "@/lib/lots/request-actor";
import { failure, requestId, success } from "@/lib/http/responses";
import { parseInput, rulesEvaluateSchema } from "@/lib/security/validation";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const input = parseInput(rulesEvaluateSchema, await request.json());
    return success(await new RulesEvaluationService().evaluate({
      lot_id: input.lot_id, crop_id: input.crop_id, phenology: input.phenology,
      scope: input.scope ? { regionId: input.scope.region_id, farmId: input.scope.farm_id, fieldId: input.scope.field_id } : undefined,
      weather: input.weather,
    }, { actor: internalOrAnonymous(request) }), id);
  } catch (error) { return failure(error, id); }
}
