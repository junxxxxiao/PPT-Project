import { NextRequest, NextResponse } from "next/server";
import { getTask, publicTask, verifyToken } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  try {
    const task = await getTask(id);
    if (!verifyToken(task, token)) {
      return NextResponse.json({ error: "无权访问该任务。" }, { status: 403 });
    }
    return NextResponse.json(publicTask(task));
  } catch {
    return NextResponse.json({ error: "任务不存在。" }, { status: 404 });
  }
}
