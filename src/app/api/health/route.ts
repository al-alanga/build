import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      application: "ObraCerta",
      version: "0.1.0",
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        application: "ObraCerta",
        version: "0.1.0",
        database: "unavailable",
        note: "Verifique DATABASE_URL, o estado do projecto Supabase e a conectividade PostgreSQL.",
      },
      { status: 503 },
    );
  }
}
