import { readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const dataRoot = process.env.PPT_APP_DATA_DIR || path.join(process.cwd(), ".data");
const days = Number(process.env.CLEANUP_DAYS || 7);
const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

const taskDir = path.join(dataRoot, "tasks");
const uploadDir = path.join(dataRoot, "uploads");
const outputDir = path.join(dataRoot, "outputs");

let removed = 0;

for (const fileName of await list(taskDir)) {
  if (!fileName.endsWith(".json")) continue;
  const filePath = path.join(taskDir, fileName);
  const taskId = fileName.replace(/\.json$/, "");
  const createdAt = await readTaskCreatedAt(filePath);
  const fallbackTime = await readMtime(filePath);
  const timestamp = createdAt ? Date.parse(createdAt) : fallbackTime;

  if (Number.isFinite(timestamp) && timestamp < cutoff) {
    await rm(filePath, { force: true });
    await rm(path.join(uploadDir, taskId), { recursive: true, force: true });
    await rm(path.join(outputDir, taskId), { recursive: true, force: true });
    removed += 1;
  }
}

console.log(`Cleaned ${removed} task(s) older than ${days} day(s).`);

async function list(dir) {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function readTaskCreatedAt(filePath) {
  try {
    const task = JSON.parse(await readFile(filePath, "utf8"));
    return typeof task.createdAt === "string" ? task.createdAt : undefined;
  } catch {
    return undefined;
  }
}

async function readMtime(filePath) {
  try {
    return (await stat(filePath)).mtimeMs;
  } catch {
    return Date.now();
  }
}
