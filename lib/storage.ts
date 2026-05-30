import { mkdir, readFile, writeFile, stat } from "fs/promises";
import path from "path";
import type { DeckTask, PublicTask, UploadedAsset } from "./types";

const dataRoot = process.env.PPT_APP_DATA_DIR || path.join(process.cwd(), ".data");

export const paths = {
  root: dataRoot,
  tasks: path.join(dataRoot, "tasks"),
  uploads: path.join(dataRoot, "uploads"),
  outputs: path.join(dataRoot, "outputs")
};

export async function ensureStorage() {
  await Promise.all([mkdir(paths.tasks, { recursive: true }), mkdir(paths.uploads, { recursive: true }), mkdir(paths.outputs, { recursive: true })]);
}

export function taskPath(taskId: string) {
  return path.join(paths.tasks, `${taskId}.json`);
}

export function uploadDir(taskId: string) {
  return path.join(paths.uploads, taskId);
}

export function outputDir(taskId: string) {
  return path.join(paths.outputs, taskId);
}

export async function saveTask(task: DeckTask) {
  await ensureStorage();
  await writeFile(taskPath(task.id), JSON.stringify(task, null, 2), "utf8");
}

export async function getTask(taskId: string) {
  await ensureStorage();
  const raw = await readFile(taskPath(taskId), "utf8");
  return JSON.parse(raw) as DeckTask;
}

export async function updateTask(task: DeckTask, patch: Partial<DeckTask>) {
  const updated: DeckTask = {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await saveTask(updated);
  return updated;
}

export function publicTask(task: DeckTask): PublicTask {
  const { token: _token, ...rest } = task;
  return {
    ...rest,
    canDownload: Boolean(task.output?.pptxPath)
  };
}

export function verifyToken(task: DeckTask, token?: string | null) {
  return Boolean(token && token === task.token);
}

export async function saveUploadedAsset(taskId: string, asset: Pick<UploadedAsset, "id" | "originalName" | "mimeType" | "size" | "pageHint">, bytes: Buffer) {
  await mkdir(uploadDir(taskId), { recursive: true });
  const extension = guessExtension(asset.originalName, asset.mimeType);
  const target = path.join(uploadDir(taskId), `${asset.id}${extension}`);
  await writeFile(target, bytes);
  return {
    ...asset,
    path: target
  } satisfies UploadedAsset;
}

export async function fileExists(filePath?: string) {
  if (!filePath) return false;
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function guessExtension(name: string, mimeType: string) {
  const ext = path.extname(name);
  if (ext) return ext;
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".bin";
}
