/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Copy, Check, Download, Upload, FileCode, Play, AlertCircle } from "lucide-react";
import { CodeConverterType } from "../types";
import {
  jsonToXml,
  xmlToJson,
  jsonToYaml,
  yamlToJson,
  csvToJson,
  jsonToCsv,
  markdownToHtml,
} from "../utils/converters";

// Sample datasets for each converter
const SAMPLES: Record<CodeConverterType, string> = {
  "json-xml": JSON.stringify(
    {
      company: {
        name: "Google AI Studio",
        founded: 2023,
        technologies: ["Gemini 3.5", "Vite", "Tailwind CSS"],
        location: {
          city: "Mountain View",
          state: "California"
        }
      }
    },
    null,
    2
  ),
  "xml-json": `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <title>Digital Asset Optimization</title>
  <version>2.5</version>
  <features>
    <item>Image Transcoding</item>
    <item>Gzip Minification</item>
    <item>AI Smart Guarding</item>
  </features>
  <meta>
    <author>Burnster</author>
    <private>true</private>
  </meta>
</root>`,
  "json-yaml": JSON.stringify(
    {
      server: {
        port: 3000,
        host: "0.0.0.0",
        environment: "production"
      },
      database: {
        provider: "firestore",
        regions: ["us-central1", "asia-east1"]
      }
    },
    null,
    2
  ),
  "yaml-json": `service: file-converter
version: 1.0.0
author: Gemini Pro
spec:
  protocols:
    - https
    - wss
  auth:
    required: true
    provider: firebase-auth`,
  "csv-json": `id,name,role,department,salary
1,Alex Rivera,Tech Lead,Engineering,145000
2,Sarah Jenkins,Product Manager,Product,130000
3,Marcus Vance,UX Designer,Creative,115000
4,Elena Rostova,AI Researcher,R&D,160000`,
  "json-csv": JSON.stringify(
    [
      { id: 1, product: "Wireless Mouse", category: "Electronics", price: 29.99 },
      { id: 2, product: "Mechanical Keyboard", category: "Electronics", price: 109.99 },
      { id: 3, product: "Ergonomic Chair", category: "Furniture", price: 349.50 },
      { id: 4, product: "Desk Lamp", category: "Lighting", price: 45.00 }
    ],
    null,
    2
  ),
  "md-html": `# Web Format Guidelines

This guide details recommended practices for **high-speed asset loading**.

## Performance Checklist
- Use **WebP** instead of standard PNG.
- Minify CSS and JS payloads.
- Integrate *Search Grounded* chatbot companions.

Join the revolution today!`
};

const FILE_EXTENSIONS: Record<CodeConverterType, { in: string; out: string }> = {
  "json-xml": { in: "json", out: "xml" },
  "xml-json": { in: "xml", out: "json" },
  "json-yaml": { in: "json", out: "yaml" },
  "yaml-json": { in: "yaml", out: "json" },
  "csv-json": { in: "csv", out: "json" },
  "json-csv": { in: "json", out: "csv" },
  "md-html": { in: "md", out: "html" }
};

export default function CodeSection() {
  const [conversionType, setConversionType] = useState<CodeConverterType>("json-xml");
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize input with sample on load or converter change
  useEffect(() => {
    setInputValue(SAMPLES[conversionType]);
    setError("");
    setOutputValue("");
  }, [conversionType]);

  // Execute conversion
  const handleConvert = () => {
    if (!inputValue.trim()) {
      setOutputValue("");
      setError("");
      return;
    }

    try {
      setError("");
      let result = "";
      switch (conversionType) {
        case "json-xml":
          result = jsonToXml(inputValue);
          break;
        case "xml-json":
          result = xmlToJson(inputValue);
          break;
        case "json-yaml":
          result = jsonToYaml(inputValue);
          break;
        case "yaml-json":
          result = yamlToJson(inputValue);
          break;
        case "csv-json":
          result = csvToJson(inputValue);
          break;
        case "json-csv":
          result = jsonToCsv(inputValue);
          break;
        case "md-html":
          result = markdownToHtml(inputValue);
          break;
      }
      setOutputValue(result);
    } catch (err: any) {
      setError(err.message || "An error occurred during conversion.");
      setOutputValue("");
    }
  };

  // Convert on input changes automatically
  useEffect(() => {
    handleConvert();
  }, [inputValue, conversionType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputValue(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Drag over handlers
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
      readFile(file);
    }
  };

  const handleCopyToClipboard = () => {
    if (!outputValue) return;
    navigator.clipboard.writeText(outputValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputValue) return;
    const ext = FILE_EXTENSIONS[conversionType].out;
    const blob = new Blob([outputValue], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converted_document.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="code-section-container">
      {/* Header Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Data & Document Converter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert structured files client-side instantly.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={conversionType}
            onChange={(e) => setConversionType(e.target.value as CodeConverterType)}
            className="w-full sm:w-auto p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="conversion-type-selector"
          >
            <option value="json-xml">JSON to XML</option>
            <option value="xml-json">XML to JSON</option>
            <option value="json-yaml">JSON to YAML</option>
            <option value="yaml-json">YAML to JSON</option>
            <option value="csv-json">CSV to JSON</option>
            <option value="json-csv">JSON to CSV</option>
            <option value="md-html">Markdown to HTML</option>
          </select>
        </div>
      </div>

      {/* Editor Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-500" />
              Source Input (.{FILE_EXTENSIONS[conversionType].in})
            </span>

            {/* Upload Button */}
            <label className="text-xs font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept={`.${FILE_EXTENSIONS[conversionType].in}`}
                className="hidden"
                id="source-file-upload-input"
              />
            </label>
          </div>

          {/* Text Area drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex-1 p-1 ${
              isDragOver ? "bg-indigo-500/10" : ""
            }`}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Paste or drag & drop your raw .${FILE_EXTENSIONS[conversionType].in} data here...`}
              className="w-full min-h-[350px] lg:min-h-[450px] p-4 text-sm font-mono bg-transparent text-slate-800 dark:text-slate-200 border-0 focus:outline-none focus:ring-0 resize-y"
              id="source-code-editor"
            />
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/5 backdrop-blur-xs pointer-events-none">
                <span className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Drop to load file
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Output Pane */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-500" />
              Transcoded Output (.{FILE_EXTENSIONS[conversionType].out})
            </span>

            {/* Output Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyToClipboard}
                disabled={!outputValue}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors"
                id="copy-converted-code-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
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
                disabled={!outputValue}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors"
                id="download-converted-code-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col justify-between">
            {error ? (
              <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900 text-rose-600 rounded-xl text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <div>
                  <span className="font-semibold block">Syntax Validation Error</span>
                  <span className="font-mono text-xs">{error}</span>
                </div>
              </div>
            ) : conversionType === "md-html" && outputValue ? (
              <div className="space-y-4">
                {/* Real render of HTML */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 max-h-[220px] overflow-y-auto">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-2">
                    Visual Render Preview
                  </span>
                  <div
                    className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: outputValue }}
                  />
                </div>
                <textarea
                  readOnly
                  value={outputValue}
                  placeholder="Converted HTML source code will display here..."
                  className="w-full min-h-[150px] lg:min-h-[200px] p-3 text-sm font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-850 focus:outline-none"
                  id="converted-code-output"
                />
              </div>
            ) : (
              <textarea
                readOnly
                value={outputValue}
                placeholder="Converted structured data will appear here in real-time as you type or modify properties on the left..."
                className="w-full min-h-[350px] lg:min-h-[450px] p-4 text-sm font-mono bg-transparent text-slate-700 dark:text-slate-300 border-0 focus:outline-none focus:ring-0 resize-y"
                id="converted-code-output-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
