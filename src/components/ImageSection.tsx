/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Download, Sliders, RefreshCw, Eye, Check } from "lucide-react";
import { ImageFormat, ImageProcessResult } from "../types";
import { processImageClientSide, formatBytes } from "../utils/imageProcessor";

export default function ImageSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [quality, setQuality] = useState<number>(0.8);
  const [scale, setScale] = useState<number>(1.0);
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ImageProcessResult | null>(null);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<"side" | "original" | "result">("side");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger processing when file, quality, scale, or format changes
  useEffect(() => {
    if (!selectedFile) return;

    const performProcessing = async () => {
      setProcessing(true);
      setError("");
      try {
        const res = await processImageClientSide(selectedFile, quality, scale, format);
        setResult(res);
      } catch (err: any) {
        setError(err.message || "Failed to process image.");
      } finally {
        setProcessing(false);
      }
    };

    // Simple debounce to prevent freezing during rapid slider dragging
    const timeout = setTimeout(performProcessing, 150);
    return () => clearTimeout(timeout);
  }, [selectedFile, quality, scale, format]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadNewFile(file);
    }
  };

  const loadNewFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setError("");
    setSelectedFile(file);
    
    // Create local object URL for original preview
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setResult(null);
  };

  // Drag and drop handlers
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
      loadNewFile(file);
    }
  };

  const downloadProcessedImage = () => {
    if (!result || !selectedFile) return;
    
    // Generate helpful filename
    const originalName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf("."));
    const ext = format.split("/")[1];
    const filename = `${originalName}_optimized.${ext}`;

    const link = document.createElement("a");
    link.href = result.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all fields
  const handleReset = () => {
    setSelectedFile(null);
    setOriginalUrl("");
    setResult(null);
    setQuality(0.8);
    setScale(1.0);
    setFormat("image/webp");
    setError("");
  };

  return (
    <div className="space-y-6" id="image-section-container">
      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          id="image-drag-drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white/50 dark:bg-slate-900/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="image-file-input"
          />
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
            Drag and drop your image here
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Supports PNG, JPEG, WEBP, BMP, and GIF. Processing is completed 100% locally and securely in your browser.
          </p>
          <button
            type="button"
            id="browse-images-btn"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Adjustment Controls
              </h3>
              <button
                onClick={handleReset}
                id="reset-image-btn"
                className="text-xs text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Quality Slider - Hidden/disabled for PNG to prevent confusing UI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">Compression Quality</span>
                <span className="text-emerald-600 font-mono text-xs">
                  {format === "image/png" ? "Lossless (N/A)" : `${Math.round(quality * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                disabled={format === "image/png"}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                id="image-quality-slider"
              />
              <p className="text-xs text-slate-400">
                {format === "image/png"
                  ? "PNG is a lossless format and ignores the quality parameter."
                  : "Lower quality increases compression but may introduce minor visual artifacts."}
              </p>
            </div>

            {/* Scale Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">Resolution Scale</span>
                <span className="text-emerald-600 font-mono text-xs">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                id="image-scale-slider"
              />
              <p className="text-xs text-slate-400">
                Adjusts the physical dimensions of the output image. Great for creating thumbnails.
              </p>
            </div>

            {/* Target Format */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="image-format-selector"
              >
                <option value="image/webp">WEBP (Highly Recommended)</option>
                <option value="image/jpeg">JPEG (Standard Lossy)</option>
                <option value="image/png">PNG (Lossless Transparent)</option>
                <option value="image/bmp">BMP (Raw Bitmap)</option>
              </select>
              <p className="text-xs text-slate-400">
                WebP provides the smallest file sizes while maintaining excellent visual fidelity.
              </p>
            </div>

            {/* Original Info */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-900 space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Original File Information
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div>Name:</div>
                <div className="truncate text-right text-slate-800 dark:text-slate-200">
                  {selectedFile.name}
                </div>
                <div>Size:</div>
                <div className="text-right text-slate-800 dark:text-slate-200">
                  {formatBytes(selectedFile.size)}
                </div>
                <div>Type:</div>
                <div className="text-right text-slate-800 dark:text-slate-200 uppercase">
                  {selectedFile.type.split("/")[1]}
                </div>
              </div>
            </div>

            {/* Compression metrics summary */}
            {result && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                  Conversion Summary
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Size:</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatBytes(result.size)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reduction:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {result.size < selectedFile.size ? (
                      <>
                        <Check className="w-4 h-4" />
                        {Math.round(((selectedFile.size - result.size) / selectedFile.size) * 100)}% Smaller
                      </>
                    ) : (
                      <span className="text-amber-500 font-normal text-xs">Formatted (Lossless)</span>
                    )}
                  </span>
                </div>

                <button
                  onClick={downloadProcessedImage}
                  id="download-image-btn"
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Processed Image
                </button>
              </div>
            )}
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Fidelity Viewer & Comparison
              </h3>

              {/* View mode toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl" id="image-view-toggle">
                <button
                  onClick={() => setViewMode("side")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "side"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                  id="view-side-btn"
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode("original")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "original"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                  id="view-original-btn"
                >
                  Original
                </button>
                <button
                  onClick={() => setViewMode("result")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === "result"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                  id="view-result-btn"
                >
                  Compressed/Converted
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Loading / Image container */}
            <div className="relative min-h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 p-4 overflow-hidden">
              {processing && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 z-10 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Applying filters & compressing...
                  </span>
                </div>
              )}

              {viewMode === "side" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {/* Original Box */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Before (Original)
                    </span>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 max-h-[400px] flex items-center justify-center relative group">
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="max-h-[350px] object-contain max-w-full"
                      />
                    </div>
                  </div>

                  {/* Result Box */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">
                      After (Optimized)
                    </span>
                    <div className="border border-emerald-200 dark:border-emerald-950 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 max-h-[400px] flex items-center justify-center relative">
                      {result ? (
                        <img
                          src={result.url}
                          alt="Processed Result"
                          className="max-h-[350px] object-contain max-w-full"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Loading result...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "original" && (
                <div className="w-full flex justify-center">
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-h-[450px] object-contain max-w-full rounded-lg"
                  />
                </div>
              )}

              {viewMode === "result" && (
                <div className="w-full flex justify-center">
                  {result ? (
                    <img
                      src={result.url}
                      alt="Processed Result"
                      className="max-h-[450px] object-contain max-w-full rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Processing output...</span>
                  )}
                </div>
              )}
            </div>

            {/* Advanced details */}
            {result && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 text-center">
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Output Dimensions
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {result.width} × {result.height}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Output Format
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {result.format.split("/")[1]}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Compressed Size
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatBytes(result.size)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Browser Render
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Ready
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
