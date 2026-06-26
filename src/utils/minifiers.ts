/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MinifyType } from "../types";

export interface MinifyResult {
  code: string;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
}

/**
 * Minify JSON
 */
export function minifyJson(code: string): string {
  // Parse and re-stringify with no spacing
  const parsed = JSON.parse(code);
  return JSON.stringify(parsed);
}

/**
 * Minify CSS
 */
export function minifyCss(code: string): string {
  return code
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove whitespace around braces, colons, semi-colons, commas
    .replace(/\s*([\{\};:,])\s*/g, "$1")
    // Replace multiple spaces/newlines with a single space
    .replace(/\s+/g, " ")
    // Remove last semicolon in rulesets for extra bytes
    .replace(/;}/g, "}")
    .trim();
}

/**
 * Minify JavaScript (Simple safe regex minifier)
 */
export function minifyJs(code: string): string {
  return code
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove single-line comments (ensure we don't match HTTP URLs)
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return "";
      // Remove trailing comments safely (not inside a quote)
      const index = line.indexOf("//");
      if (index !== -1) {
        // Simple heuristic: if it's not preceded by a colon (like http://) and not in quotes
        const prefix = line.substring(0, index);
        if (!prefix.includes("http:") && !prefix.includes("https:") && !/['"`].*\/\/.*['"`]/.test(line)) {
          return prefix;
        }
      }
      return line;
    })
    .join("\n")
    // Remove extra whitespaces
    .replace(/\s*([=\+\-\*\/\%\{\}\(\)\[\];,<>!\?&|])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minify HTML
 */
export function minifyHtml(code: string): string {
  return code
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Collapse all whitespace sequences to a single space
    .replace(/\s+/g, " ")
    // Remove space between tags
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Main Minification Coordinator
 */
export function performMinification(code: string, type: MinifyType): MinifyResult {
  const originalBytes = new Blob([code]).size;
  let minifiedCode = "";

  if (!code.trim()) {
    return {
      code: "",
      originalBytes: 0,
      compressedBytes: 0,
      savingsPercent: 0,
    };
  }

  try {
    switch (type) {
      case "json":
        minifiedCode = minifyJson(code);
        break;
      case "css":
        minifiedCode = minifyCss(code);
        break;
      case "javascript":
        minifiedCode = minifyJs(code);
        break;
      case "html":
        minifiedCode = minifyHtml(code);
        break;
    }

    const compressedBytes = new Blob([minifiedCode]).size;
    const bytesSaved = originalBytes - compressedBytes;
    const savingsPercent = originalBytes > 0 ? (bytesSaved / originalBytes) * 100 : 0;

    return {
      code: minifiedCode,
      originalBytes,
      compressedBytes,
      savingsPercent: Math.max(0, parseFloat(savingsPercent.toFixed(1))),
    };
  } catch (err: any) {
    throw new Error(`Minification Error (${type}): ` + err.message);
  }
}
