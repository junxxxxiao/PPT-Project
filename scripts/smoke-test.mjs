const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const form = new FormData();
form.set(
  "text",
  [
    "第一页：产品概览",
    "目标用户：创业团队和职场用户",
    "",
    "第二页：核心能力",
    "上传文案和图片",
    "在线预览并框选修改",
    "",
    "第三页：安全与部署",
    "服务端保存AI Key",
    "任务Token保护访问"
  ].join("\n")
);
form.set("templateId", "boardroom");
form.set("stylePrompt", "简洁专业");

const create = await fetch(`${baseUrl}/api/tasks`, { method: "POST", body: form });
const payload = await create.json();
assert(create.ok, `create failed: ${JSON.stringify(payload)}`);

const taskUrl = `${baseUrl}/api/tasks/${payload.taskId}?token=${payload.token}`;
let task = await (await fetch(taskUrl)).json();
assert(task.deck?.slides?.length === 3, `expected 3 slides, got ${task.deck?.slides?.length}`);

const edit = await fetch(`${baseUrl}/api/tasks/${payload.taskId}/edit?token=${payload.token}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pageIndex: 2,
    region: { x: 10, y: 20, w: 30, h: 15 },
    note: "把框选区域改得更清晰"
  })
});
assert(edit.ok, `edit failed: ${await edit.text()}`);

task = await (await fetch(taskUrl)).json();
assert(task.revisions?.at(-1)?.region?.w === 30, "region revision was not persisted");

const download = await fetch(`${baseUrl}/api/tasks/${payload.taskId}/download?token=${payload.token}`);
const bytes = await download.arrayBuffer();
assert(download.ok && bytes.byteLength > 1000, "download did not return a PPTX file");

console.log(`Smoke test passed for ${payload.taskId}.`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
