import { NextRequest, NextResponse } from "next/server";
import { buildDeckPlan } from "@/lib/planner";
import { randomId } from "@/lib/security";
import { getTask, updateTask, verifyToken } from "@/lib/storage";
import { writePptx } from "@/lib/pptx";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  try {
    const task = await getTask(id);
    if (!verifyToken(task, token)) {
      return NextResponse.json({ error: "无权修改该任务。" }, { status: 403 });
    }

    const body = await request.json();
    const note = String(body.note || "").trim().slice(0, 1000);
    const pageIndex = body.pageIndex ? Number(body.pageIndex) : undefined;
    const safePageIndex = Number.isInteger(pageIndex) && Number(pageIndex) > 0 ? Number(pageIndex) : undefined;
    const region = normalizeRegion(body.region);
    if (!note) {
      return NextResponse.json({ error: "请输入修改需求。" }, { status: 400 });
    }

    let working = await updateTask(task, {
      status: "processing",
      revisions: [
        ...task.revisions,
        {
          id: randomId("rev_"),
          createdAt: new Date().toISOString(),
          pageIndex: safePageIndex,
          note,
          region
        }
      ]
    });

    const deck = await buildDeckPlan(working, { pageIndex: safePageIndex, note });
    working = await updateTask(working, { deck });
    const pptxPath = await writePptx(working);
    working = await updateTask(working, {
      status: "completed",
      output: { pptxPath }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "修改失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalizeRegion(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const x = Number(record.x);
  const y = Number(record.y);
  const w = Number(record.w);
  const h = Number(record.h);
  if (![x, y, w, h].every(Number.isFinite)) return undefined;
  if (w < 1 || h < 1) return undefined;
  return {
    x: clamp(x),
    y: clamp(y),
    w: clamp(w),
    h: clamp(h)
  };
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}
