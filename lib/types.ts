export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export type TemplateId = "boardroom" | "fresh" | "focus" | "launch" | "classic";

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
      role: "title" | "body" | "caption" | "note";
      text: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      id: string;
      kind: "image";
      assetId: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };

export type SlidePlan = {
  id: string;
  index: number;
  title: string;
  bullets: string[];
  speakerNote?: string;
  imageAssetIds: string[];
  elements: SlideElement[];
};

export type DeckPlan = {
  title: string;
  subtitle: string;
  templateId: TemplateId;
  stylePrompt?: string;
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
