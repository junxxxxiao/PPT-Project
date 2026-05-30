import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PPT Maker",
  description: "Generate, preview, revise, and download editable PPTX decks."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
