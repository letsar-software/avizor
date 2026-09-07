import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runRetentionMaintenance } from "@/lib/maintenance/retention";

function authorized(request: Request) {
  const secret = process.env.MAINTENANCE_CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const result = await runRetentionMaintenance();
  return NextResponse.json(result, { status: result.failed ? 207 : 200 });
}
