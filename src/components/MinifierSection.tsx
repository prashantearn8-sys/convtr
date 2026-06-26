/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Zap, Copy, Check, Download, Upload, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import { MinifyType } from "../types";
import { performMinification, MinifyResult } from "../utils/minifiers";
import { formatBytes } from "../utils/imageProcessor";

const MINIFY_SAMPLES: Record<MinifyType, string> = {
  json: JSON.stringify(
    {
      appName: "Aether Optimizers",
      status: "active",
      counters: {
        totalCompiles: 450,
        cacheHits: 120,
        errorsLogged: 0
      },
      tags: ["compression", "utility", "full-stack", "fast"]
    },
    null,
    4
  ),
  css: `/* Global navigation header styling */
.main-navigation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: rgb(255, 255, 255);
    border-bottom: 1px solid #e2e8f0;
}

/* Responsive grid hover animations */
.grid-card-interactive {
    transform: translateY(0);
    transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-card-interactive:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}`,
  javascript: `// Handles authentication token verification
function verifyUserSession(token) {
    if (!token) {
        console.warn("Verify session: Token is undefined or null");
        return { authenticated: false, reason: "Missing token" };
    }

    /* Perform decryption block checks */
    const decodedPayload = decodeTokenPayload(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedPayload.exp < currentTime) {
        return { authenticated: false, reason: "Token expired" };
    }

    return { authenticated: true, user: decodedPayload.sub };
}`,
  html: `<!doctype html>
<!-- Primary landing header template -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Aether Compressor Engine</title>
  </head>
  <body>
    <main class="container mx-auto py-12">
      <h1>Optimized Pipeline Output</h1>
      <p>Your compressed document is active.</p>
    </main>
  </body>
</html>`
};

export default function MinifierSection() {
  const [minifyType, setMinifyType] = useState<MinifyType>("css");
  const [inputValue, setInputValue] = useState<string>("");
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample on type change
  useEffect(() => {
    setInputValue(MINIFY_SAMPLES[minifyType]);
    setError("");
  }, [minifyType]);

  // Execute minification
  useEffect(() => {
    if (!inputValue.trim()) {
      setResult(null);
      setError("");
      return;
    }

    try {
      setError("");
      const res = performMinification(inputValue, minifyType);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Could not minify the entered code.");
      setResult(null);
    }
  }, [inputValue, minifyType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputValue(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputValue(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyToClipboard = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result?.code) return;
    const blob = new Blob([result.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `minified_code.${minifyType === "javascript" ? "js" : minifyType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="minifier-section-container">
      {/* Selector and explanation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center rounded-xl text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Code Compressor & Minifier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compress payloads by removing comments, tabs, line breaks, and whitespace.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={minifyType}
            onChange={(e) => setMinifyType(e.target.value as MinifyType)}
            className="w-full sm:w-auto p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            id="minifier-type-selector"
          >
            <option value="css">CSS Minifier</option>
            <option value="javascript">JavaScript Minifier</option>
            <option value="html">HTML Minifier</option>
            <option value="json">JSON Compressor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor columns */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Raw Input Code
              </span>

              <label className="text-xs font-medium text-amber-600 hover:text-amber-500 cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload file</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept={`.${minifyType === "javascript" ? "js" : minifyType}`}
                  className="hidden"
                  id="minifier-file-upload-input"
                />
              </label>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex-1 p-1 ${
                isDragOver ? "bg-amber-500/10" : ""
              }`}
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Paste your code here to see minification stats...`}
                className="w-full min-h-[350px] lg:min-h-[400px] p-4 text-sm font-mono bg-transparent text-slate-800 dark:text-slate-200 border-0 focus:outline-none focus:ring-0 resize-y"
                id="minifier-input-textarea"
              />
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/5 backdrop-blur-xs pointer-events-none">
                  <span className="bg-amber-600 text-white px-4 py-2 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Drop to load file
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Minified Output
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyToClipboard}
                  disabled={!result?.code}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors"
                  id="copy-minified-code-btn"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!result?.code}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors"
                  id="download-minified-code-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
              {error ? (
                <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900 text-rose-600 rounded-xl text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-semibold block">Syntax Lint Exception</span>
                    <span className="font-mono text-xs">{error}</span>
                  </div>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={result?.code || ""}
                  placeholder="Minified lightweight code will output here..."
                  className="w-full min-h-[350px] lg:min-h-[400px] p-4 text-sm font-mono bg-transparent text-slate-700 dark:text-slate-400 border-0 focus:outline-none focus:ring-0 resize-y"
                  id="minifier-output-textarea"
                />
              )}
            </div>
          </div>
        </div>

        {/* Compression Statistics Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Compression Efficiency
            </h4>

            {result ? (
              <div className="space-y-6">
                {/* Visual savings indicator */}
                <div className="text-center space-y-2">
                  <div className="relative inline-flex items-center justify-center">
                    {/* SVG Circular Progress Gauge */}
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-100 dark:text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-amber-500 transition-all duration-500"
                        strokeDasharray={301.6}
                        strokeDashoffset={301.6 - (301.6 * result.savingsPercent) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute font-mono text-xl font-black text-slate-800 dark:text-slate-100">
                      {Math.round(result.savingsPercent)}%
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                    Total Bandwidth Saved
                  </span>
                </div>

                {/* Stat numbers */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-900 text-sm">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Original Size:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatBytes(result.originalBytes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Minified Size:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatBytes(result.compressedBytes)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-slate-800 dark:text-slate-200 font-semibold">
                    <span>Bytes Pruned:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      -{formatBytes(result.originalBytes - result.compressedBytes)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed flex gap-1.5 items-start">
                  <HelpCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <span>
                    Minifying production scripts decreases time-to-first-byte (TTFB) and reduces transfer budgets on servers.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
                <Zap className="w-8 h-8 opacity-40 animate-pulse text-amber-500" />
                <span className="text-xs">
                  Enter some raw source code in the input panel to calculate live compression statistics.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
