import { NextResponse } from "next/server";
import { readLocalDb } from "@/modules/shared/lib/local-db";

export async function GET(request: Request) {
  try {
    const db = await readLocalDb();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    const filteredPromotions = storeId
      ? db.promotions.filter((promotion) => promotion.store_id === storeId)
      : db.promotions;

    const promotions = filteredPromotions.map((promotion) => ({
      ...promotion,
      store: db.stores.find((store) => store.id === promotion.store_id) ?? null,
    }));

    return NextResponse.json({ promotions });
  } catch {
    return NextResponse.json({ error: "讀取本地 promotions 失敗" }, { status: 500 });
  }
}
