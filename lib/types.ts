export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export type TemplateId = "boardroom" | "fresh" | "focus" | "launch" | "classic";

export type SlideLayout = "cover" | "agenda" | "bullets" | "two_column" | "metrics" | "process" | "conclusion";

export type DeckVisualIntent = {
  tone?: string;
  density?: "low" | "medium" | "high";
  accentStrategy?: string;
};

export type UploadedAsset = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  pageHint?: number;
};

export type SlideElement =
  | {
      id: string;
      kind: "text";
      role: "title" | "subtitle" | "body" | "caption" | "note" | "metric" | "label" | "section";
      text: string;
      x: number;
      y: number;
      w: number;
      h: number;
      color?: string;
      bold?: boolean;
      align?: "left" | "center" | "right";
    }
  | {
      id: string;
      kind: "image";
      assetId: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      id: string;
      kind: "shape";
      shape: "rect" | "line" | "pill";
      x: number;
      y: number;
      w: number;
      h: number;
      fill?: string;
      line?: string;
      opacity?: number;
    };

export type SlidePlan = {
  id: string;
  index: number;
  layout: SlideLayout;
  title: string;
  bullets: string[];
  visualIntent?: string;
  speakerNote?: string;
  imageAssetIds: string[];
  elements: SlideElement[];
};

export type DeckPlan = {
  title: string;
  subtitle: string;
  templateId: TemplateId;
  stylePrompt?: string;
  visualIntent?: DeckVisualIntent;
  slides: SlidePlan[];
};

export type TaskInput = {
  text: string;
  templateId: TemplateId;
  stylePrompt?: string;
  documentName?: string;
  assets: UploadedAsset[];
};

export type Revision = {
  id: string;
  createdAt: string;
  pageIndex?: number;
  note: string;
  region?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export type DeckTask = {
  id: string;
  token: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  input: TaskInput;
  deck?: DeckPlan;
  output?: {
    pptxPath?: string;
  };
  revisions: Revision[];
  error?: string;
};

export type PublicTask = Omit<DeckTask, "token"> & {
  canDownload: boolean;
};
