import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getTask, verifyToken } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  try {
    const task = await getTask(id);
    if (!verifyToken(task, token)) {
      return NextResponse.json({ error: "无权访问该资源。" }, { status: 403 });
    }

    const asset = task.input.assets.find((item) => item.id === assetId);
    if (!asset) {
      return NextResponse.json({ error: "资源不存在。" }, { status: 404 });
    }

    const bytes = await readFile(asset.path);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "资源读取失败。" }, { status: 404 });
  }
}
