import mammoth from "mammoth";
import { isAllowedDocument } from "./security";

export async function extractDocumentText(file: File) {
  if (!isAllowedDocument(file.type, file.name)) {
    throw new Error("仅支持 txt、md、docx 文档。");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return buffer.toString("utf8").trim();
}
