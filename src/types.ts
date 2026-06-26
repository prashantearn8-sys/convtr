/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface AIResponse {
  text: string;
  groundingSources?: GroundingSource[];
}

export type ActiveTab = "image" | "code" | "minifier";

export type RetroView = "home" | "compress_img" | "compress_pdf" | "convert_img" | "image_to_pdf" | "merge_pdf" | "word_to_pdf" | "pdf_to_word" | "history" | "privacy" | "terms";

export interface HistoryItem {
  id: string;
  filename: string;
  originalName: string;
  type: "image" | "pdf" | "code" | "document";
  originalSize: number;
  compressedSize: number;
  url: string;
  format: string;
  timestamp: string;
}

export type ImageFormat = "image/png" | "image/jpeg" | "image/webp" | "image/bmp";

export interface ImageProcessResult {
  url: string;
  size: number;
  width: number;
  height: number;
  format: ImageFormat;
}

export type CodeConverterType =
  | "json-xml"
  | "xml-json"
  | "json-yaml"
  | "yaml-json"
  | "csv-json"
  | "json-csv"
  | "md-html";

export type MinifyType = "json" | "css" | "javascript" | "html";
