import type { TemplateId } from "./types";

export type DeckTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  secondary: string;
  fontFace: string;
};

export const templates: DeckTemplate[] = [
  {
    id: "boardroom",
    name: "商务简报",
    description: "克制、清晰，适合方案汇报和商业计划。",
    background: "#F8FAFC",
    foreground: "#17212B",
    muted: "#5D6B78",
    accent: "#1D8A6F",
    secondary: "#D55B4A",
    fontFace: "Aptos"
  },
  {
    id: "fresh",
    name: "清新增长",
    description: "轻快、有呼吸感，适合产品介绍和增长复盘。",
    background: "#F4FBF8",
    foreground: "#18342F",
    muted: "#60736E",
    accent: "#2C9B7C",
    secondary: "#C79A31",
    fontFace: "Aptos"
  },
  {
    id: "focus",
    name: "深色聚焦",
    description: "高对比、沉稳，适合路演和重点表达。",
    background: "#111827",
    foreground: "#F8FAFC",
    muted: "#B7C0CC",
    accent: "#62D6B1",
    secondary: "#F4B860",
    fontFace: "Aptos"
  },
  {
    id: "launch",
    name: "发布会",
    description: "更强视觉张力，适合新品发布和活动方案。",
    background: "#FFF8F2",
    foreground: "#221E1B",
    muted: "#71655C",
    accent: "#D55B4A",
    secondary: "#1D8A6F",
    fontFace: "Aptos"
  },
  {
    id: "classic",
    name: "经典咨询",
    description: "结构化、信息密度高，适合咨询式汇报。",
    background: "#FFFFFF",
    foreground: "#15202B",
    muted: "#6B7280",
    accent: "#2558A6",
    secondary: "#C79A31",
    fontFace: "Aptos"
  }
];

export function getTemplate(id: TemplateId) {
  return templates.find((template) => template.id === id) ?? templates[0];
}
