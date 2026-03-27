import { NextResponse } from "next/server";
import { readLocalDb } from "@/modules/shared/lib/local-db";

export async function GET() {
  try {
    const db = await readLocalDb();
    return NextResponse.json({ stores: db.stores });
  } catch {
    return NextResponse.json({ error: "讀取本地 stores 失敗" }, { status: 500 });
  }
}
