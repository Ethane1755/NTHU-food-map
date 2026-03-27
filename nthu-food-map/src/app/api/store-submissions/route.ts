import { NextResponse } from "next/server";
import {
  readStoreSubmissionQueue,
  writeStoreSubmissionQueue,
} from "@/modules/shared/lib/local-db";

export async function GET() {
  try {
    const submissions = await readStoreSubmissionQueue();
    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ error: "讀取本地 submissions 失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      category?: string;
      address?: string | null;
      phone?: string | null;
      description?: string | null;
      lat?: number | null;
      lng?: number | null;
    };

    if (!body.name?.trim() || !body.category?.trim() || !body.address?.trim()) {
      return NextResponse.json({ error: "name、category、address 為必填" }, { status: 400 });
    }

    const queue = await readStoreSubmissionQueue();
    const submission = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      category: body.category.trim(),
      address: body.address.trim(),
      phone: body.phone?.trim() || null,
      description: body.description?.trim() || null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    };

    queue.unshift(submission);
    await writeStoreSubmissionQueue(queue);

    return NextResponse.json({ submission }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "儲存本地 submission 失敗" }, { status: 500 });
  }
}
