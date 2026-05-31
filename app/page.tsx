"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Download,
  FileText,
  ImagePlus,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { getTemplate, templates } from "@/lib/templates";
import type { PublicTask, SlideElement, TemplateId, SlidePlan } from "@/lib/types";

type PendingImage = {
  file: File;
  pageHint: string;
};

type Region = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

export default function Home() {
  const [text, setText] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [templateId, setTemplateId] = useState("boardroom");
  const [stylePrompt, setStylePrompt] = useState("");
  const [taskId, setTaskId] = useState("");
  const [token, setToken] = useState("");
  const [task, setTask] = useState<PublicTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pageIndex, setPageIndex] = useState("all");
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(1);
  const [region, setRegion] = useState<Region | null>(null);

  const loadTask = useCallback(
    async (id = taskId, accessToken = token) => {
      if (!id || !accessToken) return;
      const response = await fetch(`/api/tasks/${id}?token=${encodeURIComponent(accessToken)}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "读取任务失败。");
        return;
      }
      setTask(payload);
      setError("");
    },
    [taskId, token]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTask = params.get("task");
    const currentToken = params.get("token");
    if (currentTask && currentToken) {
      setTaskId(currentTask);
      setToken(currentToken);
      void loadTask(currentTask, currentToken);
    }
  }, [loadTask]);

  const deckSlides = task?.deck?.slides;

  useEffect(() => {
    if (deckSlides?.[0]) {
      setSelectedSlideIndex((current) => {
        const found = deckSlides.some((slide) => slide.index === current);
        return found ? current : deckSlides[0].index;
      });
    }
  }, [deckSlides]);

  const selectedTemplate = useMemo(
    () => getTemplate((task?.deck?.templateId || templateId) as TemplateId),
    [task?.deck?.templateId, templateId]
  );

  const selectedSlide = useMemo(
    () => task?.deck?.slides.find((slide) => slide.index === selectedSlideIndex) || task?.deck?.slides?.[0] || null,
    [selectedSlideIndex, task?.deck?.slides]
  );

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("text", text);
      form.append("templateId", templateId);
      form.append("stylePrompt", stylePrompt);
      if (document) form.append("document", document);
      images.forEach((item) => form.append("images", item.file));
      form.append("imageAssignments", JSON.stringify(images.map((item) => Number(item.pageHint) || undefined)));

      const response = await fetch("/api/tasks", {
        method: "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "生成失败。");

      setTaskId(payload.taskId);
      setToken(payload.token);
      window.history.replaceState(null, "", `/?task=${payload.taskId}&token=${payload.token}`);
      await loadTask(payload.taskId, payload.token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。");
    } finally {
      setLoading(false);
    }
  }

  async function revise() {
    if (!taskId || !token) return;
    if (!note.trim()) {
      setError("请输入修改需求。");
      return;
    }

    setError("");
    setEditing(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/edit?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          pageIndex: pageIndex === "all" ? (region && selectedSlide ? selectedSlide.index : undefined) : Number(pageIndex),
          region: region || undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "修改失败。");
      setNote("");
      setRegion(null);
      await loadTask(taskId, token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "修改失败。");
    } finally {
      setEditing(false);
    }
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
              <Sparkles size={19} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI PPT Maker</h1>
              <p className="text-sm text-slate-500">上传内容，生成可预览和可下载的 PPTX</p>
            </div>
          </div>
          {task?.canDownload ? (
            <a
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              href={`/api/tasks/${taskId}/download?token=${encodeURIComponent(token)}`}
            >
              <Download size={16} />
              下载 PPTX
            </a>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[390px_1fr]">
        <section className="space-y-4">
          <Panel title="内容输入" icon={<FileText size={18} />}>
            <textarea
              className="min-h-52 w-full resize-y rounded-md border border-line bg-white p-3 text-sm outline-none focus:border-leaf"
              placeholder="粘贴文案。已用 ---、第1页、Page 1、Slide 1 分页的内容会按页生成；未分页会自动拆页。"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-md border border-dashed border-line px-3 py-3 text-sm hover:border-leaf">
              <span className="flex items-center gap-2 text-slate-600">
                <UploadCloud size={16} />
                {document ? document.name : "上传 txt / md / docx 文档"}
              </span>
              <input
                className="hidden"
                type="file"
                accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setDocument(event.target.files?.[0] || null)}
              />
            </label>
          </Panel>

          <Panel title="图片素材" icon={<ImagePlus size={18} />}>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line px-3 py-4 text-sm text-slate-600 hover:border-leaf">
              <UploadCloud size={16} />
              上传 PNG / JPG / WEBP
              <input
                className="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) =>
                  setImages(
                    Array.from(event.target.files || []).map((file) => ({
                      file,
                      pageHint: ""
                    }))
                  )
                }
              />
            </label>
            {images.length > 0 ? (
              <div className="mt-3 space-y-2">
                {images.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="grid grid-cols-[1fr_96px] items-center gap-2 rounded-md bg-mist p-2 text-sm">
                    <span className="truncate">{item.file.name}</span>
                    <input
                      className="rounded-md border border-line px-2 py-1 text-sm"
                      placeholder="页码"
                      inputMode="numeric"
                      value={item.pageHint}
                      onChange={(event) => {
                        const copy = [...images];
                        copy[index] = { ...copy[index], pageHint: event.target.value };
                        setImages(copy);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="样式设置" icon={<Sparkles size={18} />}>
            <div className="grid gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`rounded-md border px-3 py-3 text-left text-sm transition ${
                    templateId === template.id ? "border-leaf bg-emerald-50" : "border-line bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setTemplateId(template.id)}
                >
                  <span className="block font-medium">{template.name}</span>
                  <span className="mt-1 block text-slate-500">{template.description}</span>
                </button>
              ))}
            </div>
            <textarea
              className="mt-3 min-h-24 w-full rounded-md border border-line p-3 text-sm outline-none focus:border-leaf"
              placeholder="补充风格需求，例如：更适合投资人路演、减少文字、科技感但不要太花。"
              value={stylePrompt}
              onChange={(event) => setStylePrompt(event.target.value)}
            />
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-[#bf4f40] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={submit}
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {loading ? "正在生成..." : "生成 PPT"}
            </button>
          </Panel>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        </section>

        <section className="space-y-5">
          <Panel
            title={task?.deck?.title || "在线预览"}
            subtitle={task?.deck?.subtitle || "生成完成后，这里会展示每页 HTML 预览。"}
            action={
              task ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-mist"
                  onClick={() => loadTask()}
                >
                  <RefreshCw size={15} />
                  刷新
                </button>
              ) : null
            }
          />

          {task?.deck ? (
            <>
              <Panel title="二次修改" icon={<MessageSquarePlus size={18} />}>
                <div className="grid gap-3 lg:grid-cols-[140px_1fr_auto]">
                  <select
                    className="rounded-md border border-line px-3 py-2 text-sm"
                    value={pageIndex}
                    onChange={(event) => setPageIndex(event.target.value)}
                  >
                    <option value="all">全部页面</option>
                    {task.deck.slides.map((slide) => (
                      <option key={slide.id} value={slide.index}>
                        第 {slide.index} 页
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-leaf"
                    placeholder="先在画布上拖拽框选内容，再输入修改需求，例如：这里要更强调价格信息。"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white hover:bg-[#16745d] disabled:opacity-60"
                    disabled={editing}
                    onClick={revise}
                  >
                    {editing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    重新生成
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  你可以直接在下方主画布框选页面中的任意区域，系统会把选区坐标一起带进修改请求。
                </p>
                {region ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-mist px-3 py-2 text-xs text-slate-600">
                    已选区：x {region.x}% y {region.y}% w {region.w}% h {region.h}%
                    <button className="font-medium text-leaf" type="button" onClick={() => setRegion(null)}>
                      清除
                    </button>
                  </div>
                ) : null}
              </Panel>

              <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">主画布</h3>
                    <p className="text-xs text-slate-500">点击页面缩略图切换，拖拽画布框选修改区域。</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    第 {selectedSlide?.index || 1} 页
                  </div>
                </div>
                {selectedSlide ? (
                  <SelectableSlide
                    key={selectedSlide.id}
                    slide={selectedSlide}
                    taskId={taskId}
                    token={token}
                    template={selectedTemplate}
                    region={region}
                    onRegionChange={setRegion}
                  />
                ) : null}
              </div>

              <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">页面列表</h3>
                <div className="grid gap-3">
                  {task.deck.slides.map((slide) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={`rounded-md border p-3 text-left transition ${
                        selectedSlideIndex === slide.index ? "border-leaf bg-emerald-50" : "border-line hover:border-slate-300"
                      }`}
                      onClick={() => {
                        setSelectedSlideIndex(slide.index);
                        setPageIndex(String(slide.index));
                        setRegion(null);
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          第 {slide.index} 页
                        </span>
                        <span className="text-xs text-slate-500">{slide.title}</span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <MiniSlide slide={slide} taskId={taskId} token={token} template={selectedTemplate} />
                        <div className="rounded-md bg-mist p-2 text-xs text-slate-600">
                          {slide.bullets.slice(0, 3).map((bullet) => (
                            <div key={bullet} className="line-clamp-2">
                              • {bullet}
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center text-slate-500">
              <div>
                <Sparkles className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="font-medium text-ink">还没有生成内容</p>
                <p className="mt-1 text-sm">在左侧输入文案并选择模板，几秒后就能看到预览。</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="font-semibold">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SelectableSlide({
  slide,
  taskId,
  token,
  template,
  region,
  onRegionChange
}: {
  slide: SlidePlan;
  taskId: string;
  token: string;
  template: ReturnType<typeof getTemplate>;
  region: Region | null;
  onRegionChange: (region: Region | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<Region | null>(null);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<PointerPoint | null>(null);

  function toPercent(point: PointerPoint) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((point.x - rect.left) / rect.width) * 100,
      y: ((point.y - rect.top) / rect.height) * 100
    };
  }

  function clampRegion(regionValue: Region): Region {
    return {
      x: Math.max(0, Math.min(100, regionValue.x)),
      y: Math.max(0, Math.min(100, regionValue.y)),
      w: Math.max(0.5, Math.min(100 - regionValue.x, regionValue.w)),
      h: Math.max(0.5, Math.min(100 - regionValue.y, regionValue.h))
    };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    const point = toPercent({ x: event.clientX, y: event.clientY });
    setDraft({ x: point.x, y: point.y, w: 0, h: 0 });
    onRegionChange(null);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !startRef.current) return;
    const start = toPercent(startRef.current);
    const current = toPercent({ x: event.clientX, y: event.clientY });
    setDraft(
      clampRegion({
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        w: Math.abs(current.x - start.x),
        h: Math.abs(current.y - start.y)
      })
    );
  }

  function finishSelection() {
    setDragging(false);
    startRef.current = null;
    if (draft && draft.w > 1 && draft.h > 1) {
      onRegionChange(clampRegion(draft));
    }
  }

  const displayRegion = region || draft;

  return (
    <div
      ref={containerRef}
      className="slide-canvas relative overflow-hidden rounded-md border border-line"
      style={{ background: template.background, color: template.foreground }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishSelection}
      onPointerLeave={finishSelection}
    >
      <div className="absolute left-0 top-0 h-1 w-full" style={{ background: template.accent }} />
      <div className="absolute right-[5%] top-[4%] text-xs" style={{ color: template.muted }}>
        {String(slide.index).padStart(2, "0")}
      </div>
      {slide.elements.map((element) => (
        <SlideElementView key={element.id} element={element} taskId={taskId} token={token} template={template} />
      ))}
      {displayRegion ? (
        <div
          className="absolute border-2 border-dashed border-coral bg-coral/10"
          style={{
            left: `${displayRegion.x}%`,
            top: `${displayRegion.y}%`,
            width: `${displayRegion.w}%`,
            height: `${displayRegion.h}%`
          }}
        />
      ) : null}
      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-[11px] text-slate-600 shadow">
        {dragging ? "松开鼠标完成框选" : "拖拽画布框选区域"}
      </div>
    </div>
  );
}

function MiniSlide({
  slide,
  taskId,
  token,
  template
}: {
  slide: SlidePlan;
  taskId: string;
  token: string;
  template: ReturnType<typeof getTemplate>;
}) {
  return (
    <div className="slide-canvas relative overflow-hidden rounded-md border border-line">
      <div className="absolute left-0 top-0 h-1 w-full" style={{ background: template.accent }} />
      {slide.elements.map((element) => (
        <SlideElementView key={element.id} element={element} taskId={taskId} token={token} template={template} />
      ))}
    </div>
  );
}

function SlideElementView({
  element,
  taskId,
  token,
  template
}: {
  element: SlideElement;
  taskId: string;
  token: string;
  template: ReturnType<typeof getTemplate>;
}) {
  const style = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.w}%`,
    height: `${element.h}%`
  };

  if (element.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Task assets are tokenized API responses and should not be cached by Next Image.
      <img
        alt=""
        className="absolute rounded-md object-cover"
        src={`/api/tasks/${taskId}/assets/${element.assetId}?token=${encodeURIComponent(token)}`}
        style={style}
      />
    );
  }

  if (element.kind === "shape") {
    const isLine = element.shape === "line";
    return (
      <div
        className={`absolute ${element.shape === "pill" ? "rounded-full" : "rounded-md"}`}
        style={{
          ...style,
          background: isLine ? element.line || template.accent : element.fill || "transparent",
          border: element.line && !isLine ? `1px solid ${element.line}` : undefined,
          opacity: element.opacity !== undefined ? Math.max(0, Math.min(100, 100 - element.opacity)) / 100 : undefined
        }}
      />
    );
  }

  const isTitle = element.role === "title";
  const isMetric = element.role === "metric";
  const isNote = element.role === "note";
  return (
    <div
      className={`absolute whitespace-pre-line leading-snug ${isTitle ? "text-[clamp(18px,2.4vw,34px)] font-bold" : isMetric ? "text-[clamp(24px,3vw,42px)] font-bold" : isNote ? "text-xs" : "text-[clamp(13px,1.4vw,18px)]"}`}
      style={{
        ...style,
        color: element.color || (isNote ? template.secondary : template.foreground),
        fontWeight: element.bold ? 700 : undefined,
        textAlign: element.align
      }}
    >
      {element.text}
    </div>
  );
}
