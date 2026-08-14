import { NextResponse } from "next/server";
import { searchLocalidades } from "@/lib/localidades/normalize";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ data: [] });

  try {
    const localidades = await searchLocalidades(query.slice(0, 100));
    return NextResponse.json({ data: localidades.slice(0, 8) }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ data: [] }, { status: 503 });
  }
}
