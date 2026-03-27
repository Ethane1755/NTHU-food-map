import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url")?.trim();
  if (!source) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(source);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("Unsupported protocol", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 NTHU-food-map-image-proxy",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      next: {
        revalidate: 86400,
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream image unavailable", { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response("Upstream is not an image", { status: 415 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
