import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    application: "ObraCerta",
    version: "0.1.0",
    database: "not_checked",
    note: "Este endpoint confirma que a aplicação responde; não verifica a ligação à base de dados.",
  });
}
