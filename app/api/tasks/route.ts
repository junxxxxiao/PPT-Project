import { NextRequest, NextResponse } from "next/server";
import { buildDeckPlan } from "@/lib/planner";
import { assertSafeText, checkRateLimit, getClientKey, isAllowedImage, randomId, randomToken } from "@/lib/security";
import { saveTask, saveUploadedAsset, updateTask } from "@/lib/storage";
import { writePptx } from "@/lib/pptx";
import { extractDocumentText } from "@/lib/documents";
import type { DeckTask, TemplateId, UploadedAsset } from "@/lib/types";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGES = 12;

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getClientKey(request), Number(process.env.DAILY_GENERATION_LIMIT || 20));
  if (!limit.ok) {
    return NextResponse.json({ error: "今日生成次数已达上限，请稍后再试。" }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const typedText = String(form.get("text") || "");
    const stylePrompt = String(form.get("stylePrompt") || "").slice(0, 500);
    const templateId = normalizeTemplate(String(form.get("templateId") || "boardroom"));
    const document = form.get("document");
    const imageFiles = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const imageAssignments = parseAssignments(String(form.get("imageAssignments") || "{}"));

    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json({ error: `最多上传 ${MAX_IMAGES} 张图片。` }, { status: 400 });
    }

    let documentText = "";
    let documentName: string | undefined;
    if (document instanceof File && document.size > 0) {
      documentText = await extractDocumentText(document);
      documentName = document.name;
    }

    const text = [typedText.trim(), documentText].filter(Boolean).join("\n\n");
    assertSafeText(text);

    const now = new Date().toISOString();
    const task: DeckTask = {
      id: randomId("task_"),
      token: randomToken(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      input: {
        text,
        templateId,
        stylePrompt,
        documentName,
        assets: []
      },
      revisions: []
    };

    await saveTask(task);

    const assets: UploadedAsset[] = [];
    for (const [index, file] of imageFiles.entries()) {
      if (!isAllowedImage(file.type)) {
        return NextResponse.json({ error: "图片仅支持 PNG、JPG、WEBP。" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "单张图片不能超过 8MB。" }, { status: 400 });
      }

      const id = randomId("asset_");
      const saved = await saveUploadedAsset(
        task.id,
        {
          id,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          pageHint: normalizePageHint(imageAssignments[index])
        },
        Buffer.from(await file.arrayBuffer())
      );
      assets.push(saved);
    }

    let working = await updateTask(task, {
      status: "processing",
      input: {
        ...task.input,
        assets
      }
    });

    const deck = await buildDeckPlan(working);
    working = await updateTask(working, { deck });
    const pptxPath = await writePptx(working);
    working = await updateTask(working, {
      status: "completed",
      output: { pptxPath }
    });

    return NextResponse.json({ taskId: working.id, token: working.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalizeTemplate(value: string): TemplateId {
  const allowed: TemplateId[] = ["boardroom", "fresh", "focus", "launch", "classic"];
  return allowed.includes(value as TemplateId) ? (value as TemplateId) : "boardroom";
}

function normalizePageHint(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 60 ? number : undefined;
}

function parseAssignments(raw: string) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
