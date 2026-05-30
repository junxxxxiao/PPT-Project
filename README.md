# AI PPT Maker

一个轻量试用版 AI PPT 自动生成工具。它支持文案/文档/图片输入、模板选择、HTML 在线预览、框选或按页备注修改，以及下载可编辑的 `.pptx` 文件。

## 功能

- 文案输入，支持用 `---`、`第1页`、`Page 1`、`Slide 1` 显式分页。
- 上传 `txt`、`md`、`docx` 文档。
- 上传 `png`、`jpg`、`webp` 图片，可指定页码。
- 内置 5 套模板。
- 生成结构化 `Deck -> Slide -> Element` 数据。
- HTML 在线预览和 `pptxgenjs` 导出 PPTX。
- 预览页支持拖拽框选页面区域，并把区域坐标随修改需求提交。
- 用 `task_id + token` 保护预览、修改、下载。
- 默认本地规则生成，无需 AI key；配置 AI 环境变量后可走 OpenAI-compatible API。

## 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

打开 `http://localhost:3000`。

## 可选 AI 配置

默认会用内置规划器，适合快速试用。需要接入外部大模型时，在 `.env` 中设置：

```bash
AI_PROVIDER=openai-compatible
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_API_KEY=replace-me
AI_MODEL=gpt-4.1-mini
```

AI key 只在服务端环境变量中使用，前端不会接触或暴露。

## 试用部署

```bash
cp .env.example .env
docker compose up -d --build
```

建议在服务器上用 Nginx 反代到 `http://127.0.0.1:3000`，并配置 HTTPS。

数据默认写入 Docker volume，对应容器内 `/data/ppt-app`。如果不使用 Docker，本地默认写入 `.data/`。

## 验证与清理

启动服务后可以跑一条端到端烟测：

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

服务器上建议用 cron 每天清理过期任务：

```bash
CLEANUP_DAYS=7 npm run cleanup
```

## 后续升级

- SQLite/Prisma 或 PostgreSQL 保存任务结构。
- 对象存储保存上传文件和导出文件。
- 独立 Worker 处理长任务。
- 账号、历史记录、模板管理和计费。
