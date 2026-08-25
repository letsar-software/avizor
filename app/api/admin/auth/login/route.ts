import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminLoginSchema, parseInput } from "@/lib/security/validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { authenticateAdmin, createAdminSession, touchAdminLastAccess } from "@/lib/admin/auth";
import { setAdminSessionCookie } from "@/lib/admin/session-cookie";

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const body = parseInput(adminLoginSchema, await readJsonBody(request));
    await enforceRateLimit(RATE_LIMITS.adminLogin, body.email);

    const user = await authenticateAdmin(body.email, body.password);
    const session = await createAdminSession(user.id);
    await touchAdminLastAccess(user.id);
    await setAdminSessionCookie(session.token, session.expiraEn);

    return success(user, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
