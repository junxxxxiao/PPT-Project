import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getTask, verifyToken } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  try {
    const task = await getTask(id);
    if (!verifyToken(task, token)) {
      return NextResponse.json({ error: "无权下载该任务。" }, { status: 403 });
    }
    if (!task.output?.pptxPath) {
      return NextResponse.json({ error: "PPTX 尚未生成。" }, { status: 404 });
    }

    const bytes = await readFile(task.output.pptxPath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(task.deck?.title || "deck")}.pptx"`
      }
    });
  } catch {
    return NextResponse.json({ error: "下载失败。" }, { status: 404 });
  }
}
