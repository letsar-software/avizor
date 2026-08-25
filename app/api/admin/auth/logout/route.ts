import { failure, requestId, success } from "@/lib/http/responses";
import { revokeAdminSession } from "@/lib/admin/auth";
import { clearAdminSessionCookie, readAdminSessionToken } from "@/lib/admin/session-cookie";

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const token = await readAdminSessionToken();
    if (token) await revokeAdminSession(token);
    await clearAdminSessionCookie();
    return success({ ok: true }, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
