import { NextResponse } from "next/server";
import { readLocalDb, writeLocalDb } from "@/modules/shared/lib/local-db";
import type { Comment } from "@/modules/shared/types";

interface CommentPayload {
  id: string;
  store_id: string;
  text: string;
  rating: number;
  created_at: string;
  author: string;
}

function toPayload(comment: Comment): CommentPayload {
  const fallbackAuthor =
    comment.user_id.startsWith("local:") && comment.user_id.length > 6
      ? comment.user_id.slice(6)
      : "匿名";

  return {
    id: comment.id,
    store_id: comment.store_id,
    text: comment.text,
    rating: comment.rating,
    created_at: comment.created_at,
    author: comment.user?.user_metadata?.full_name ?? fallbackAuthor,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json({ error: "store_id 為必填" }, { status: 400 });
    }

    const db = await readLocalDb();
    const comments = db.comments
      .filter((comment) => comment.store_id === storeId)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map(toPayload);

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "讀取評論失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      store_id?: string;
      text?: string;
      rating?: number;
      author?: string;
    };

    const storeId = body.store_id?.trim();
    const text = body.text?.trim();
    const rating = Number(body.rating);
    const author = body.author?.trim() || "我";

    if (!storeId || !text) {
      return NextResponse.json({ error: "store_id 與 text 為必填" }, { status: 400 });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating 需介於 1 到 5" }, { status: 400 });
    }

    const db = await readLocalDb();
    const comment: Comment = {
      id: crypto.randomUUID(),
      store_id: storeId,
      user_id: `local:${author}`,
      text,
      rating,
      created_at: new Date().toISOString(),
      user: {
        user_metadata: {
          full_name: author,
        },
      },
    };

    db.comments.unshift(comment);
    await writeLocalDb(db);

    return NextResponse.json({ comment: toPayload(comment) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "新增評論失敗" }, { status: 500 });
  }
}
