import { cookies } from "next/headers";
import { failure, requestId, success } from "@/lib/http/responses";
import { ADMIN_SESSION_COOKIE, revokeAdminSession } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) await revokeAdminSession(token);
    jar.delete(ADMIN_SESSION_COOKIE);
    return success({ ok: true }, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
