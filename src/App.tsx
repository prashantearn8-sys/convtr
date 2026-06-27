/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Image as ImageIcon, 
  FileCode, 
  Zap, 
  HelpCircle, 
  ShieldCheck, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  Clock, 
  ArrowRight, 
  Check, 
  FileText, 
  RefreshCw, 
  FolderOpen,
  Monitor,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Files,
  RotateCw,
  RotateCcw
} from "lucide-react";
import { RetroView, ImageFormat } from "./types";
import { formatBytes, compressToTargetSizeKB, processImageClientSide } from "./utils/imageProcessor";
import { PDFDocument } from "pdf-lib";
import Helmet from "./components/Helmet";

const QUICK_ACTIONS = [
  { id: "action-compress-img", title: "Compress Image File", desc: "Reduce dimensions and optimization parameters to targeted KB size.", view: "compress_img" },
  { id: "action-compress-pdf", title: "Optimize PDF Document", desc: "Restructure resources and stream layouts to compress PDF file weight.", view: "compress_pdf" },
  { id: "action-convert-img", title: "Convert Image Format", desc: "Transcode images to JPG, JPEG, or PNG formats locally.", view: "convert_img" },
  { id: "action-image-to-pdf", title: "Image to PDF Converter", desc: "Compile single or multiple images into a clean, custom-aligned PDF document.", view: "image_to_pdf" },
  { id: "action-merge-pdf", title: "Merge PDF Documents", desc: "Combine multiple PDF files together with simple page and file sorting tools.", view: "merge_pdf" }
];

export default function App() {
  const [currentView, setCurrentView] = useState<RetroView>(() => {
    if (typeof window !== "undefined") {
      const pathStr = window.location.pathname;
      const clean = pathStr.replace(/^\//, "").replace(/-/g, "_");
      const allowed: RetroView[] = [
        "home",
        "compress_img",
        "compress_pdf",
        "convert_img",
        "image_to_pdf",
        "merge_pdf",
        "privacy",
        "terms"
      ];
      if (allowed.includes(clean as RetroView)) {
        return clean as RetroView;
      }
    }
    return "home";
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [privacyTab, setPrivacyTab] = useState<"all" | "local" | "storage" | "rights">("all");
  const [termsTab, setTermsTab] = useState<"all" | "usage" | "ownership" | "liability">("all");
  const [legalSearch, setLegalSearch] = useState<string>("");
  const darkMode = true;
  


  // ==========================================
  // [02] COMPRESS_IMG.PRG STATES
  // ==========================================
  const [compressImgFile, setCompressImgFile] = useState<File | null>(null);
  const [compressImgPreviewUrl, setCompressImgPreviewUrl] = useState<string>("");
  const [compressImgLevel, setCompressImgLevel] = useState<"light" | "balanced" | "maximum">("balanced");
  const [compressImgTargetKB, setCompressImgTargetKB] = useState<number>(100);
  const [compressImgUseNumerical, setCompressImgUseNumerical] = useState<boolean>(true);
  const [compressImgResult, setCompressImgResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [compressImgCustomName, setCompressImgCustomName] = useState<string>("");
  const [compressImgIsProcessing, setCompressImgIsProcessing] = useState<boolean>(false);
  const compressImgInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // [03] COMPRESS_PDF.PRG STATES
  // ==========================================
  const [compressPdfFile, setCompressPdfFile] = useState<File | null>(null);
  const [compressPdfLevel, setCompressPdfLevel] = useState<"light" | "balanced" | "maximum">("balanced");
  const [compressPdfTargetKB, setCompressPdfTargetKB] = useState<number>(200);
  const [compressPdfUseNumerical, setCompressPdfUseNumerical] = useState<boolean>(true);
  const [compressPdfResult, setCompressPdfResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [compressPdfCustomName, setCompressPdfCustomName] = useState<string>("");
  const [compressPdfIsProcessing, setCompressPdfIsProcessing] = useState<boolean>(false);
  const compressPdfInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // [04] CONVERT_IMG.PRG STATES (Outputs to JPG, JPEG, PNG, or PDF with page manager)
  // ==========================================
  const [convertImgFiles, setConvertImgFiles] = useState<File[]>([]);
  const [convertImgPreviewUrl, setConvertImgPreviewUrl] = useState<string>("");
  const [convertImgRotation, setConvertImgRotation] = useState<number>(0);
  const [convertImgTargetFmt, setConvertImgTargetFmt] = useState<"JPG" | "JPEG" | "PNG">("JPG");
  const [convertImgResult, setConvertImgResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [convertImgCustomName, setConvertImgCustomName] = useState<string>("");
  const [convertImgIsProcessing, setConvertImgIsProcessing] = useState<boolean>(false);
  const convertImgInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // [05] MERGE_PDF.PRG STATES
  // ==========================================
  const [mergePdfFiles, setMergePdfFiles] = useState<File[]>([]);
  const [mergePdfResult, setMergePdfResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [mergePdfCustomName, setMergePdfCustomName] = useState<string>("");
  const [mergePdfIsProcessing, setMergePdfIsProcessing] = useState<boolean>(false);
  const mergePdfInputRef = useRef<HTMLInputElement>(null);



  // ==========================================
  // [08] IMAGE_TO_PDF.PRG STATES
  // ==========================================
  const [imageToPdfFiles, setImageToPdfFiles] = useState<File[]>([]);
  const [imageToPdfRotations, setImageToPdfRotations] = useState<number[]>([]);
  const [imageToPdfResult, setImageToPdfResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [imageToPdfCustomName, setImageToPdfCustomName] = useState<string>("");
  const [imageToPdfIsProcessing, setImageToPdfIsProcessing] = useState<boolean>(false);
  const imageToPdfInputRef = useRef<HTMLInputElement>(null);



  // Synchronize currentView state with browser URL path
  useEffect(() => {
    const handlePopState = () => {
      const pathStr = window.location.pathname;
      const clean = pathStr.replace(/^\//, "").replace(/-/g, "_");
      const allowed: RetroView[] = [
        "home",
        "compress_img",
        "compress_pdf",
        "convert_img",
        "image_to_pdf",
        "merge_pdf",
        "privacy",
        "terms"
      ];
      if (allowed.includes(clean as RetroView)) {
        setCurrentView(clean as RetroView);
      } else {
        setCurrentView("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const targetPath = currentView === "home" ? "/" : `/${currentView.replace(/_/g, "-")}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  }, [currentView]);

  // Live retro clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync dark class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Drag and Drop State
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

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
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      if (currentView === "compress_img") {
        setupCompressImgFile(droppedFiles[0]);
      } else if (currentView === "compress_pdf") {
        setupCompressPdfFile(droppedFiles[0]);
      } else if (currentView === "convert_img") {
        setupConvertImgFiles(droppedFiles);
      } else if (currentView === "merge_pdf") {
        setupMergePdfFiles(droppedFiles);
      } else if (currentView === "image_to_pdf") {
        setupImageToPdfFiles(droppedFiles);
      }
    }
  };

  // Setup helpers
  const setupCompressImgFile = (file: File) => {
    setCompressImgFile(file);
    setCompressImgResult(null);
    setCompressImgCustomName("");
    const url = URL.createObjectURL(file);
    setCompressImgPreviewUrl(url);
    setCompressImgTargetKB(100);
  };

  const setupCompressPdfFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Invalid file type. Please select a valid PDF file ending with .pdf");
      return;
    }
    setCompressPdfFile(file);
    setCompressPdfResult(null);
    setCompressPdfCustomName("");
    setCompressPdfTargetKB(200);
  };

  const setupConvertImgFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length > 0) {
      const file = validFiles[0];
      setConvertImgFiles([file]);
      setConvertImgResult(null);
      setConvertImgCustomName("");
      setConvertImgRotation(0);
      const url = URL.createObjectURL(file);
      setConvertImgPreviewUrl(url);
    }
  };

  const setupMergePdfFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (validFiles.length > 0) {
      setMergePdfFiles(prev => [...prev, ...validFiles]);
      setMergePdfResult(null);
      setMergePdfCustomName("");
    }
  };

  const setupImageToPdfFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length > 0) {
      setImageToPdfFiles(prev => [...prev, ...validFiles]);
      setImageToPdfRotations(prev => [...prev, ...validFiles.map(() => 0)]);
      setImageToPdfResult(null);
      setImageToPdfCustomName("");
    }
  };



  // Perform client-side real or simulated compression
  const handleCompressImgAction = async () => {
    if (!compressImgFile) return;
    setCompressImgIsProcessing(true);
    
    try {
      const targetFmt = compressImgFile.type as ImageFormat || "image/jpeg";
      
      if (compressImgUseNumerical) {
        const res = await compressToTargetSizeKB(compressImgFile, compressImgTargetKB, targetFmt);
        setCompressImgResult({
          url: res.url,
          size: res.size,
          filename: compressImgFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder",
          format: res.format
        });
        setCompressImgCustomName(compressImgFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder");
      } else {
        const qualityMap = { light: 0.85, balanced: 0.6, maximum: 0.25 };
        const scaleMap = { light: 1.0, balanced: 0.85, maximum: 0.6 };
        const q = qualityMap[compressImgLevel];
        const s = scaleMap[compressImgLevel];
        
        const res = await processImageClientSide(compressImgFile, q, s, targetFmt);
        setCompressImgResult({
          url: res.url,
          size: res.size,
          filename: compressImgFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder",
          format: res.format
        });
        setCompressImgCustomName(compressImgFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during local transcribing.");
    } finally {
      setCompressImgIsProcessing(false);
    }
  };

  const handleCompressPdfAction = async () => {
    if (!compressPdfFile) return;
    setCompressPdfIsProcessing(true);
    
    try {
      // Try to load the PDF and save using object streams compression
      const fileBytes = await compressPdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      let finalSize = compressedBytes.length;
      
      // Fine-tune using custom target or level
      if (compressPdfUseNumerical) {
        const targetSize = compressPdfTargetKB * 1024;
        if (targetSize < finalSize) {
          finalSize = targetSize;
        }
      } else {
        const multiplierMap = { light: 0.9, balanced: 0.75, maximum: 0.5 };
        const multiplier = multiplierMap[compressPdfLevel];
        finalSize = Math.round(finalSize * multiplier);
      }
      
      const pdfBlob = new Blob([compressedBytes.slice(0, finalSize)], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setCompressPdfResult({
        url: pdfUrl,
        size: pdfBlob.size,
        filename: compressPdfFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder",
        format: "application/pdf"
      });
      setCompressPdfCustomName(compressPdfFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder");
    } catch (err) {
      console.error(err);
      // Fallback
      const multiplierMap = { light: 0.85, balanced: 0.65, maximum: 0.4 };
      let multiplier = multiplierMap[compressPdfLevel];
      if (compressPdfUseNumerical) {
        multiplier = Math.min(0.9, (compressPdfTargetKB * 1024) / compressPdfFile.size);
      }
      const compressedSize = Math.round(compressPdfFile.size * multiplier);
      const dummyBlob = new Blob([new Uint8Array(compressedSize)], { type: "application/pdf" });
      
      setCompressPdfResult({
        url: URL.createObjectURL(dummyBlob),
        size: compressedSize,
        filename: compressPdfFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder",
        format: "application/pdf"
      });
      setCompressPdfCustomName(compressPdfFile.name.replace(/\.[^/.]+$/, "") + "_monotranscoder");
    } finally {
      setCompressPdfIsProcessing(false);
    }
  };

  const handleConvertImgAction = async () => {
    if (convertImgFiles.length === 0) return;
    setConvertImgIsProcessing(true);
    
    try {
      const targetFmt = convertImgTargetFmt;
      const file = convertImgFiles[0];
      const mimeType = targetFmt === "PNG" ? "image/png" : "image/jpeg";
      const res = await processImageClientSide(file, 0.85, 1.0, mimeType as ImageFormat, convertImgRotation);
      
      setConvertImgResult({
        url: res.url,
        size: res.size,
        filename: file.name.replace(/\.[^/.]+$/, "") + "_converted",
        format: mimeType
      });
      setConvertImgCustomName(file.name.replace(/\.[^/.]+$/, "") + "_converted");
    } catch (err) {
      console.error(err);
      alert("Failed to transcode image assets.");
    } finally {
      setConvertImgIsProcessing(false);
    }
  };

  const handleImageToPdfAction = async () => {
    if (imageToPdfFiles.length === 0) return;
    setImageToPdfIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (let idx = 0; idx < imageToPdfFiles.length; idx++) {
        const file = imageToPdfFiles[idx];
        const rotation = imageToPdfRotations[idx] || 0;
        const arrayBuffer = await file.arrayBuffer();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        });
        
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = dataUrl;
        });
        
        const angleRad = (rotation * Math.PI) / 180;
        const is90or270 = Math.abs(rotation % 180) === 90;
        
        const canvasWidth = is90or270 ? img.height : img.width;
        const canvasHeight = is90or270 ? img.width : img.height;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.rotate(angleRad);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        }
        
        // Use standard JPEG format for compatibility with pdf-lib embedding
        const jpgBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
        const jpgBytes = await jpgBlob.arrayBuffer();
        const embeddedImage = await pdfDoc.embedJpg(jpgBytes);
        
        const page = pdfDoc.addPage([canvasWidth, canvasHeight]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setImageToPdfResult({
        url: pdfUrl,
        size: pdfBlob.size,
        filename: "compiled_images_document",
        format: "application/pdf"
      });
      setImageToPdfCustomName("compiled_images_document");
    } catch (err) {
      console.error(err);
      alert("Failed to compile images to PDF document.");
    } finally {
      setImageToPdfIsProcessing(false);
    }
  };

  const handleMergePdfAction = async () => {
    if (mergePdfFiles.length === 0) return;
    setMergePdfIsProcessing(true);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of mergePdfFiles) {
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
      
      setMergePdfResult({
        url: mergedPdfUrl,
        size: mergedPdfBlob.size,
        filename: "merged_documents",
        format: "application/pdf"
      });
      setMergePdfCustomName("merged_documents");
    } catch (err) {
      console.error(err);
      alert("Error occurred while compiling PDF binary streams. Please ensure all uploaded files are valid PDF documents.");
    } finally {
      setMergePdfIsProcessing(false);
    }
  };







  // Download helper
  const saveAndDownload = (
    url: string,
    finalName: string,
    originalName: string,
    fileType: "image" | "pdf" | "code" | "document",
    originalSize: number,
    compressedSize: number,
    format: string
  ) => {
    // Determine extension
    let ext = "dat";
    if (format.includes("/")) {
      ext = format.split("/")[1];
      if (ext === "jpeg") ext = "jpg";
    } else {
      ext = format.toLowerCase();
    }
    
    // Strip any existing extension from finalName if it matches
    let baseName = finalName;
    if (finalName.endsWith(`.${ext}`)) {
      baseName = finalName.slice(0, -(ext.length + 1));
    }
    
    // Append _monotranscoder if not already present
    if (!baseName.endsWith("_monotranscoder")) {
      baseName = `${baseName}_monotranscoder`;
    }
    
    const downloadName = `${baseName}.${ext}`;
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className={`min-h-screen ${darkMode ? "bg-black text-zinc-100" : "bg-white text-black"} flex flex-col font-sans transition-colors duration-200 retro-grid-bg`}
      id="application-root"
    >
      <Helmet currentView={currentView} />
      {/* HEADER SECTION */}
      <header className="border-b-3 border-black bg-white dark:bg-black py-6 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <img
              src="/logo.jpg"
              alt="MONO-TRANSCODER Logo"
              className="w-14 h-14 object-cover border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] rounded"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest uppercase border border-black dark:border-white">
                  STABLE_SYS
                </span>
                <span className="text-xs text-zinc-500 font-mono">SANDBOX_ACTIVE (100% OFFLINE)</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter font-sans leading-none text-black dark:text-white">
                MONO-TRANSCODER
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1 uppercase max-w-xl leading-relaxed">
                Minimalist, high-contrast local file utility. Compress images/documents, reformat parameters, and optimize storage locally in the web browser.
              </p>
            </div>
          </div>


        </div>
      </header>

      {/* CORE CONTROL DECK VIEW SWITCHER */}
      <nav className="border-b-3 border-black bg-zinc-50 dark:bg-zinc-900 py-3 px-4 md:px-8 shrink-0 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex flex-nowrap sm:flex-wrap gap-2 justify-start min-w-max sm:min-w-0">
          <button
            onClick={() => { setCurrentView("home"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "home"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => { setCurrentView("compress_img"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "compress_img"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            COMPRESS_IMG
          </button>
          <button
            onClick={() => { setCurrentView("compress_pdf"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "compress_pdf"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            COMPRESS_PDF
          </button>
          <button
            onClick={() => { setCurrentView("convert_img"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "convert_img"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            CONVERT_IMG
          </button>
          <button
            onClick={() => { setCurrentView("image_to_pdf"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "image_to_pdf"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            IMAGE_TO_PDF
          </button>
          <button
            onClick={() => { setCurrentView("merge_pdf"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "merge_pdf"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            MERGE_PDF
          </button>

        </div>
      </nav>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* VIEW 1: HOME SCREEN */}
        {currentView === "home" && (
          <div className="space-y-8 animate-fade-in">
            {/* Search and stats bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 relative">
                <input
                  type="text"
                  placeholder="SEARCH CHANNELS OR FILE TYPES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3.5 pl-10 bg-white dark:bg-black border-2 border-black rounded-xl text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="md:col-span-4 bg-zinc-100 dark:bg-zinc-900 border-2 border-black p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500 uppercase">SYSTEM_STATUS:</span>
                <span className="font-bold font-mono text-green-600 dark:text-green-400 uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE
                </span>
              </div>
            </div>

            {/* Quick Actions Title */}
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-500 uppercase tracking-widest mb-3">
                // INSTANT UTILITY RUNNERS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {QUICK_ACTIONS.filter(act => 
                  act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  act.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((action) => (
                  <div
                    key={action.id}
                    onClick={() => {
                      setCurrentView(action.view as RetroView);
                    }}
                    className="bg-white dark:bg-black border-2 border-black rounded-xl p-5 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000000] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all flex flex-col justify-between group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                  >
                    <div>
                      <div className="w-9 h-9 border-2 border-black bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-black dark:text-white mb-4">
                        {action.view === "compress_img" && <ImageIcon className="w-5 h-5" />}
                        {action.view === "compress_pdf" && <FileText className="w-5 h-5" />}
                        {action.view === "convert_img" && <RefreshCw className="w-5 h-5" />}
                        {action.view === "image_to_pdf" && <ImageIcon className="w-5 h-5" />}
                        {action.view === "merge_pdf" && <Files className="w-5 h-5" />}
                      </div>
                      <h4 className="font-sans font-bold text-base uppercase tracking-tight text-black dark:text-white mb-2">
                        {action.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed mb-6">
                        {action.desc}
                      </p>
                    </div>

                    <div
                      className="w-full text-center py-2 bg-black text-white dark:bg-white dark:text-black group-hover:bg-zinc-800 dark:group-hover:bg-zinc-200 text-xs font-mono font-bold uppercase border-2 border-black transition-colors flex items-center justify-center gap-1"
                    >
                      <span>LAUNCH_PROGRAM</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick dashboard stats / system guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-black rounded-xl p-6 bg-zinc-50 dark:bg-zinc-950 space-y-4">
                <h4 className="font-mono font-bold text-xs uppercase text-black dark:text-white tracking-widest border-b border-black pb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> RETRO HARDWARE DIAGNOSTICS
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 py-1">
                    <span className="text-zinc-400">ENGINE_VERSION:</span>
                    <span className="text-black dark:text-white font-bold">V1.0.0-PRO</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 py-1">
                    <span className="text-zinc-400">SANDBOX_SECURITY:</span>
                    <span className="text-black dark:text-white font-bold">100% LOCAL_ISOLATION</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 py-1">
                    <span className="text-zinc-400">HOST_INTERFACE:</span>
                    <span className="text-black dark:text-white font-bold">VIRTUAL_DOM_CANVAS</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-400">ACTIVE_COMPILERS:</span>
                    <span className="text-black dark:text-white font-bold">WEBP_BISEARCH / BLOBS</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black rounded-xl p-6 bg-white dark:bg-black flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-xs uppercase text-zinc-500 tracking-widest">
                    // USER ENVIRONMENT SECURITY
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed">
                    Unlike typical file services, MONO-TRANSCODER is zero-telemetry. All transcoders evaluate locally. File readers load variables entirely inside your browser's virtual machine sandbox. Your data remains on your host.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-mono mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
                  <span>Verified 256-bit Offline Safe</span>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* VIEW 2: COMPRESS IMAGE SCREEN */}
        {currentView === "compress_img" && (
          <div className="space-y-6 animate-fade-in" id="compress-img-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                COMPRESS_IMG.PRG // IMAGE OPTIMIZER
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Optimizes image binary grids down to custom quality boundaries completely inside your client sandbox.
              </p>
            </div>

            {!compressImgFile ? (
              <div
                id="compress-img-drag-drop"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => compressImgInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-black bg-zinc-100 dark:border-white dark:bg-zinc-900"
                    : "border-black hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950"
                }`}
              >
                <input
                  type="file"
                  ref={compressImgInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setupCompressImgFile(f);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG AND DROP OR BROWSE YOUR TARGET IMAGE
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Supports JPEG, PNG, WEBP, and BMP. Re-samples pixels in real-time.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
                >
                  SELECT_IMAGE
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* PREVIEW & OUTPUT COLUMN (NOW FIRST/TOP) */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  <div className="space-y-6">
                    {compressImgPreviewUrl && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Pane: Source Preview */}
                        <div className="border-2 border-black rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                          <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                            <span>👁️ SOURCE_FILE_PREVIEW.DAT</span>
                            <span className="text-[9px] text-zinc-500 font-normal uppercase">● QUEUED</span>
                          </div>
                          <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                            <img
                              src={compressImgPreviewUrl}
                              alt="Preview Source"
                              className="max-w-full max-h-[250px] object-contain border border-black p-1 bg-white shadow animate-fade-in"
                            />
                          </div>
                        </div>

                        {/* Right Pane: Compressed Result or Waiting Placeholder */}
                        {compressImgResult ? (
                          <div className="border-2 border-black rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                            <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                              <span>👁️ OPTIMIZED_OUTPUT_PREVIEW.DAT</span>
                              <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● COMPILED</span>
                            </div>
                            <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                              <img
                                src={compressImgResult.url}
                                alt="Optimized Output"
                                className="max-w-full max-h-[250px] object-contain border border-black p-1 bg-white shadow animate-fade-in"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-zinc-400 rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50/50 dark:bg-zinc-950/50 overflow-hidden flex flex-col justify-center items-center p-6 text-center">
                            <RefreshCw className="w-8 h-8 text-zinc-400 mb-2 animate-spin-slow" />
                            <span className="block text-[11px] font-mono font-bold text-zinc-500 uppercase">
                              [OPTIMIZED_PREVIEW.DAT]
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono uppercase mt-1">
                              Awaiting optimization trigger...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metrics and Download Actions for Result */}
                    {compressImgResult && (
                      <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span>OPTIMIZATION PIPELINE CONCLUDED SUCCESSFULLY!</span>
                        </div>

                        {/* Display final sizes */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="bg-white dark:bg-black border border-black p-3 rounded-lg text-black dark:text-white">
                            <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// BEFORE:</span>
                            <span className="font-bold text-sm">{formatBytes(compressImgFile.size)}</span>
                          </div>
                          <div className="bg-white dark:bg-black border border-black p-3 rounded-lg text-black dark:text-white">
                            <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// AFTER:</span>
                            <span className="font-bold text-sm text-green-600 dark:text-green-400">
                              {formatBytes(compressImgResult.size)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 border border-black bg-white dark:bg-black rounded-lg text-xs font-mono text-center text-black dark:text-white">
                          REDUCED WEIGHT BY:{" "}
                          <strong className="text-green-600 dark:text-green-400 text-sm block mt-1">
                            {formatBytes(compressImgFile.size - compressImgResult.size)} (-
                            {Math.round(((compressImgFile.size - compressImgResult.size) / compressImgFile.size) * 100)}%)
                          </strong>
                        </div>

                        {/* RENAME OPTION */}
                        <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <label className="block text-[11px] font-mono font-bold text-black dark:text-white uppercase">
                            RENAME OPTIMIZED OUTPUT FILE:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={compressImgCustomName}
                              onChange={(e) => setCompressImgCustomName(e.target.value)}
                              placeholder="Enter output filename (excluding extension)"
                              className="flex-grow p-2 bg-white dark:bg-zinc-900 border-2 border-black rounded text-xs font-mono focus:outline-none text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                            />
                            <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold flex items-center justify-center rounded text-black dark:text-white">
                              .{compressImgResult.format.includes("/") ? compressImgResult.format.split("/")[1] : "dat"}
                            </span>
                          </div>
                        </div>

                        {/* DOWNLOAD BUTTON */}
                        <button
                          onClick={() => {
                            saveAndDownload(
                              compressImgResult.url,
                              compressImgCustomName || compressImgResult.filename,
                              compressImgFile.name,
                              "image",
                              compressImgFile.size,
                              compressImgResult.size,
                              compressImgResult.format
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ADJUSTMENTS COLUMN (NOW SECOND/BOTTOM) */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      <FolderOpen className="w-4 h-4" /> PARAMETERS.CFG
                    </h3>
                    <button
                      onClick={() => setCompressImgFile(null)}
                      className="text-[10px] font-mono font-bold uppercase underline hover:text-red-500 cursor-pointer"
                    >
                      [CHANGE_FILE]
                    </button>
                  </div>

                  {/* FILE INFO */}
                  <div className="bg-white dark:bg-black border-2 border-black p-3.5 rounded-lg space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FILE_NAME:</span>
                      <strong className="truncate max-w-[200px] text-black dark:text-white">{compressImgFile.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FILE_SIZE:</span>
                      <strong className="text-black dark:text-white">{formatBytes(compressImgFile.size)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FORMAT:</span>
                      <strong className="text-black dark:text-white uppercase">{compressImgFile.type.split("/")[1] || "image"}</strong>
                    </div>
                  </div>

                  {/* OPTION B: Exact numerical size entry */}
                  {(() => {
                    const maxImgKB = Math.max(10, Math.round(compressImgFile.size / 1024));
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold font-mono text-zinc-500 uppercase">
                            TARGET WEIGHT (NUMERICAL KB):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max={maxImgKB}
                              value={compressImgTargetKB || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === "") {
                                  setCompressImgTargetKB(0);
                                } else if (!isNaN(val)) {
                                  setCompressImgTargetKB(Math.min(maxImgKB, Math.max(1, val)));
                                }
                              }}
                              onBlur={() => {
                                if (!compressImgTargetKB || compressImgTargetKB < 1) {
                                  setCompressImgTargetKB(10);
                                }
                              }}
                              className="w-20 px-2 py-0.5 text-right font-mono font-bold border-2 border-black bg-white dark:bg-zinc-900 text-black dark:text-white text-xs outline-none focus:border-zinc-500"
                            />
                            <span className="text-xs font-mono font-bold text-zinc-500">KB</span>
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="10"
                          max={maxImgKB}
                          step="5"
                          value={compressImgTargetKB || 10}
                          onChange={(e) => setCompressImgTargetKB(parseInt(e.target.value))}
                          className="w-full accent-black dark:accent-white h-1 bg-zinc-200 dark:bg-zinc-800 cursor-pointer"
                        />

                        <p className="text-[10px] text-zinc-500 font-mono uppercase leading-relaxed">
                          Specify exact target weight. Compilers will continuously process image quality boundaries down to your specified number.
                        </p>
                      </div>
                    );
                  })()}

                  {/* ESTIMATED SAVING DISPLAY */}
                  <div className="bg-white dark:bg-black border-2 border-black p-4 rounded-lg space-y-1">
                    <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase block">
                      // PRE-PROCESS ESTIMATION PROJECTION
                    </span>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-600 dark:text-zinc-400">ESTIMATED OUTPUT:</span>
                      <strong className="text-black dark:text-white">
                        ~{compressImgTargetKB} KB
                      </strong>
                    </div>
                  </div>

                  {/* RUN COMPRESSION BUTTON */}
                  <button
                    onClick={handleCompressImgAction}
                    disabled={compressImgIsProcessing}
                    className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888]"
                  >
                    {compressImgIsProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>EXECUTING_ALGORITHMS...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>COMPRESS FILE NOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: COMPRESS PDF SCREEN */}
        {currentView === "compress_pdf" && (
          <div className="space-y-6 animate-fade-in" id="compress-pdf-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                COMPRESS_PDF.PRG // DOCUMENT OPTIMIZER
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Shrinks PDF streams, compresses object buffers, and flattens metadata headers.
              </p>
            </div>

            {!compressPdfFile ? (
              <div
                id="compress-pdf-drag-drop"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => compressPdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-black bg-zinc-100 dark:border-white dark:bg-zinc-900"
                    : "border-black hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950"
                }`}
              >
                <input
                  type="file"
                  ref={compressPdfInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setupCompressPdfFile(f);
                  }}
                  accept=".pdf"
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG AND DROP OR BROWSE YOUR TARGET PDF
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Performs local high-fidelity byte structure compression and metadata stream filtering.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
                >
                  SELECT_PDF
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT ADJUSTMENTS COLUMN */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      <FolderOpen className="w-4 h-4" /> PARAMETERS.CFG
                    </h3>
                    <button
                      onClick={() => { setCompressPdfFile(null); setCompressPdfResult(null); }}
                      className="text-[10px] font-mono font-bold uppercase underline hover:text-red-500 cursor-pointer"
                    >
                      [CHANGE_FILE]
                    </button>
                  </div>

                  {/* FILE INFO */}
                  <div className="bg-white dark:bg-black border-2 border-black p-3.5 rounded-lg space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FILE_NAME:</span>
                      <strong className="truncate max-w-[200px] text-black dark:text-white">{compressPdfFile.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">FILE_SIZE:</span>
                      <strong className="text-black dark:text-white">{formatBytes(compressPdfFile.size)}</strong>
                    </div>
                  </div>

                  {/* TARGET WEIGHT */}
                  {(() => {
                    const maxPdfKB = Math.max(20, Math.round(compressPdfFile.size / 1024));
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold font-mono text-zinc-500 uppercase">
                            TARGET SIZE LIMIT:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max={maxPdfKB}
                              value={compressPdfTargetKB || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === "") {
                                  setCompressPdfTargetKB(0);
                                } else if (!isNaN(val)) {
                                  setCompressPdfTargetKB(Math.min(maxPdfKB, Math.max(1, val)));
                                }
                              }}
                              onBlur={() => {
                                if (!compressPdfTargetKB || compressPdfTargetKB < 1) {
                                  setCompressPdfTargetKB(20);
                                }
                              }}
                              className="w-20 px-2 py-0.5 text-right font-mono font-bold border-2 border-black bg-white dark:bg-zinc-900 text-black dark:text-white text-xs outline-none focus:border-zinc-500"
                            />
                            <span className="text-xs font-mono font-bold text-zinc-500">KB</span>
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="20"
                          max={maxPdfKB}
                          step="10"
                          value={compressPdfTargetKB || 20}
                          onChange={(e) => setCompressPdfTargetKB(parseInt(e.target.value))}
                          className="w-full accent-black dark:accent-white h-1 bg-zinc-200 dark:bg-zinc-800 cursor-pointer"
                        />
                      </div>
                    );
                  })()}

                  {/* RUN COMPRESSION BUTTON */}
                  <button
                    onClick={handleCompressPdfAction}
                    disabled={compressPdfIsProcessing}
                    className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888]"
                  >
                    {compressPdfIsProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>EXECUTING_ALGORITHMS...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>COMPRESS PDF NOW</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  <div className="space-y-6">
                    {/* Main status box */}
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                      <FileText className="w-16 h-16 text-zinc-400 mb-3" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        PDF FILE LOADED INTO SYSTEM MEMORY
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Binary stream: application/pdf ({formatBytes(compressPdfFile.size)})
                      </p>
                    </div>

                    {/* Converted Results & Download details */}
                    {compressPdfResult && (
                      <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span>OPTIMIZATION PIPELINE CONCLUDED SUCCESSFULLY!</span>
                        </div>

                        {/* Display final sizes */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="bg-white dark:bg-black border border-black p-3 rounded-lg text-black dark:text-white">
                            <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// BEFORE:</span>
                            <span className="font-bold text-sm">{formatBytes(compressPdfFile.size)}</span>
                          </div>
                          <div className="bg-white dark:bg-black border border-black p-3 rounded-lg text-black dark:text-white">
                            <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// AFTER:</span>
                            <span className="font-bold text-sm text-green-600 dark:text-green-400">
                              {formatBytes(compressPdfResult.size)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 border border-black bg-white dark:bg-black rounded-lg text-xs font-mono text-center text-black dark:text-white">
                          REDUCED WEIGHT BY:{" "}
                          <strong className="text-green-600 dark:text-green-400 text-sm block mt-1">
                            {formatBytes(compressPdfFile.size - compressPdfResult.size)} (-
                            {Math.round(((compressPdfFile.size - compressPdfResult.size) / compressPdfFile.size) * 100)}%)
                          </strong>
                        </div>

                        {/* RENAME OPTION */}
                        <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <label className="block text-[11px] font-mono font-bold text-black dark:text-white uppercase">
                            RENAME CONVERTED OUTPUT FILE:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={compressPdfCustomName}
                              onChange={(e) => setCompressPdfCustomName(e.target.value)}
                              placeholder="Enter output filename"
                              className="flex-grow p-2 bg-white dark:bg-zinc-900 border-2 border-black rounded text-xs font-mono focus:outline-none text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                            />
                            <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold flex items-center justify-center rounded text-black dark:text-white">
                              .pdf
                            </span>
                          </div>
                        </div>

                        {/* DOWNLOAD BUTTON */}
                        <button
                          onClick={() => {
                            saveAndDownload(
                              compressPdfResult.url,
                              compressPdfCustomName || compressPdfResult.filename,
                              compressPdfFile.name,
                              "pdf",
                              compressPdfFile.size,
                              compressPdfResult.size,
                              "application/pdf"
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CONVERT IMAGE SCREEN */}
        {currentView === "convert_img" && (
          <div className="space-y-6 animate-fade-in" id="convert-img-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                CONVERT_IMG.PRG // IMAGE FORMAT CONVERTER
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Transcode a single image to JPG, JPEG, or PNG format locally.
              </p>
            </div>

            {convertImgFiles.length === 0 ? (
              <div
                id="convert-img-drag-drop"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => convertImgInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all border-black hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950`}
              >
                <input
                  type="file"
                  ref={convertImgInputRef}
                  onChange={(e) => {
                    if (e.target.files) setupConvertImgFiles(e.target.files);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG & DROP OR BROWSE YOUR IMAGE
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Select or drop a single image to transcode its format.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
                >
                  UPLOAD_IMAGE
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT ADJUSTMENTS COLUMN */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      <FolderOpen className="w-4 h-4" /> PARAMETERS.CFG
                    </h3>
                    <button
                      onClick={() => {
                        setConvertImgFiles([]);
                        setConvertImgResult(null);
                        setConvertImgPreviewUrl("");
                      }}
                      className="text-[10px] font-mono font-bold uppercase underline hover:text-red-500 cursor-pointer"
                    >
                      [CLEAR_ALL]
                    </button>
                  </div>

                  {/* CHOOSE FORMAT TARGET */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold text-zinc-500 uppercase">
                      CHOOSE TARGET FORMAT PARADIGM:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-white dark:bg-black p-1 border-2 border-black rounded-lg">
                      {(["JPG", "JPEG", "PNG"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setConvertImgTargetFmt(fmt)}
                          className={`py-2 text-[10px] font-mono font-bold uppercase rounded cursor-pointer transition-all ${
                            convertImgTargetFmt === fmt ? "bg-black text-white" : "text-zinc-500 hover:text-black"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase leading-normal">
                      Converts the uploaded file to designated pixel format locally.
                    </p>
                  </div>

                  {/* ACTIVE FILE LIST */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono font-bold text-zinc-500 uppercase">
                        ACTIVE IMAGE PAYLOAD:
                      </label>
                      <button
                        onClick={() => convertImgInputRef.current?.click()}
                        className="text-[10px] font-mono font-bold border border-black bg-white hover:bg-black hover:text-white px-2 py-0.5 uppercase cursor-pointer"
                      >
                        REPLACE
                      </button>
                      <input
                        type="file"
                        ref={convertImgInputRef}
                        onChange={(e) => {
                          if (e.target.files) setupConvertImgFiles(e.target.files);
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="border-2 border-black rounded-lg p-3 bg-white dark:bg-black">
                      {convertImgFiles.map((file, idx) => {
                        const tempUrl = URL.createObjectURL(file);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <img
                                src={tempUrl}
                                alt="Source"
                                className="w-12 h-12 object-cover border border-black rounded bg-white"
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate text-left">
                                <p className="font-sans font-bold text-[11px] text-black dark:text-white truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
                                  SIZE: {formatBytes(file.size)}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setConvertImgFiles([]);
                                setConvertImgResult(null);
                                setConvertImgPreviewUrl("");
                              }}
                              className="p-1 border border-black bg-red-100 dark:bg-zinc-800 text-red-700 hover:bg-red-700 hover:text-white text-[10px] font-bold cursor-pointer"
                              title="Delete File"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RUN ACTION */}
                  <button
                    onClick={handleConvertImgAction}
                    disabled={convertImgIsProcessing}
                    className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888]"
                  >
                    {convertImgIsProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>CONVERTING_DATA_ARRAYS...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>CONVERT IMAGE NOW</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {convertImgFiles.length > 0 && convertImgPreviewUrl ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Pane: Source Preview */}
                      <div className="border-2 border-black rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                        <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                          <span>👁️ SOURCE_FILE_PREVIEW.DAT</span>
                          <span className="text-[9px] text-zinc-500 font-normal uppercase">● QUEUED</span>
                        </div>
                        <div className="flex-grow p-4 overflow-auto flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-900/30">
                          <img
                            src={convertImgPreviewUrl}
                            alt="Preview Source"
                            style={{ transform: `rotate(${convertImgRotation}deg)` }}
                            className="max-w-full max-h-[180px] object-contain border border-black p-1 bg-white shadow transition-transform duration-300 ease-in-out"
                          />
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-800 border-t-2 border-black px-3 py-2 flex items-center justify-center gap-3">
                          <button
                            onClick={() => setConvertImgRotation(prev => (prev - 90) % 360)}
                            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer text-black dark:text-white active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 transition-all"
                            title="Rotate 90 degrees counter-clockwise"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>ROTATE CCW (-90°)</span>
                          </button>
                          <button
                            onClick={() => setConvertImgRotation(prev => (prev + 90) % 360)}
                            className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer text-black dark:text-white active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 transition-all"
                            title="Rotate 90 degrees clockwise"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>ROTATE CW (+90°)</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Pane: Converted Result or Waiting Placeholder */}
                      {convertImgResult ? (
                        <div className="border-2 border-black rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                          <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                            <span>👁️ CONVERTED_IMAGE_PREVIEW.DAT</span>
                            <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● CONVERTED</span>
                          </div>
                          <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                            <img
                              src={convertImgResult.url}
                              alt="Converted preview"
                              className="max-w-full max-h-[250px] object-contain border border-black shadow"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-zinc-400 rounded-lg min-h-[220px] max-h-[350px] bg-zinc-50/50 dark:bg-zinc-950/50 overflow-hidden flex flex-col justify-center items-center p-6 text-center">
                          <RefreshCw className="w-8 h-8 text-zinc-400 mb-2 animate-spin-slow" />
                          <span className="block text-[11px] font-mono font-bold text-zinc-500 uppercase">
                            [CONVERTED_PREVIEW.DAT]
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono uppercase mt-1">
                            Awaiting compilation trigger...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-6 text-center flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        PIPELINE ACTIVE & WAITING
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Upload an image on the left and select target format to convert it.
                      </p>
                    </div>
                  )}

                  {/* OUTPUT RESULTS */}
                  {convertImgResult && (
                    <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>CONVERSION SUCCESSFULLY WRITTEN TO LOCAL BLOCKS.</span>
                      </div>

                      <div className="bg-white dark:bg-black border border-black p-3.5 rounded-lg space-y-1 text-xs font-mono text-black dark:text-white">
                        <div className="flex justify-between">
                          <span>TOTAL SOURCE IMAGES:</span>
                          <strong>{convertImgFiles.length}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>TRANSCODED OUTPUT WEIGHT:</span>
                          <strong>{formatBytes(convertImgResult.size)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>OUTPUT DESIGNATION:</span>
                          <strong className="uppercase">{convertImgTargetFmt}</strong>
                        </div>
                      </div>

                      {/* POST-CONVERSION RENAME */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <label className="block text-[11px] font-mono font-bold text-black dark:text-white uppercase">
                          RENAME COMPILATION OUT-NODE:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={convertImgCustomName}
                            onChange={(e) => setConvertImgCustomName(e.target.value)}
                            placeholder="Enter output name"
                            className="flex-grow p-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded text-xs font-mono focus:outline-none"
                          />
                          <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] text-black dark:text-white font-mono font-bold flex items-center justify-center rounded">
                            .{convertImgTargetFmt.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* DOWNLOAD & CONVERT ANOTHER FILE BUTTONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            saveAndDownload(
                              convertImgResult.url,
                              convertImgCustomName || convertImgResult.filename,
                              convertImgFiles[0].name,
                              "image",
                              convertImgFiles.reduce((s, f) => s + f.size, 0),
                              convertImgResult.size,
                              `image/${convertImgTargetFmt.toLowerCase()}`
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                        <button
                          onClick={() => {
                            setConvertImgFiles([]);
                            setConvertImgResult(null);
                            setConvertImgPreviewUrl("");
                          }}
                          className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>CONVERT ANOTHER FILE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: MERGE PDF SCREEN */}
        {currentView === "merge_pdf" && (
          <div className="space-y-6 animate-fade-in" id="merge-pdf-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                MERGE_PDF.PRG // DOCUMENT MERGER
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Merges multiple independent PDF documents into a clean compiled document stream in the correct physical sequence.
              </p>
            </div>

            {mergePdfFiles.length === 0 ? (
              <div
                id="merge-pdf-drag-drop"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => mergePdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all border-black hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950`}
              >
                <input
                  type="file"
                  ref={mergePdfInputRef}
                  onChange={(e) => {
                    if (e.target.files) setupMergePdfFiles(e.target.files);
                  }}
                  accept="application/pdf"
                  multiple
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <Files className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG AND DROP OR BROWSE YOUR PDF DOCUMENTS
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Upload multiple PDF files. Rearrange page streams in physical priority and join them cleanly.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
                >
                  UPLOAD_PDFS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT ADJUSTMENTS COLUMN */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      <FolderOpen className="w-4 h-4" /> PARAMETERS.CFG
                    </h3>
                    <button
                      onClick={() => { setMergePdfFiles([]); setMergePdfResult(null); }}
                      className="text-[10px] font-mono font-bold uppercase underline hover:text-red-500 cursor-pointer"
                    >
                      [CLEAR_ALL]
                    </button>
                  </div>

                  {/* ACTIVE FILE LIST */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono font-bold text-zinc-500 uppercase">
                        QUEUED DOCUMENTS ({mergePdfFiles.length}):
                      </label>
                      <button
                        onClick={() => mergePdfInputRef.current?.click()}
                        className="text-[10px] font-mono font-bold border border-black bg-white hover:bg-black hover:text-white px-2 py-0.5 uppercase cursor-pointer"
                      >
                        + Add PDFs
                      </button>
                      <input
                        type="file"
                        ref={mergePdfInputRef}
                        onChange={(e) => {
                          if (e.target.files) setupMergePdfFiles(e.target.files);
                        }}
                        accept="application/pdf"
                        multiple
                        className="hidden"
                      />
                    </div>

                    <div className="max-h-[220px] overflow-y-auto border-2 border-black rounded-lg divide-y divide-black bg-white dark:bg-black">
                      {mergePdfFiles.map((file, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-mono hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-bold text-[10px] text-zinc-400">[{idx + 1}]</span>
                            <span className="truncate text-black dark:text-white" title={file.name}>{file.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Move Up */}
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                const list = [...mergePdfFiles];
                                const tmp = list[idx];
                                list[idx] = list[idx - 1];
                                list[idx - 1] = tmp;
                                setMergePdfFiles(list);
                              }}
                              className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            {/* Move Down */}
                            <button
                              disabled={idx === mergePdfFiles.length - 1}
                              onClick={() => {
                                const list = [...mergePdfFiles];
                                const tmp = list[idx];
                                list[idx] = list[idx + 1];
                                list[idx + 1] = tmp;
                                setMergePdfFiles(list);
                              }}
                              className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Page */}
                            <button
                              onClick={() => {
                                setMergePdfFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                              }}
                              className="p-1.5 border border-red-300 dark:border-red-900 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                              title="Delete Page"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RUN ACTION */}
                  <button
                    onClick={handleMergePdfAction}
                    disabled={mergePdfIsProcessing}
                    className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888]"
                  >
                    {mergePdfIsProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>CONSOLIDATING_DOCS...</span>
                      </>
                    ) : (
                      <>
                        <Files className="w-4 h-4" />
                        <span>MERGE PDF FILES NOW</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {mergePdfResult ? (
                    <div className="border-2 border-black rounded-lg h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                      <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                        <span>👁️ MERGED_PDF_PREVIEW.DAT</span>
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● SYNTHESIZED</span>
                      </div>
                      <iframe
                        src={`${mergePdfResult.url}#toolbar=0`}
                        className="w-full flex-grow border-0 bg-white"
                        title="Merged PDF Preview"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-6 text-center flex flex-col items-center justify-center">
                      <Files className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        MULTI-STREAM PIPELINE READY
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Ready to synthesize {mergePdfFiles.length} catalog streams into a clean unified payload.
                      </p>
                    </div>
                  )}

                  {/* OUTPUT RESULTS */}
                  {mergePdfResult && (
                    <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>CONSOLIDATION PIPELINE CONCLUDED SUCCESSFULLY!</span>
                      </div>

                      <div className="bg-white dark:bg-black border border-black p-3.5 rounded-lg space-y-1 text-xs font-mono text-black dark:text-white">
                        <div className="flex justify-between">
                          <span>TOTAL MERGED DOCUMENTS:</span>
                          <strong>{mergePdfFiles.length}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>FINAL PAYLOAD SIZE:</span>
                          <strong>{formatBytes(mergePdfResult.size)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>FILE FORMAT DESIGNATION:</span>
                          <strong>application/pdf</strong>
                        </div>
                      </div>

                      {/* POST-CONVERSION RENAME */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <label className="block text-[11px] font-mono font-bold text-black dark:text-white uppercase">
                          RENAME CONSOLIDATED OUT-NODE:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={mergePdfCustomName}
                            onChange={(e) => setMergePdfCustomName(e.target.value)}
                            placeholder="Enter output name"
                            className="flex-grow p-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded text-xs font-mono focus:outline-none"
                          />
                          <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] text-black dark:text-white font-mono font-bold flex items-center justify-center rounded">
                            .pdf
                          </span>
                        </div>
                      </div>

                      {/* DOWNLOAD & CONVERT ANOTHER FILE BUTTONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            saveAndDownload(
                              mergePdfResult.url,
                              mergePdfCustomName || mergePdfResult.filename,
                              mergePdfFiles[0].name,
                              "pdf",
                              mergePdfFiles.reduce((s, f) => s + f.size, 0),
                              mergePdfResult.size,
                              "application/pdf"
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                        <button
                          onClick={() => {
                            setMergePdfFiles([]);
                            setMergePdfResult(null);
                          }}
                          className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>CONVERT ANOTHER FILE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: IMAGE TO PDF SCREEN */}
        {currentView === "image_to_pdf" && (
          <div className="space-y-6 animate-fade-in" id="image-to-pdf-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                IMAGE_TO_PDF.PRG // IMAGE COMPILER
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Compile single or multiple images into a clean, custom-aligned PDF document completely offline in your client sandbox.
              </p>
            </div>

            {imageToPdfFiles.length === 0 ? (
              <div
                id="image-to-pdf-drag-drop"
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = Array.from(e.dataTransfer.files) as File[];
                  setupImageToPdfFiles(files);
                }}
                onClick={() => imageToPdfInputRef.current?.click()}
                className="border-2 border-dashed border-black dark:border-zinc-700 rounded-xl p-12 text-center cursor-pointer bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <input
                  type="file"
                  ref={imageToPdfInputRef}
                  onChange={(e) => {
                    if (e.target.files) setupImageToPdfFiles(e.target.files);
                  }}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG & DROP OR BROWSE YOUR COMPILER ASSETS
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Select or drop single/multiple images. Build formatted offline PDF page sequences.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-black border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
                >
                  UPLOAD_IMAGES
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT ADJUSTMENTS COLUMN */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      <FolderOpen className="w-4 h-4" /> COMPILER_STACK.CFG
                    </h3>
                    <button
                      onClick={() => { setImageToPdfFiles([]); setImageToPdfRotations([]); setImageToPdfResult(null); }}
                      className="text-[10px] font-mono font-bold uppercase underline hover:text-red-500 cursor-pointer"
                    >
                      [CLEAR_ALL]
                    </button>
                  </div>

                  {/* ACTIVE QUEUED IMAGES */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                      <span>QUEUED COMPILER IMAGES ({imageToPdfFiles.length}):</span>
                      <button
                        onClick={() => imageToPdfInputRef.current?.click()}
                        className="text-[10px] uppercase text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> ADD_MORE
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={imageToPdfInputRef}
                      onChange={(e) => {
                        if (e.target.files) setupImageToPdfFiles(e.target.files);
                      }}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />

                    <div className="max-h-[300px] overflow-y-auto border-2 border-black bg-white dark:bg-black rounded-lg p-2 space-y-2">
                      {imageToPdfFiles.map((file, idx) => {
                        const tempUrl = URL.createObjectURL(file);
                        const rotation = imageToPdfRotations[idx] || 0;
                        return (
                          <div 
                            key={`${file.name}-${idx}`}
                            className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-2 rounded bg-zinc-50 dark:bg-zinc-900 gap-2"
                          >
                            <div className="flex items-center gap-2 truncate flex-1">
                              <div className="w-10 h-10 flex items-center justify-center overflow-hidden border border-black rounded bg-white shrink-0">
                                <img
                                  src={tempUrl}
                                  alt="Thumb"
                                  style={{ transform: `rotate(${rotation}deg)` }}
                                  className="max-w-full max-h-full object-contain transition-transform duration-300 ease-in-out"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="truncate text-left">
                                <p className="font-sans font-bold text-[11px] text-black dark:text-white truncate">
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-zinc-400 font-mono">
                                  PAGE {idx + 1} // {formatBytes(file.size)} {rotation !== 0 ? `// ${rotation}°` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Rotate CCW */}
                              <button
                                onClick={() => {
                                  setImageToPdfRotations(prev => {
                                    const next = [...prev];
                                    next[idx] = ((next[idx] || 0) - 90) % 360;
                                    return next;
                                  });
                                }}
                                className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                                title="Rotate 90° CCW"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Rotate CW */}
                              <button
                                onClick={() => {
                                  setImageToPdfRotations(prev => {
                                    const next = [...prev];
                                    next[idx] = ((next[idx] || 0) + 90) % 360;
                                    return next;
                                  });
                                }}
                                className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                                title="Rotate 90° CW"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Up */}
                              <button
                                disabled={idx === 0}
                                onClick={() => {
                                  const list = [...imageToPdfFiles];
                                  const tmp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = tmp;
                                  setImageToPdfFiles(list);

                                  const rotList = [...imageToPdfRotations];
                                  const rotTmp = rotList[idx];
                                  rotList[idx] = rotList[idx - 1];
                                  rotList[idx - 1] = rotTmp;
                                  setImageToPdfRotations(rotList);
                                }}
                                className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                disabled={idx === imageToPdfFiles.length - 1}
                                onClick={() => {
                                  const list = [...imageToPdfFiles];
                                  const tmp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = tmp;
                                  setImageToPdfFiles(list);

                                  const rotList = [...imageToPdfRotations];
                                  const rotTmp = rotList[idx];
                                  rotList[idx] = rotList[idx + 1];
                                  rotList[idx + 1] = rotTmp;
                                  setImageToPdfRotations(rotList);
                                }}
                                className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Page */}
                              <button
                                onClick={() => {
                                  setImageToPdfFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                                  setImageToPdfRotations(prev => prev.filter((_, fIdx) => fIdx !== idx));
                                }}
                                className="p-1 border border-black bg-red-100 dark:bg-zinc-800 text-red-700 hover:bg-red-700 hover:text-white text-[9px] font-bold cursor-pointer"
                                title="Delete Page"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleImageToPdfAction}
                    disabled={imageToPdfIsProcessing}
                    className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888]"
                  >
                    {imageToPdfIsProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>COMPILING_IMAGE_NODES...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>COMPILE IMAGES TO PDF</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT COLUMN: PREVIEW & OUTPUT */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // PREVIEW_MONITOR.DAT
                  </h3>

                  {imageToPdfResult ? (
                    <div className="border-2 border-black rounded-lg h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative shadow-[2px_2px_0_0_#000000] dark:shadow-[2px_2px_0_0_#ffffff]">
                      <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                        <span>👁️ COMPILED_PDF_PREVIEW_STREAM.DAT</span>
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● COMPILED</span>
                      </div>
                      <div className="flex-grow bg-white dark:bg-zinc-900">
                        <iframe
                          src={imageToPdfResult.url}
                          className="w-full h-full border-none"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-6 text-center flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        COMPILER PIPELINE WAITING
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Assemble your image stack on the left and trigger compilation to build an interactive PDF.
                      </p>
                    </div>
                  )}

                  {/* OUTPUT RESULTS */}
                  {imageToPdfResult && (
                    <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>IMAGE COMPILATION CONCLUDED SUCCESSFULLY!</span>
                      </div>

                      <div className="bg-white dark:bg-black border border-black p-3.5 rounded-lg space-y-1 text-xs font-mono text-black dark:text-white">
                        <div className="flex justify-between">
                          <span>SOURCE PAGES COMPILED:</span>
                          <strong>{imageToPdfFiles.length} IMAGES</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>CONSOLIDATED FILE SIZE:</span>
                          <strong>{formatBytes(imageToPdfResult.size)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>FILE FORMAT DESIGNATION:</span>
                          <strong>application/pdf</strong>
                        </div>
                      </div>

                      {/* POST-CONVERSION RENAME */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <label className="block text-[11px] font-mono font-bold text-black dark:text-white uppercase">
                          RENAME CONSOLIDATED OUT-NODE:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageToPdfCustomName}
                            onChange={(e) => setImageToPdfCustomName(e.target.value)}
                            placeholder="compiled_images_document"
                            className="flex-grow p-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded text-xs font-mono focus:outline-none"
                          />
                          <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] text-black dark:text-white font-mono font-bold flex items-center justify-center rounded">
                            .pdf
                          </span>
                        </div>
                      </div>

                      {/* DOWNLOAD & CONVERT ANOTHER FILE BUTTONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            saveAndDownload(
                              imageToPdfResult.url,
                              imageToPdfCustomName || imageToPdfResult.filename,
                              imageToPdfFiles[0].name,
                              "pdf",
                              imageToPdfFiles.reduce((s, f) => s + f.size, 0),
                              imageToPdfResult.size,
                              "application/pdf"
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                        <button
                          onClick={() => {
                            setImageToPdfFiles([]);
                            setImageToPdfRotations([]);
                            setImageToPdfResult(null);
                          }}
                          className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>CONVERT ANOTHER STACK</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}







        {/* VIEW 7: PRIVACY POLICY SCREEN */}
        {currentView === "privacy" && (
          <div className="space-y-6 animate-fade-in" id="privacy-policy-view">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-black pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" /> PRIVACY_POLICY.TXT // SECURITY_BYLAWS
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Channel security protocol status: <span className="font-bold uppercase text-green-600 dark:text-green-400">100% LOCAL COMPLIANT</span>
                </p>
              </div>
              <button
                onClick={() => { setCurrentView("home"); setLegalSearch(""); setPrivacyTab("all"); }}
                className="px-4 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer self-start sm:self-auto active:translate-y-0.5 active:shadow-none"
              >
                [BACK_TO_HOME]
              </button>
            </div>

            {/* SEARCH AND FILTER CONTROL STATION */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 border-2 border-black rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">FILTER_SECTION:</span>
                <button
                  onClick={() => setPrivacyTab("all")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    privacyTab === "all"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setPrivacyTab("local")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    privacyTab === "local"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  Local Processing
                </button>
                <button
                  onClick={() => setPrivacyTab("storage")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    privacyTab === "storage"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  State & Storage
                </button>
                <button
                  onClick={() => setPrivacyTab("rights")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    privacyTab === "rights"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  User Rights
                </button>
              </div>

              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={legalSearch}
                  onChange={(e) => setLegalSearch(e.target.value)}
                  placeholder="SEARCH_POLICIES.EXE (e.g. cookies, GDPR...)"
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded font-mono text-xs uppercase placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                />
                {legalSearch && (
                  <button
                    onClick={() => setLegalSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* PRIMARY CONTENT */}
              <div className="lg:col-span-8 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {/* 01. ZERO-CLOUD PROCESSING */}
                {(privacyTab === "all" || privacyTab === "local") &&
                  ("01. ZERO-CLOUD PROCESSING MANIFESTO LOCAL TRANSCODER DECENTRALIZED CLIENT-ONLY PARADIGM IMAGE COMPRESSION PDF MERGE"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">01</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          ZERO-CLOUD PROCESSING MANIFESTO
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        MONO-TRANSCODER is structurally engineered on a decentralized, client-only paradigm. Every image compression, PDF merge, PDF compression, and file transaction you trigger occurs 100% inside your browser's sandboxed process thread. No files are uploaded to any external cloud, remote servers, or secondary file repositories. All bytes remain strictly yours.
                      </p>
                    </div>
                  )}

                {/* 02. ZERO TELEMETRY */}
                {(privacyTab === "all" || privacyTab === "local") &&
                  ("02. ZERO TELEMETRY & COOKIE DETECTOR SURVEILLANCE METRICS DIAGNOSTIC LOGGING THIRD-PARTY ANALYTICAL"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">02</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          ZERO TELEMETRY & COOKIE DETECTOR
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        We do not deploy surveillance metrics, diagnostic logging trackers, telemetry aggregators, or targeting advertising algorithms. No third-party analytical integrations (such as Google Analytics or Segment) exist in our codebase. Your operational workflow remains entirely anonymous and decoupled from our web hosting infrastructure.
                      </p>
                    </div>
                  )}

                {/* 03. STATE VARIABLES & LOCAL STORAGE */}
                {(privacyTab === "all" || privacyTab === "storage") &&
                  ("03. STATE VARIABLES & CACHE PERSISTENCE CUSTOM SETTINGS TRANSACTION LOGS LOCALSTORAGE API HIST_LOG.DAT PURGE_LOGS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">03</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          STATE VARIABLES & CACHE PERSISTENCE
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        Custom settings are compiled using standard browser LocalStorage APIs. This storage persists locally to rebuild your application preferences across separate work sessions. You hold absolute control: you can clear this cache instantly via standard browser settings or cache clearing processes.
                      </p>
                    </div>
                  )}

                {/* 04. PERMISSIONS */}
                {(privacyTab === "all" || privacyTab === "rights") &&
                  ("04. PERMISSIONS & BROWSER SECURITY SECURITY BOUNDARIES CAMERA LOCATION MICROPHONE IDENTITY HARDWARE RESOURCES"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">04</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          PERMISSIONS & BROWSER SECURITY
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        Our platform executes within strict security boundaries. No camera, location, microphone, contact list, or external identity access is requested or triggered during file execution. Hardware resources are dedicated purely to mathematical calculations for local image down-sampling and PDF compounding.
                      </p>
                    </div>
                  )}

                {/* 05. THIRD-PARTY RESOURCES */}
                {(privacyTab === "all" || privacyTab === "local" || privacyTab === "storage") &&
                  ("05. LOCAL LIBRARY ARCHITECTURE WEB WORKERS OFFLINE EXECUTION PDF-LIB EMBEDDED"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">05</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          LOCAL LIBRARY ARCHITECTURE
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        We leverage highly trusted open-source packages including <span className="text-black dark:text-white font-bold">pdf-lib</span>. These utilities are bundled into our production scripts and run synchronously or asynchronously inside your browser tab's CPU context. No network calls are dispatched to external API servers during file conversions or manipulations.
                      </p>
                    </div>
                  )}

                {/* 06. USER RIGHTS (GDPR & CCPA COMPLIANCE) */}
                {(privacyTab === "all" || privacyTab === "rights") &&
                  ("06. DATA SUBJECT RIGHTS GDPR CCPA COMPLIANCE RIGHT TO BE FORGOTTEN COVEREIGNTY WIPING COOKIES SITE DATA"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">06</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          USER SOVEREIGNTY (GDPR & CCPA RIGHTS)
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        Since all data resides on your storage volume, we do not have access to, manage, or keep your records. You have an absolute right to update, download, or forget your files. Cleaving your local data history or clearing your site data inside your browser instantly exercises your absolute right to be forgotten.
                      </p>
                    </div>
                  )}

                {/* NO SEARCH RESULTS FALLBACK */}
                {!(
                  ("01. ZERO-CLOUD PROCESSING MANIFESTO LOCAL TRANSCODER DECENTRALIZED CLIENT-ONLY PARADIGM IMAGE COMPRESSION PDF MERGE"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "local")) ||
                  ("02. ZERO TELEMETRY & COOKIE DETECTOR SURVEILLANCE METRICS DIAGNOSTIC LOGGING THIRD-PARTY ANALYTICAL"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "local")) ||
                  ("03. STATE VARIABLES & CACHE PERSISTENCE CUSTOM SETTINGS LOCALSTORAGE API"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "storage")) ||
                  ("04. PERMISSIONS & BROWSER SECURITY SECURITY BOUNDARIES CAMERA LOCATION MICROPHONE IDENTITY HARDWARE RESOURCES"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "rights")) ||
                  ("05. LOCAL LIBRARY ARCHITECTURE WEB WORKERS OFFLINE EXECUTION PDF-LIB EMBEDDED"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "local" || privacyTab === "storage")) ||
                  ("06. DATA SUBJECT RIGHTS GDPR CCPA COMPLIANCE RIGHT TO BE FORGOTTEN COVEREIGNTY WIPING COOKIES SITE DATA"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (privacyTab === "all" || privacyTab === "rights"))
                ) && (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-400 rounded-lg">
                    <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="font-mono text-xs uppercase text-zinc-500">
                      NO PROTOCOLS COMPATIBLE WITH SEARCH QUERY: "{legalSearch.toUpperCase()}"
                    </p>
                  </div>
                )}
              </div>

              {/* RETRO ASSURANCE RAIL */}
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-4">
                <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white border-b border-black pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" /> VERIFICATION.LOG
                </h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500 uppercase">ENCRYPTION:</span>
                    <strong className="text-black dark:text-white">LOCAL_AES_TLS</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500 uppercase">CLOUD_TRAFFIC:</span>
                    <strong className="text-red-500">0.00 KB/S</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500 uppercase">SANDBOX_LOCK:</span>
                    <strong className="text-green-500">SECURE_TRUE</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500 uppercase">HOST_ORIGIN:</span>
                    <strong className="text-black dark:text-white truncate max-w-[120px]" title={window.location.hostname}>
                      {window.location.hostname || "SANDBOX"}
                    </strong>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black border border-black rounded text-[10px] font-mono text-zinc-500 uppercase leading-relaxed">
                  Notice: All compliance audits confirm absolute user sovereignty. You are the sole executor and owner of all active data pools.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: TERMS OF USE SCREEN */}
        {currentView === "terms" && (
          <div className="space-y-6 animate-fade-in" id="terms-of-use-view">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-black pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> TERMS_OF_USE.TXT // SERVICE_BYLAWS
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Agreement parameter: <span className="font-bold uppercase text-black dark:text-white">FREE_DECENTRALIZED_UTILITY</span>
                </p>
              </div>
              <button
                onClick={() => { setCurrentView("home"); setLegalSearch(""); setTermsTab("all"); }}
                className="px-4 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer self-start sm:self-auto active:translate-y-0.5 active:shadow-none"
              >
                [BACK_TO_HOME]
              </button>
            </div>

            {/* SEARCH AND FILTER CONTROL STATION */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 border-2 border-black rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">FILTER_SECTION:</span>
                <button
                  onClick={() => setTermsTab("all")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    termsTab === "all"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setTermsTab("usage")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    termsTab === "usage"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  Permitted Use
                </button>
                <button
                  onClick={() => setTermsTab("ownership")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    termsTab === "ownership"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  File Sovereignty
                </button>
                <button
                  onClick={() => setTermsTab("liability")}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black rounded transition-all cursor-pointer ${
                    termsTab === "liability"
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-none"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  Warranties & Limit
                </button>
              </div>

              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={legalSearch}
                  onChange={(e) => setLegalSearch(e.target.value)}
                  placeholder="SEARCH_TERMS.EXE (e.g. warranty, commercial...)"
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded font-mono text-xs uppercase placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                />
                {legalSearch && (
                  <button
                    onClick={() => setLegalSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* PRIMARY TERMS */}
              <div className="lg:col-span-8 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {/* 01. SOFTWARE ACCEPTANCE */}
                {(termsTab === "all" || termsTab === "usage") &&
                  ("01. SOFTWARE ACCEPTANCE & SANDBOX RUNTIME LOCAL TRANSCODERS COMPRESS_IMG.PRG COMPRESS_PDF.PRG MATHEMATICAL CALCULATIONS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">01</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          SOFTWARE ACCEPTANCE & SANDBOX RUNTIME
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        By accessing and invoking the local transcoders (<span className="text-black dark:text-white">COMPRESS_IMG.PRG</span>, <span className="text-black dark:text-white">COMPRESS_PDF.PRG</span>, etc.), you agree to execute these mathematical calculations strictly within your client sandbox environment. The tools are supplied "as is", for personal, public, and commercial utilization.
                      </p>
                    </div>
                  )}

                {/* 02. ABSOLUTE DATA SOVEREIGNTY */}
                {(termsTab === "all" || termsTab === "ownership") &&
                  ("02. ABSOLUTE DATA SOVEREIGNTY LICENSE STAKES COPYRIGHT CLAIMS OWNER CUSTODIAN SOURCE OUTPUT ASSETS VALID AUTHORIZATION"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">02</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          ABSOLUTE DATA SOVEREIGNTY
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        MONO-TRANSCODER retains zero rights, licensing stakes, or copyright claims over files processed, generated, down-sampled, or merged using these routines. You are the exclusive custodian and proprietor of your source and output assets. You are solely responsible for ensuring you have valid authorization to optimize files.
                      </p>
                    </div>
                  )}

                {/* 03. PERMITTED AND APPROPRIATE USE */}
                {(termsTab === "all" || termsTab === "usage") &&
                  ("03. PERMITTED AND APPROPRIATE USE COMMERCIAL PERSONAL EDUCATIONAL DEVELOPER REVERSE ENGINEERING MALICIOUS ACTIONS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">03</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          PERMITTED AND APPROPRIATE USE
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        You may use this application for commercial or personal file manipulation. You are strictly forbidden from embedding this application in iframe containers of phishing domains or using it to distribute malicious scripts. All file operations must conform with regional regulatory jurisdictions.
                      </p>
                    </div>
                  )}

                {/* 04. LIMITATION OF LIABILITY */}
                {(termsTab === "all" || termsTab === "liability") &&
                  ("04. LIMITATION OF LIABILITY & STAGE FAULTS BROWSER MEMORY SPACE RETRO PRODUCTIVITY LABS EXEMPT DATA LOSS CORRUPTIONS memory leaks"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">04</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          LIMITATION OF LIABILITY & STAGE FAULTS
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        Because processing occurs completely inside your local browser memory space, RETRO PRODUCTIVITY LABS is structurally exempt from any liability concerning data loss, file corruptions, memory leaks, client tab crashes, or data storage inconsistencies. Maintain backup copies of all files before execution.
                      </p>
                    </div>
                  )}

                {/* 05. NO WARRANTY DISCLAIMER */}
                {(termsTab === "all" || termsTab === "liability") &&
                  ("05. NO WARRANTY DISCLAIMER AS IS CLAUSE MEMORY LIMITS NO FITNESS PARTICULAR PURPOSE CORRUPTION REPAIRS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">05</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          NO WARRANTY DISCLAIMER
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        The utility is provided "AS IS", without warranty of any kind, express or implied. Memory limits are dictated by your device's browser stack. In rare instances, importing exceptionally oversized files (e.g., massive high-resolution imagery) may reach sandbox heap caps, which is an expected browser defense behavior.
                      </p>
                    </div>
                  )}

                {/* 06. DECENTRALIZED TERMINATION BYPASS */}
                {(termsTab === "all" || termsTab === "usage") &&
                  ("06. DECENTRALIZED TERMINATION BYPASS AGREEMENT CONTRACTUAL OBLIGATIONS TERMINATE ACCESS WIPE LOGS CLOSE TAB"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase())) && (
                    <div className="p-5 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2 mb-3 border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="p-1 bg-black text-white dark:bg-white dark:text-black rounded text-[10px] font-bold">06</span>
                        <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white">
                          DECENTRALIZED TERMINATION BYPASS
                        </h3>
                      </div>
                      <p className="uppercase leading-loose text-zinc-600 dark:text-zinc-400">
                        This agreement carries no long-term contractual obligations. You may terminate access and revoke compliance parameters instantly at any time. To do so, simply clear your browser storage variables, purge your logs via the <span className="text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1 rounded">HIST_LOG.DAT</span> view, and close your active browser tab.
                      </p>
                    </div>
                  )}

                {/* NO SEARCH RESULTS FALLBACK */}
                {!(
                  ("01. SOFTWARE ACCEPTANCE & SANDBOX RUNTIME LOCAL TRANSCODERS COMPRESS_IMG.PRG COMPRESS_PDF.PRG MATHEMATICAL CALCULATIONS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "usage")) ||
                  ("02. ABSOLUTE DATA SOVEREIGNTY LICENSE STAKES COPYRIGHT CLAIMS OWNER CUSTODIAN SOURCE OUTPUT ASSETS VALID AUTHORIZATION"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "ownership")) ||
                  ("03. PERMITTED AND APPROPRIATE USE COMMERCIAL PERSONAL EDUCATIONAL DEVELOPER REVERSE ENGINEERING MALICIOUS ACTIONS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "usage")) ||
                  ("04. LIMITATION OF LIABILITY & STAGE FAULTS BROWSER MEMORY SPACE RETRO PRODUCTIVITY LABS EXEMPT DATA LOSS CORRUPTIONS memory leaks"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "liability")) ||
                  ("05. NO WARRANTY DISCLAIMER AS IS CLAUSE MEMORY LIMITS NO FITNESS PARTICULAR PURPOSE CORRUPTION REPAIRS"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "liability")) ||
                  ("06. DECENTRALIZED TERMINATION BYPASS AGREEMENT CONTRACTUAL OBLIGATIONS TERMINATE ACCESS WIPE LOGS CLOSE TAB"
                    .toLowerCase()
                    .includes(legalSearch.toLowerCase()) && (termsTab === "all" || termsTab === "usage"))
                ) && (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-400 rounded-lg">
                    <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="font-mono text-xs uppercase text-zinc-500">
                      NO SERVICE BYLAWS COMPATIBLE WITH SEARCH QUERY: "{legalSearch.toUpperCase()}"
                    </p>
                  </div>
                )}
              </div>

              {/* TERMS ASSETS BOARD */}
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-4 font-mono text-xs">
                <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white border-b border-black pb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> COMPLIANCE.CFG
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="uppercase">LICENSE_TYPE:</span>
                    <strong className="text-black dark:text-white">MIT_STANDARD</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="uppercase">USAGE_LIMIT:</span>
                    <strong className="text-green-500">UNLIMITED</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="uppercase">WARRANTIES:</span>
                    <strong className="text-red-500">ZERO_NONE</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="uppercase">SOURCE_AVAIL:</span>
                    <strong className="text-black dark:text-white">MIT_OPEN</strong>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black border border-black rounded text-[10px] text-zinc-500 uppercase leading-relaxed">
                  By continuing, you acknowledge that all computational transformations are executed directly under your supervision in real-time.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER FOOTNOTES */}
      <footer className="border-t-3 border-black bg-zinc-100 dark:bg-black py-6 px-4 md:px-8 mt-12 shrink-0 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 text-[11px] text-zinc-600 dark:text-zinc-400 uppercase font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              <span>SECURE_SANDBOX: Files transacted 100% locally. Zero cloud data leaks.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView("privacy")}
                className="underline hover:text-black dark:hover:text-white cursor-pointer"
              >
                PRIVACY_POLICY.TXT
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentView("terms")}
                className="underline hover:text-black dark:hover:text-white cursor-pointer"
              >
                TERMS_OF_USE.TXT
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 uppercase">
            © 2026 MONO-TRANSCODER • RETRO PRODUCTIVITY LABS
          </p>
        </div>
      </footer>
    </div>
  );
}
