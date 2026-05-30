import crypto from "crypto";
import { NextRequest } from "next/server";

const hits = new Map<string, { count: number; resetAt: number }>();

export function randomId(prefix = "") {
  return `${prefix}${crypto.randomBytes(12).toString("hex")}`;
}

export function randomToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return ip;
}

export function checkRateLimit(key: string, limit = 20, windowMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  current.count += 1;
  return { ok: true, remaining: Math.max(0, limit - current.count) };
}

export function assertSafeText(text: string) {
  if (!text.trim()) {
    throw new Error("请输入文案或上传可解析的文档。");
  }

  if (text.length > 24000) {
    throw new Error("文案过长，请先精简到 24000 字以内。");
  }
}

export function isAllowedImage(mimeType: string) {
  return ["image/png", "image/jpeg", "image/webp"].includes(mimeType);
}

export function isAllowedDocument(mimeType: string, name: string) {
  const lower = name.toLowerCase();
  return (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".docx")
  );
}
