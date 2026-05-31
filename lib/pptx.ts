import { mkdir } from "fs/promises";
import path from "path";
import pptxgen from "pptxgenjs";
import { getTemplate } from "./templates";
import { outputDir } from "./storage";
import type { DeckTask } from "./types";

const WIDE_W = 13.333;
const WIDE_H = 7.5;

export async function writePptx(task: DeckTask) {
  if (!task.deck) throw new Error("缺少可导出的PPT结构。");

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AI PPT Maker";
  pptx.subject = task.deck.subtitle;
  pptx.title = task.deck.title;
  pptx.company = "AI PPT Maker";
  pptx.theme = {
    headFontFace: getTemplate(task.deck.templateId).fontFace,
    bodyFontFace: getTemplate(task.deck.templateId).fontFace
  };

  const template = getTemplate(task.deck.templateId);
  const assetMap = new Map(task.input.assets.map((asset) => [asset.id, asset]));

  for (const slidePlan of task.deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: color(template.background) };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: WIDE_W,
      h: 0.14,
      fill: { color: color(template.accent) },
      line: { color: color(template.accent), transparency: 100 }
    });
    slide.addText(String(slidePlan.index).padStart(2, "0"), {
      x: 11.7,
      y: 0.25,
      w: 0.8,
      h: 0.25,
      fontFace: template.fontFace,
      fontSize: 8,
      color: color(template.muted),
      align: "right"
    });

    for (const element of slidePlan.elements) {
      if (element.kind === "text") {
        const isTitle = element.role === "title" || element.role === "section";
        const isMetric = element.role === "metric";
        const isNote = element.role === "note";
        slide.addText(element.text, {
          x: pctX(element.x),
          y: pctY(element.y),
          w: pctX(element.w),
          h: pctY(element.h),
          fontFace: template.fontFace,
          fontSize: isTitle ? 27 : isMetric ? 24 : isNote ? 9 : 15,
          bold: isTitle,
          breakLine: false,
          fit: "shrink",
          valign: "top",
          color: color(element.color || (isNote ? template.secondary : template.foreground)),
          margin: 0.02,
          paraSpaceAfter: isTitle ? 0 : 8,
          align: element.align
        });
      } else if (element.kind === "image") {
        const asset = assetMap.get(element.assetId);
        if (asset) {
          try {
            slide.addImage({
              path: asset.path,
              x: pctX(element.x),
              y: pctY(element.y),
              w: pctX(element.w),
              h: pctY(element.h)
            });
          } catch {
            slide.addText("图片暂不可用", {
              x: pctX(element.x),
              y: pctY(element.y),
              w: pctX(element.w),
              h: pctY(element.h),
              color: color(template.muted),
              fontFace: template.fontFace,
              fontSize: 14,
              align: "center",
              valign: "middle",
              fill: { color: "FFFFFF", transparency: 35 }
            });
          }
        }
      } else if (element.kind === "shape") {
        const shapeType = element.shape === "pill" ? pptx.ShapeType.roundRect : element.shape === "line" ? pptx.ShapeType.line : pptx.ShapeType.rect;
        slide.addShape(shapeType, {
          x: pctX(element.x),
          y: pctY(element.y),
          w: pctX(element.w),
          h: pctY(element.h),
          fill: element.shape === "line" ? { color: color(element.line || template.accent) } : element.fill ? { color: color(element.fill), transparency: element.opacity ?? 0 } : { color: "FFFFFF", transparency: 100 },
          line: element.shape === "line" ? { color: color(element.line || template.accent), transparency: 0 } : { color: color(element.line || element.fill || template.accent), transparency: 80 }
        });
      }
    }
  }

  const dir = outputDir(task.id);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${task.id}.pptx`);
  await pptx.writeFile({ fileName: filePath });
  return filePath;
}

function pctX(value: number) {
  return (value / 100) * WIDE_W;
}

function pctY(value: number) {
  return (value / 100) * WIDE_H;
}

function color(hex: string) {
  return hex.replace("#", "");
}
