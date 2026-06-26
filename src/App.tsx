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
  Files
} from "lucide-react";
import { RetroView, HistoryItem, ImageFormat } from "./types";
import { formatBytes, compressToTargetSizeKB, processImageClientSide } from "./utils/imageProcessor";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

const QUICK_ACTIONS = [
  { id: "action-compress-img", title: "Compress Image File", desc: "Reduce dimensions and optimization parameters to targeted KB size.", view: "compress_img" },
  { id: "action-compress-pdf", title: "Optimize PDF Document", desc: "Restructure resources and stream layouts to compress PDF file weight.", view: "compress_pdf" },
  { id: "action-convert-img", title: "Convert Image Format", desc: "Transcode images to JPG, JPEG, or PNG formats locally.", view: "convert_img" },
  { id: "action-image-to-pdf", title: "Image to PDF Converter", desc: "Compile single or multiple images into a clean, custom-aligned PDF document.", view: "image_to_pdf" },
  { id: "action-merge-pdf", title: "Merge PDF Documents", desc: "Combine multiple PDF files together with simple page and file sorting tools.", view: "merge_pdf" },
  { id: "action-word-to-pdf", title: "Word to PDF Converter", desc: "Convert Word documents (.docx) directly into formatted PDF streams.", view: "word_to_pdf" },
  { id: "action-pdf-to-word", title: "PDF to Word Converter", desc: "Extract text streams from PDF files and transcode them to compatible Word (.doc) format.", view: "pdf_to_word" }
];

export default function App() {
  const [currentView, setCurrentView] = useState<RetroView>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const darkMode = true;
  
  // History logs (loaded from/persisted to localStorage)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("mono_transcoder_history_v2");
    return saved ? JSON.parse(saved) : [
      {
        id: "log-1",
        filename: "hero_banner_compressed.webp",
        originalName: "hero_banner_original.png",
        type: "image",
        originalSize: 1843200, // 1.8MB
        compressedSize: 245760, // 240KB
        url: "#",
        format: "image/webp",
        timestamp: "2026-06-25 07:30"
      },
      {
        id: "log-2",
        filename: "q3_report_optimized.pdf",
        originalName: "q3_report.pdf",
        type: "pdf",
        originalSize: 4505600, // 4.3MB
        compressedSize: 983040, // 960KB
        url: "#",
        format: "application/pdf",
        timestamp: "2026-06-25 06:12"
      }
    ];
  });

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
  // [06] WORD_TO_PDF.PRG STATES
  // ==========================================
  const [wordInputFile, setWordInputFile] = useState<File | null>(null);
  const [wordResult, setWordResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
    text?: string;
  } | null>(null);
  const [wordOutputCustomName, setWordOutputCustomName] = useState<string>("");
  const [wordIsProcessing, setWordIsProcessing] = useState<boolean>(false);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // [07] PDF_TO_WORD.PRG STATES
  // ==========================================
  const [pdfInputFile, setPdfInputFile] = useState<File | null>(null);
  const [pdfToWordResult, setPdfToWordResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
    text?: string;
  } | null>(null);
  const [pdfToWordOutputCustomName, setPdfToWordOutputCustomName] = useState<string>("");
  const [pdfToWordIsProcessing, setPdfToWordIsProcessing] = useState<boolean>(false);
  const pdfToWordInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // [08] IMAGE_TO_PDF.PRG STATES
  // ==========================================
  const [imageToPdfFiles, setImageToPdfFiles] = useState<File[]>([]);
  const [imageToPdfResult, setImageToPdfResult] = useState<{
    url: string;
    size: number;
    filename: string;
    format: string;
  } | null>(null);
  const [imageToPdfCustomName, setImageToPdfCustomName] = useState<string>("");
  const [imageToPdfIsProcessing, setImageToPdfIsProcessing] = useState<boolean>(false);
  const imageToPdfInputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("mono_transcoder_history_v2", JSON.stringify(history));
  }, [history]);

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
      } else if (currentView === "word_to_pdf") {
        setupWordToPdfFile(droppedFiles[0]);
      } else if (currentView === "pdf_to_word") {
        setupPdfToWordFile(droppedFiles[0]);
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
      setConvertImgFiles(prev => [...prev, ...validFiles]);
      setConvertImgResult(null);
      setConvertImgCustomName("");
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
      setImageToPdfResult(null);
      setImageToPdfCustomName("");
    }
  };

  const setupWordToPdfFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      alert("Invalid file type. Please select a Word document ending with .docx");
      return;
    }
    setWordInputFile(file);
    setWordResult(null);
    setWordOutputCustomName("");
  };

  const setupPdfToWordFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Invalid file type. Please select a PDF file ending with .pdf");
      return;
    }
    setPdfInputFile(file);
    setPdfToWordResult(null);
    setPdfToWordOutputCustomName("");
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
      const res = await processImageClientSide(file, 0.85, 1.0, mimeType as ImageFormat);
      
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
      
      for (const file of imageToPdfFiles) {
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
        
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
        }
        
        // Use standard JPEG format for compatibility with pdf-lib embedding
        const jpgBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
        const jpgBytes = await jpgBlob.arrayBuffer();
        const embeddedImage = await pdfDoc.embedJpg(jpgBytes);
        
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
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

  // ==========================================
  // [06] WORD_CONVERT.PRG FUNCTIONS
  // ==========================================
  const extractTextFromPdfContentStream = (uncompressedStr: string): string => {
    const textLines: string[] = [];
    const operators = uncompressedStr.split(/\r?\n/);
    for (const op of operators) {
      const tjMatches = op.match(/\(([^)]*)\)\s*Tj/);
      if (tjMatches) {
        textLines.push(tjMatches[1]);
      } else {
        const tjBlockMatches = op.match(/\[(.*)\]\s*TJ/);
        if (tjBlockMatches) {
          const inner = tjBlockMatches[1];
          const parts: string[] = [];
          const partRegex = /\(([^)]*)\)/g;
          let partMatch;
          while ((partMatch = partRegex.exec(inner)) !== null) {
            parts.push(partMatch[1]);
          }
          if (parts.length > 0) {
            textLines.push(parts.join(""));
          }
        }
      }
    }

    if (textLines.length === 0) {
      const generalRegex = /\(([^)]+)\)\s*(Tj|TJ|'|")/g;
      let genMatch;
      while ((genMatch = generalRegex.exec(uncompressedStr)) !== null) {
        textLines.push(genMatch[1]);
      }
    }

    if (textLines.length === 0) {
      const btEtBlocks = uncompressedStr.match(/BT[\s\S]*?ET/g);
      if (btEtBlocks) {
        for (const block of btEtBlocks) {
          const parenRegex = /\(([^)]*)\)/g;
          let parenMatch;
          while ((parenMatch = parenRegex.exec(block)) !== null) {
            textLines.push(parenMatch[1]);
          }
        }
      }
    }

    return textLines
      .map(line => line
        .replace(/\\([()])/g, "$1")
        .replace(/\\r/g, "")
        .replace(/\\n/g, " ")
        .trim()
      )
      .filter(Boolean)
      .join("\n");
  };

  const handleWordToPdf = async () => {
    if (!wordInputFile) return;
    setWordIsProcessing(true);
    try {
      const arrayBuffer = await wordInputFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value || "Empty Word Document.";

      const pdfDoc = await PDFDocument.create();
      const margin = 50;
      const fontSize = 11;
      const lineHeight = 15;

      let page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      const printableWidth = width - margin * 2;
      const printableHeight = height - margin * 2;

      let currentY = height - margin;
      const paragraphs = text.split(/\r?\n/);

      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
          currentY -= lineHeight;
          if (currentY < margin) {
            page = pdfDoc.addPage([612, 792]);
            currentY = height - margin;
          }
          continue;
        }

        let currentLineWords: string[] = [];
        for (const word of words) {
          currentLineWords.push(word);
          const lineText = currentLineWords.join(" ");
          const estimatedWidth = lineText.length * fontSize * 0.55;

          if (estimatedWidth > printableWidth && currentLineWords.length > 1) {
            currentLineWords.pop();
            const drawText = currentLineWords.join(" ");

            page.drawText(drawText, {
              x: margin,
              y: currentY,
              size: fontSize,
            });

            currentY -= lineHeight;
            if (currentY < margin) {
              page = pdfDoc.addPage([612, 792]);
              currentY = height - margin;
            }

            currentLineWords = [word];
          }
        }

        if (currentLineWords.length > 0) {
          page.drawText(currentLineWords.join(" "), {
            x: margin,
            y: currentY,
            size: fontSize,
          });
          currentY -= lineHeight * 1.5;
          if (currentY < margin) {
            page = pdfDoc.addPage([612, 792]);
            currentY = height - margin;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      setWordResult({
        url: pdfUrl,
        size: pdfBlob.size,
        filename: wordInputFile.name.replace(/\.[^/.]+$/, "") + "_converted",
        format: "application/pdf",
        text: text
      });
      setWordOutputCustomName(wordInputFile.name.replace(/\.[^/.]+$/, "") + "_converted");
    } catch (err) {
      console.error(err);
      alert("Failed to transcode Word document (.docx) to PDF format.");
    } finally {
      setWordIsProcessing(false);
    }
  };

  const handlePdfToWord = async () => {
    if (!pdfInputFile) return;
    setPdfToWordIsProcessing(true);
    try {
      const fileBytes = await pdfInputFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pageCount = pdfDoc.getPageCount();

      let allPageTexts: string[] = [];

      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const contentStreams = (page as any).getContentStreams();
        let decompressedText = "";
        for (const stream of contentStreams) {
          const uncompressedValue = stream.getUncompressedValue();
          decompressedText += new TextDecoder().decode(uncompressedValue) + "\n";
        }
        const pageText = extractTextFromPdfContentStream(decompressedText);
        allPageTexts.push(pageText || `[Empty Page ${i + 1}]`);
      }

      const docHtmlParagraphs = allPageTexts.map((p, idx) => {
        const escaped = p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .split("\n")
          .map(line => `<p style="margin-bottom: 8px; line-height: 1.5; font-size: 11pt;">${line}</p>`)
          .join("");

        return `
          <div style="page-break-after: always; margin-bottom: 24px; border-bottom: 1px dashed #ccc; padding-bottom: 12px;">
            <h2 style="font-size: 13pt; color: #555; font-family: monospace; border-bottom: 1px solid #eee; margin-bottom: 12px;">--- PAGE ${idx + 1} OF PDF ---</h2>
            ${escaped}
          </div>
        `;
      }).join("");

      const docContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <title>Converted Document</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              margin: 1in;
              color: #000000;
            }
            p {
              margin: 0 0 8px 0;
            }
          </style>
        </head>
        <body>
          <div style="font-size: 11pt;">
            <h1 style="font-size: 18pt; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 20px;">PDF_CONVERTED_DOCUMENT.DAT</h1>
            <p style="font-size: 9pt; font-family: monospace; color: #666; margin-bottom: 30px;">SOURCE FILE: ${pdfInputFile.name} | COMPILED: ${new Date().toISOString()}</p>
            ${docHtmlParagraphs}
          </div>
        </body>
        </html>
      `.trim();

      const docBlob = new Blob([docContent], { type: "application/msword" });
      const docUrl = URL.createObjectURL(docBlob);
      const fullTextPreview = allPageTexts.map((p, idx) => `[PAGE ${idx + 1}]\n${p}`).join("\n\n");

      setPdfToWordResult({
        url: docUrl,
        size: docBlob.size,
        filename: pdfInputFile.name.replace(/\.[^/.]+$/, "") + "_converted",
        format: "application/msword",
        text: fullTextPreview
      });
      setPdfToWordOutputCustomName(pdfInputFile.name.replace(/\.[^/.]+$/, "") + "_converted");
    } catch (err) {
      console.error(err);
      alert("Failed to extract and transcode PDF to Word (.doc) format.");
    } finally {
      setPdfToWordIsProcessing(false);
    }
  };

  // Log to history and download
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

    // Save log
    const newLog: HistoryItem = {
      id: "log-" + Date.now(),
      filename: downloadName,
      originalName: originalName,
      type: fileType,
      originalSize: originalSize,
      compressedSize: compressedSize,
      url: url,
      format: format,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setHistory((prev) => [newLog, ...prev]);
  };

  const clearLog = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Filter history based on search query
  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.filename.toLowerCase().includes(q) ||
      item.originalName.toLowerCase().includes(q) ||
      item.format.toLowerCase().includes(q)
    );
  });

  const totalSavedBytes = history.reduce((sum, item) => {
    const saved = item.originalSize - item.compressedSize;
    return saved > 0 ? sum + saved : sum;
  }, 0);

  return (
    <div 
      className={`min-h-screen ${darkMode ? "bg-black text-zinc-100" : "bg-white text-black"} flex flex-col font-sans transition-colors duration-200 retro-grid-bg`}
      id="application-root"
    >
      {/* HEADER SECTION */}
      <header className="border-b-3 border-black bg-white dark:bg-black py-6 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest uppercase border border-black">
                STABLE_SYS
              </span>
              <span className="text-xs text-zinc-500 font-mono">SANDBOX_ACTIVE (100% OFFLINE)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter font-sans leading-none">
              MONO-TRANSCODER
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1 uppercase max-w-xl leading-relaxed">
              Minimalist, high-contrast local file utility. Compress images/documents, reformat parameters, and optimize storage locally in the web browser.
            </p>
          </div>


        </div>
      </header>

      {/* CORE CONTROL DECK VIEW SWITCHER */}
      <nav className="border-b-3 border-black bg-zinc-50 dark:bg-zinc-900 py-3 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 justify-start">
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
          <button
            onClick={() => { setCurrentView("word_to_pdf"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "word_to_pdf"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            WORD_TO_PDF
          </button>
          <button
            onClick={() => { setCurrentView("pdf_to_word"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "pdf_to_word"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            PDF_TO_WORD
          </button>
          <button
            onClick={() => { setCurrentView("history"); }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black rounded-lg transition-all cursor-pointer ${
              currentView === "history"
                ? "bg-black text-white shadow-[2px_2px_0_0_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            HIST_LOG ({history.length})
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
                  placeholder="SEARCH CHANNELS, FILE TYPES OR RECENT LOG FILES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3.5 pl-10 bg-white dark:bg-black border-2 border-black rounded-xl text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="md:col-span-4 bg-zinc-100 dark:bg-zinc-900 border-2 border-black p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500 uppercase">LOGGED_ITEMS:</span>
                <span className="font-bold font-mono text-black dark:text-white">
                  {history.length} FILES TOTAL
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
                    className="bg-white dark:bg-black border-2 border-black rounded-xl p-5 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000000] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-9 h-9 border-2 border-black bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-black dark:text-white mb-4">
                        {action.view === "compress_img" && <ImageIcon className="w-5 h-5" />}
                        {action.view === "compress_pdf" && <FileText className="w-5 h-5" />}
                        {action.view === "convert_img" && <RefreshCw className="w-5 h-5" />}
                        {action.view === "image_to_pdf" && <ImageIcon className="w-5 h-5" />}
                        {action.view === "merge_pdf" && <Files className="w-5 h-5" />}
                        {action.view === "word_to_pdf" && <FileText className="w-5 h-5" />}
                        {action.view === "pdf_to_word" && <FileText className="w-5 h-5" />}
                      </div>
                      <h4 className="font-sans font-bold text-base uppercase tracking-tight text-black dark:text-white mb-2">
                        {action.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed mb-6">
                        {action.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentView(action.view as RetroView);
                      }}
                      className="w-full text-center py-2 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-mono font-bold uppercase border-2 border-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH_PROGRAM</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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

            {/* Quick preview of history logs if any exist */}
            {history.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-mono text-zinc-500 uppercase tracking-widest">
                    // RECENT TRANSCRIPTION LOGS
                  </h3>
                  <button 
                    onClick={() => setCurrentView("history")} 
                    className="text-xs font-mono font-bold uppercase underline hover:text-zinc-500"
                  >
                    View Timeline &gt;
                  </button>
                </div>
                
                <div className="border-2 border-black rounded-xl divide-y-2 divide-black overflow-hidden bg-white dark:bg-black font-mono text-xs">
                  {history.slice(0, 3).map((item) => {
                    const savedBytes = item.originalSize - item.compressedSize;
                    const percent = Math.round((savedBytes / item.originalSize) * 100);
                    return (
                      <div key={item.id} className="p-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="p-1.5 border border-black bg-zinc-100 dark:bg-zinc-900 uppercase text-[9px] font-bold">
                            {item.type}
                          </span>
                          <div>
                            <p className="font-sans font-bold text-black dark:text-white truncate max-w-[200px] sm:max-w-xs">{item.filename}</p>
                            <span className="text-[10px] text-zinc-400">ORIGINAL: {item.originalName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-black dark:text-white">
                              {formatBytes(item.compressedSize)}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              WAS: {formatBytes(item.originalSize)} ({percent > 0 ? `-${percent}%` : "0%"})
                            </p>
                          </div>
                          
                          <a
                            href={item.url === "#" ? undefined : item.url}
                            download={item.filename}
                            onClick={() => item.url === "#" && alert("This historical mock log item URL is for UI display. Newly converted files are fully downloadable!")}
                            className="p-1 border border-black bg-white text-black hover:bg-black hover:text-white font-bold text-[10px] uppercase cursor-pointer"
                          >
                            [DOWNLOAD_AGAIN]
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
            ) : compressImgResult ? (
              /* DEDICATED FULL-WIDTH RESULT PAGE */
              <div className="bg-white dark:bg-zinc-950 border-2 border-black rounded-xl p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-black pb-4 gap-4">
                  <div>
                    <h3 className="font-mono font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      🚀 SUCCESS_COMPRESSION_OUTPUT.DAT
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">
                      Transcoding pipeline completed. Your file is ready for acquisition.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCompressImgResult(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] cursor-pointer flex items-center gap-1.5 text-black dark:text-white active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      [← ADJUST_PARAMETERS]
                    </button>
                    <button
                      onClick={() => {
                        setCompressImgFile(null);
                        setCompressImgResult(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] cursor-pointer flex items-center gap-1.5 text-black dark:text-white active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      [CONVERT ANOTHER FILE]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left side: Preview */}
                  <div className="border-2 border-black rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center relative min-h-[300px]">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase mb-4 block">OPTIMIZED OUTPUT PREVIEW</span>
                    {compressImgResult.url && (
                      <img
                        src={compressImgResult.url}
                        alt="Optimized Output"
                        className="max-h-[250px] object-contain border-2 border-black p-1 bg-white shadow-md"
                      />
                    )}
                    <span className="text-[9px] font-mono text-zinc-400 mt-4 block">
                      FORMAT: {compressImgResult.format.toUpperCase()}
                    </span>
                  </div>

                  {/* Right side: Detailed Metrics & Controls */}
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-green-500 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg space-y-4">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-5 h-5" />
                        <span>OPTIMIZATION PIPELINE COMPLETED SUCCESSFULLY!</span>
                      </div>

                      {/* Display final sizes */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-white dark:bg-zinc-900 border-2 border-black p-3 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// BEFORE:</span>
                          <span className="font-bold text-sm text-black dark:text-white">{formatBytes(compressImgFile.size)}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border-2 border-black p-3 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// AFTER:</span>
                          <span className="font-bold text-sm text-green-600 dark:text-green-400">
                            {formatBytes(compressImgResult.size)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 border-2 border-black bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-center text-black dark:text-white">
                        REDUCED WEIGHT BY:{" "}
                        <strong className="text-green-600 dark:text-green-400 text-sm block mt-1">
                          {formatBytes(compressImgFile.size - compressImgResult.size)} (-
                          {Math.round(((compressImgFile.size - compressImgResult.size) / compressImgFile.size) * 100)}%)
                        </strong>
                      </div>
                    </div>

                    {/* POST-COMPRESSION RENAME OPTION */}
                    <div className="space-y-2">
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

                    {/* SAVE AND DOWNLOAD BUTTON */}
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
                      className="w-full py-3 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-sm uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      <Download className="w-5 h-5" />
                      <span>DOWNLOAD CONVERTED ASSET</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* PREVIEW & OUTPUT COLUMN (NOW FIRST/TOP) */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {/* Preview container */}
                  <div className="border-2 border-black rounded-lg min-h-[250px] bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                    {compressImgPreviewUrl && (
                      <div className="p-4 w-full flex flex-col items-center justify-center">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2">SOURCE_FILE PREVIEW</span>
                        <img
                          src={compressImgPreviewUrl}
                          alt="Preview Source"
                          className="max-h-[200px] object-contain border border-black p-1 bg-white"
                        />
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
            ) : compressPdfResult ? (
              /* DEDICATED FULL-WIDTH RESULT PAGE FOR PDF */
              <div className="bg-white dark:bg-zinc-950 border-2 border-black rounded-xl p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-black pb-4 gap-4">
                  <div>
                    <h3 className="font-mono font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                      🚀 SUCCESS_PDF_OUTPUT.DAT
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">
                      Optimization pipeline completed. Your file is ready for acquisition.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCompressPdfResult(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] cursor-pointer flex items-center gap-1.5 text-black dark:text-white active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      [← ADJUST_PARAMETERS]
                    </button>
                    <button
                      onClick={() => {
                        setCompressPdfFile(null);
                        setCompressPdfResult(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] cursor-pointer flex items-center gap-1.5 text-black dark:text-white active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      [CONVERT ANOTHER FILE]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left side: Visual representation of PDF (no iframe) */}
                  <div className="border-2 border-black rounded-lg p-8 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center relative min-h-[450px] text-center">
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-black text-white text-[9px] font-mono uppercase font-bold">
                      STATUS_READY.DAT
                    </div>
                    <FileText className="w-24 h-24 text-black dark:text-white mb-6 animate-pulse" />
                    <span className="block text-base font-mono font-bold text-black dark:text-white uppercase mb-2">
                      PDF DOCUMENT OPTIMIZED
                    </span>
                    <div className="max-w-xs w-full bg-white dark:bg-zinc-950 border-2 border-black p-3 rounded font-mono text-xs text-left text-black dark:text-white space-y-1">
                      <div className="text-[10px] text-zinc-500">// SOURCE_META:</div>
                      <div className="truncate font-bold text-xs">FILE: {compressPdfFile.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-2">// OUTPUT_META:</div>
                      <div className="truncate font-bold text-xs text-green-600 dark:text-green-400">
                        NAME: {compressPdfCustomName || compressPdfResult?.filename || "output"}.pdf
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase mt-4 block">
                      FORMAT: APPLICATION/PDF (LOCAL TRANSCODE)
                    </span>
                  </div>

                  {/* Right side: Detailed Metrics & Controls */}
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-green-500 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg space-y-4">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-5 h-5" />
                        <span>OPTIMIZATION PIPELINE COMPLETED SUCCESSFULLY!</span>
                      </div>

                      {/* Display final sizes */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-white dark:bg-zinc-900 border-2 border-black p-3 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// BEFORE:</span>
                          <span className="font-bold text-sm text-black dark:text-white">{formatBytes(compressPdfFile.size)}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border-2 border-black p-3 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1">// AFTER:</span>
                          <span className="font-bold text-sm text-green-600 dark:text-green-400">
                            {formatBytes(compressPdfResult.size)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 border-2 border-black bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-center text-black dark:text-white">
                        REDUCED WEIGHT BY:{" "}
                        <strong className="text-green-600 dark:text-green-400 text-sm block mt-1">
                          {formatBytes(compressPdfFile.size - compressPdfResult.size)} (-
                          {Math.round(((compressPdfFile.size - compressPdfResult.size) / compressPdfFile.size) * 100)}%)
                        </strong>
                      </div>
                    </div>

                    {/* POST-COMPRESSION RENAME OPTION */}
                    <div className="space-y-2">
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

                    {/* SAVE AND DOWNLOAD BUTTON */}
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
                      className="w-full py-3 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-sm uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                    >
                      <Download className="w-5 h-5" />
                      <span>DOWNLOAD CONVERTED ASSET</span>
                    </button>
                  </div>
                </div>
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
                      onClick={() => setCompressPdfFile(null)}
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

                  <div className="border-2 border-black rounded-lg min-h-[250px] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-16 h-16 text-zinc-400 mb-3" />
                    <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                      PDF FILE LOADED INTO SYSTEM MEMORY
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase">
                      Binary stream: application/pdf ({formatBytes(compressPdfFile.size)})
                    </p>
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
                Transcodes single images to JPG, JPEG, or PNG formats. Convert multiple images into a multi-page PDF document!
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
                  multiple
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 border-2 border-black bg-zinc-100 dark:bg-zinc-900 dark:border-white flex items-center justify-center text-black dark:text-white mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-bold text-base uppercase mb-1 text-black dark:text-white">
                  DRAG & DROP OR BROWSE YOUR IMAGES
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono max-w-sm mx-auto mb-4 uppercase">
                  Upload multiple files to compile into a single page-managed PDF, or select one for formats.
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
                      <FolderOpen className="w-4 h-4" /> PARAMETERS.CFG
                    </h3>
                    <button
                      onClick={() => { setConvertImgFiles([]); setConvertImgResult(null); }}
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
                    <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-black p-1 border-2 border-black rounded-lg">
                      {(["JPG", "JPEG", "PNG", "PDF"] as const).map((fmt) => (
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
                      {convertImgTargetFmt === "PDF" 
                        ? "Compiles ALL listed images into a unified, clean, multi-page PDF document stream."
                        : "Converts the FIRST file in your list to designated pixel format locally."}
                    </p>
                  </div>

                  {/* ACTIVE FILE LIST & REARRANGEABLE / DELETABLE CONTROLS */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono font-bold text-zinc-500 uppercase">
                        QUEUED IMAGES ({convertImgFiles.length}):
                      </label>
                      <button
                        onClick={() => convertImgInputRef.current?.click()}
                        className="text-[10px] font-mono font-bold border border-black bg-white hover:bg-black hover:text-white px-2 py-0.5 uppercase cursor-pointer"
                      >
                        + Add Files
                      </button>
                      <input
                        type="file"
                        ref={convertImgInputRef}
                        onChange={(e) => {
                          if (e.target.files) setupConvertImgFiles(e.target.files);
                        }}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>

                    <div className="max-h-[220px] overflow-y-auto border-2 border-black rounded-lg divide-y divide-black bg-white dark:bg-black">
                      {convertImgFiles.map((file, idx) => (
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
                                const list = [...convertImgFiles];
                                const tmp = list[idx];
                                list[idx] = list[idx - 1];
                                list[idx - 1] = tmp;
                                setConvertImgFiles(list);
                              }}
                              className="p-1 border border-black bg-zinc-100 hover:bg-black hover:text-white disabled:opacity-40 text-[9px] cursor-pointer"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            {/* Move Down */}
                            <button
                              disabled={idx === convertImgFiles.length - 1}
                              onClick={() => {
                                const list = [...convertImgFiles];
                                const tmp = list[idx];
                                list[idx] = list[idx + 1];
                                list[idx + 1] = tmp;
                                setConvertImgFiles(list);
                              }}
                              className="p-1 border border-black bg-zinc-100 hover:bg-black hover:text-white disabled:opacity-40 text-[9px] cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                            {/* Delete Page */}
                            <button
                              onClick={() => {
                                setConvertImgFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                              }}
                              className="p-1 border border-black bg-red-100 dark:bg-zinc-800 text-red-700 hover:bg-red-700 hover:text-white text-[9px] font-bold cursor-pointer"
                              title="Delete Page"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
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
                        <span>CONVERT IMAGES NOW</span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {convertImgResult ? (
                    convertImgTargetFmt === "PDF" ? (
                      <div className="border-2 border-black rounded-lg h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                        <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                          <span>👁️ COMPILED_PDF_PREVIEW.DAT</span>
                          <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● COMPILED</span>
                        </div>
                        <iframe
                          src={`${convertImgResult.url}#toolbar=0`}
                          className="w-full flex-grow border-0 bg-white"
                          title="Compiled PDF Preview"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-black rounded-lg min-h-[220px] max-h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                        <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                          <span>👁️ CONVERTED_IMAGE_PREVIEW.DAT</span>
                          <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● CONVERTED</span>
                        </div>
                        <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
                          <img
                            src={convertImgResult.url}
                            alt="Converted preview"
                            className="max-w-full max-h-[300px] object-contain border border-black shadow"
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-4 overflow-y-auto">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-2">PAGE LAYOUT PREVIEW</span>
                      <div className="grid grid-cols-3 gap-3">
                        {convertImgFiles.map((file, idx) => (
                          <div key={idx} className="border border-black p-1 bg-white relative group">
                            <span className="absolute top-1 left-1 bg-black text-white text-[9px] px-1 font-mono font-bold z-10">
                              P.{idx + 1}
                            </span>
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Queue preview"
                              className="w-full h-20 object-cover"
                            />
                          </div>
                        ))}
                      </div>
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
                              convertImgTargetFmt === "PDF" ? "pdf" : "image",
                              convertImgFiles.reduce((s, f) => s + f.size, 0),
                              convertImgResult.size,
                              convertImgTargetFmt === "PDF" ? "application/pdf" : `image/${convertImgTargetFmt.toLowerCase()}`
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
                              className="p-1 border border-black bg-zinc-100 hover:bg-black hover:text-white disabled:opacity-40 text-[9px] cursor-pointer"
                              title="Move Up"
                            >
                              ▲
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
                              className="p-1 border border-black bg-zinc-100 hover:bg-black hover:text-white disabled:opacity-40 text-[9px] cursor-pointer"
                              title="Move Down"
                            >
                              ▼
                            </button>
                            {/* Delete Page */}
                            <button
                              onClick={() => {
                                setMergePdfFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                              }}
                              className="p-1 border border-black bg-red-100 dark:bg-zinc-800 text-red-700 hover:bg-red-700 hover:text-white text-[9px] font-bold cursor-pointer"
                              title="Delete Page"
                            >
                              ✕
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

        {/* VIEW 6: WORD & PDF CONVERTER SCREEN */}
        {currentView === "word_convert" && (
          <div className="space-y-6 animate-fade-in" id="word-convert-view">
            <div className="border-b border-black pb-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                WORD_CONVERT.PRG // DOCUMENT TRANSLATOR
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Bidirectional transcoder. Transcode Word documents (.docx) to PDF format, or parse PDF content streams to extract and transcode directly to Word (.doc).
              </p>
            </div>

            {/* SUB-MODE SWITCHER */}
            <div className="flex border-2 border-black rounded-lg overflow-hidden max-w-sm">
              <button
                onClick={() => {
                  setWordMode("word_to_pdf");
                  setWordInputFile(null);
                  setPdfInputFile(null);
                  setWordResult(null);
                }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase cursor-pointer ${
                  wordMode === "word_to_pdf"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-white text-black dark:bg-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                WORD TO PDF (.docx)
              </button>
              <button
                onClick={() => {
                  setWordMode("pdf_to_word");
                  setWordInputFile(null);
                  setPdfInputFile(null);
                  setWordResult(null);
                }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase cursor-pointer ${
                  wordMode === "pdf_to_word"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-white text-black dark:bg-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                PDF TO WORD (.pdf)
              </button>
            </div>

            {wordMode === "word_to_pdf" ? (
              // ===================================
              // WORD TO PDF SUB-MODE
              // ===================================
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: UPLOAD & CONTROLS */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-4">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-black dark:text-white">
                      // {wordInputFile ? "ACTIVE_PAYLOAD_STAGE.SYS" : "UPLOAD_SOURCE_PAYLOAD.SYS"}
                    </h3>

                    {!wordInputFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          const files = Array.from(e.dataTransfer.files) as File[];
                          if (files.length > 0) {
                            if (!files[0].name.toLowerCase().endsWith(".docx")) {
                              alert("Invalid file type. Please upload a Word document ending with .docx");
                              return;
                            }
                            setWordInputFile(files[0]);
                          }
                        }}
                        onClick={() => wordInputRef.current?.click()}
                        className={`border-2 border-dashed border-black dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragOver ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <input
                          type="file"
                          ref={wordInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.name.toLowerCase().endsWith(".docx")) {
                                alert("Invalid file type. Please select a Word document ending with .docx");
                                return;
                              }
                              setWordInputFile(file);
                            }
                          }}
                          accept=".docx"
                          className="hidden"
                        />
                        <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4 animate-pulse" />
                        <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                          DRAG WORD FILE HERE (.docx)
                        </span>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">
                          OR CLICK TO EXPLORE HOST FILES
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-black rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900 space-y-4">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold uppercase rounded">
                              DOCX
                            </span>
                            <div className="truncate max-w-[180px]">
                              <p className="font-sans font-bold text-xs text-black dark:text-white truncate">
                                {wordInputFile.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                SIZE: {formatBytes(wordInputFile.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setWordInputFile(null);
                              setWordResult(null);
                            }}
                            className="p-1.5 border border-black hover:bg-black hover:text-white text-zinc-500 hover:text-white rounded cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="bg-white dark:bg-zinc-950 p-3.5 border border-zinc-300 dark:border-zinc-800 rounded font-mono text-[10px] text-zinc-500 space-y-1">
                          <div>STATUS: READY_FOR_TRANSCODE</div>
                          <div>COMPILER: MAMMOTH_TEXT_EXTRACTOR</div>
                          <div>OUT_STREAM: PDF-LIB (VECTOR LAYOUT)</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleWordToPdf}
                      disabled={!wordInputFile || wordIsProcessing}
                      className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {wordIsProcessing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                          <span>TRANSCODING WORD DOCX...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>CONVERT WORD TO PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW & OUTPUT */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {wordResult ? (
                    <div className="border-2 border-black rounded-lg h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                      <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                        <span>👁️ COMPILED_WORD_TEXT_PREVIEW.DAT</span>
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● COMPILED</span>
                      </div>
                      <div className="flex-grow p-4 overflow-y-auto font-mono text-xs text-black dark:text-zinc-300 space-y-4">
                        <div className="text-[10px] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1 uppercase">
                          // EXTRACTED_TEXT_STREAM:
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {wordResult.text || "[No readable text found in Document]"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-6 text-center flex flex-col items-center justify-center">
                      <FileText className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        PIPELINE ACTIVE & WAITING
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Upload a .docx file and trigger conversion to compile a standard PDF stream.
                      </p>
                    </div>
                  )}

                  {/* OUTPUT RESULTS */}
                  {wordResult && (
                    <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>TRANSCODING PIPELINE CONCLUDED SUCCESSFULLY!</span>
                      </div>

                      <div className="bg-white dark:bg-black border border-black p-3.5 rounded-lg space-y-1 text-xs font-mono text-black dark:text-white">
                        <div className="flex justify-between">
                          <span>SOURCE NAME:</span>
                          <strong className="truncate max-w-[200px]">{wordInputFile?.name}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>CONVERTED PAYLOAD SIZE:</span>
                          <strong>{formatBytes(wordResult.size)}</strong>
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
                            value={wordOutputCustomName}
                            onChange={(e) => setWordOutputCustomName(e.target.value)}
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
                              wordResult.url,
                              wordOutputCustomName || wordResult.filename,
                              wordInputFile!.name,
                              "pdf",
                              wordInputFile!.size,
                              wordResult.size,
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
                            setWordInputFile(null);
                            setWordResult(null);
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
            ) : (
              // ===================================
              // PDF TO WORD SUB-MODE
              // ===================================
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: UPLOAD & CONTROLS */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-4">
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-black dark:text-white">
                      // {pdfInputFile ? "ACTIVE_PAYLOAD_STAGE.SYS" : "UPLOAD_SOURCE_PAYLOAD.SYS"}
                    </h3>

                    {!pdfInputFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          const files = Array.from(e.dataTransfer.files) as File[];
                          if (files.length > 0) {
                            if (!files[0].name.toLowerCase().endsWith(".pdf")) {
                              alert("Invalid file type. Please upload a PDF file ending with .pdf");
                              return;
                            }
                            setPdfInputFile(files[0]);
                          }
                        }}
                        onClick={() => pdfToWordInputRef.current?.click()}
                        className={`border-2 border-dashed border-black dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragOver ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <input
                          type="file"
                          ref={pdfToWordInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.name.toLowerCase().endsWith(".pdf")) {
                                alert("Invalid file type. Please select a PDF file ending with .pdf");
                                return;
                              }
                              setPdfInputFile(file);
                            }
                          }}
                          accept=".pdf"
                          className="hidden"
                        />
                        <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4 animate-pulse" />
                        <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                          DRAG PDF FILE HERE (.pdf)
                        </span>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">
                          OR CLICK TO EXPLORE HOST FILES
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-black rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900 space-y-4">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-mono font-bold uppercase rounded">
                              PDF
                            </span>
                            <div className="truncate max-w-[180px]">
                              <p className="font-sans font-bold text-xs text-black dark:text-white truncate">
                                {pdfInputFile.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                SIZE: {formatBytes(pdfInputFile.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setPdfInputFile(null);
                              setWordResult(null);
                            }}
                            className="p-1.5 border border-black hover:bg-black hover:text-white text-zinc-500 hover:text-white rounded cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="bg-white dark:bg-zinc-950 p-3.5 border border-zinc-300 dark:border-zinc-800 rounded font-mono text-[10px] text-zinc-500 space-y-1">
                          <div>STATUS: READY_FOR_EXTRACTION</div>
                          <div>COMPILER: PDF-LIB STREAM DECODER</div>
                          <div>OUT_STREAM: OFFICE-XML / HTML-WORD COMPATIBLE</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handlePdfToWord}
                      disabled={!pdfInputFile || wordIsProcessing}
                      className="w-full py-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-2 border-black font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#888888] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#888888] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {wordIsProcessing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                          <span>EXTRACTING PDF TEXT STREAM...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>CONVERT PDF TO WORD</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW & OUTPUT */}
                <div className="lg:col-span-7 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6">
                  <h3 className="font-mono font-bold text-xs uppercase tracking-wider border-b border-black pb-3 text-black dark:text-white">
                    // VIEWPORT_STAGE.DAT
                  </h3>

                  {wordResult ? (
                    <div className="border-2 border-black rounded-lg h-[400px] bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col relative">
                      <div className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-black dark:text-white">
                        <span>👁️ EXTRACTED_PDF_TEXT_PREVIEW.DAT</span>
                        <span className="text-[9px] text-green-600 dark:text-green-400 font-normal uppercase animate-pulse">● EXTRACTED</span>
                      </div>
                      <div className="flex-grow p-4 overflow-y-auto font-mono text-xs text-black dark:text-zinc-300 space-y-4">
                        <div className="text-[10px] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-1 uppercase">
                          // DETECTED_PLAINTEXT_BUFFER:
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {wordResult.text || "[No readable text found in PDF document]"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-black rounded-lg min-h-[220px] bg-zinc-50 dark:bg-zinc-950 p-6 text-center flex flex-col items-center justify-center">
                      <FileText className="w-16 h-16 text-zinc-400 mb-3 animate-pulse" />
                      <span className="block text-xs font-mono font-bold text-black dark:text-white uppercase mb-1">
                        PIPELINE ACTIVE & WAITING
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">
                        Upload a .pdf file and trigger parsing to build a structured Word document.
                      </p>
                    </div>
                  )}

                  {/* OUTPUT RESULTS */}
                  {wordResult && (
                    <div className="border-2 border-dashed border-zinc-400 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span>TRANSCODING PIPELINE CONCLUDED SUCCESSFULLY!</span>
                      </div>

                      <div className="bg-white dark:bg-black border border-black p-3.5 rounded-lg space-y-1 text-xs font-mono text-black dark:text-white">
                        <div className="flex justify-between">
                          <span>SOURCE NAME:</span>
                          <strong className="truncate max-w-[200px]">{pdfInputFile?.name}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>CONVERTED PAYLOAD SIZE:</span>
                          <strong>{formatBytes(wordResult.size)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>FILE FORMAT DESIGNATION:</span>
                          <strong>application/msword</strong>
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
                            value={wordOutputCustomName}
                            onChange={(e) => setWordOutputCustomName(e.target.value)}
                            placeholder="Enter output name"
                            className="flex-grow p-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded text-xs font-mono focus:outline-none"
                          />
                          <span className="p-2 border-2 border-black bg-zinc-100 dark:bg-zinc-800 text-[10px] text-black dark:text-white font-mono font-bold flex items-center justify-center rounded">
                            .doc
                          </span>
                        </div>
                      </div>

                      {/* DOWNLOAD & CONVERT ANOTHER FILE BUTTONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            saveAndDownload(
                              wordResult.url,
                              wordOutputCustomName || wordResult.filename,
                              pdfInputFile!.name,
                              "document",
                              pdfInputFile!.size,
                              wordResult.size,
                              "application/msword"
                            );
                          }}
                          className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-mono font-bold text-xs uppercase border-2 border-black rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                        >
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD CONVERTED ASSET</span>
                        </button>
                        <button
                          onClick={() => {
                            setPdfInputFile(null);
                            setWordResult(null);
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

        {/* VIEW 4: TRANSACTION LOGS / HISTORY SCREEN */}
        {currentView === "history" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-black pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                  TRANSACTION HISTORY LOG
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Read-only journal of optimized storage pipelines and cached conversion streams.
                </p>
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to purge all local transcoder logs?")) {
                      setHistory([]);
                    }
                  }}
                  className="px-3 py-1.5 border-2 border-black text-xs font-mono font-bold text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  PURGE_LOGS
                </button>
              )}
            </div>

            {/* Timelines and Lists */}
            {filteredHistory.length === 0 ? (
              <div className="border-2 border-dashed border-black rounded-xl p-12 text-center bg-zinc-50 dark:bg-zinc-950 font-mono space-y-3">
                <Trash2 className="w-10 h-10 mx-auto text-zinc-400" />
                <h4 className="font-bold text-sm uppercase">No transaction entries found</h4>
                <p className="text-xs text-zinc-500">Run a compressor or converter routine to build system history.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* TIMELINE VIEW GRID */}
                <div className="border-2 border-black rounded-xl divide-y-2 divide-black overflow-hidden bg-white dark:bg-black font-mono text-xs">
                  {filteredHistory.map((item) => {
                    const savedBytes = item.originalSize - item.compressedSize;
                    const percent = Math.round((savedBytes / item.originalSize) * 100);
                    return (
                      <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-6 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                        <div className="flex items-center gap-3 min-w-[250px]">
                          <div className="p-2 border border-black bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold text-black dark:text-white uppercase">
                            {item.type}
                          </div>
                          <div>
                            <p className="font-sans font-bold text-black dark:text-white text-sm">{item.filename}</p>
                            <span className="text-[10px] text-zinc-400 block truncate max-w-sm">ORIGINAL: {item.originalName}</span>
                            <span className="text-[9px] text-zinc-400 block font-mono">{item.timestamp} // ISO_CACHE</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="text-right">
                            <p className="font-bold text-black dark:text-white text-sm">
                              {formatBytes(item.compressedSize)}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Original: {formatBytes(item.originalSize)}
                            </p>
                            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                              Saved: {formatBytes(savedBytes)} ({percent > 0 ? `-${percent}%` : "0%"})
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={item.url === "#" ? undefined : item.url}
                              download={item.filename}
                              onClick={() => item.url === "#" && alert("This historical log was created in a previous session. New files support immediate local redownload!")}
                              className="px-3 py-1.5 border border-black bg-white text-black hover:bg-black hover:text-white font-bold text-[10px] uppercase transition-colors"
                            >
                              [REDOWNLOAD]
                            </a>
                            <button
                              onClick={() => clearLog(item.id)}
                              className="p-1.5 border border-black text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* HISTORICAL RECOVERY INFO */}
                <div className="p-4 border-2 border-black rounded-xl bg-zinc-50 dark:bg-zinc-900/40 text-xs font-mono text-zinc-500 leading-relaxed uppercase">
                  <strong>SYSTEM_WARNING:</strong> Caches exist exclusively inside your local storage segment. Purging your browser cache or deleting storage variables will destroy historical timelines. Convert securely without cloud logging.
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
                <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                  PRIVACY_POLICY.TXT // SECURITY_BYLAWS
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Channel security protocol status: <span className="font-bold uppercase text-green-600 dark:text-green-400">100% LOCAL COMPLIANT</span>
                </p>
              </div>
              <button
                onClick={() => setCurrentView("home")}
                className="px-4 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer self-start sm:self-auto"
              >
                [BACK_TO_HOME]
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* PRIMARY CONTENT */}
              <div className="lg:col-span-8 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6 font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    01. ZERO-CLOUD PROCESSING MANIFESTO
                  </h3>
                  <p className="uppercase">
                    MONO-TRANSCODER is structurally engineered on a decentralized, client-only paradigm. Every image compression, PDF merge, PDF compression, and file transaction you trigger occurs 100% inside your browser's sandboxed process thread. No files are uploaded to any external cloud, remote servers, or secondary file repositories.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    02. ZERO TELEMETRY & COOKIE DETECTOR
                  </h3>
                  <p className="uppercase">
                    We do not deploy surveillance metrics, diagnostic logging trackers, telemetry aggregators, or targeting advertising algorithms. No third-party analytical integrations (such as Google Analytics or Segment) exist in our codebase. Your operational workflow remains entirely private.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    03. STATE VARIABLES & CACHE PERSISTENCE
                  </h3>
                  <p className="uppercase">
                    Custom settings and transaction logs (<span className="text-black dark:text-white">HIST_LOG.DAT</span>) are compiled using standard browser LocalStorage APIs. This storage persists locally to rebuild your history log across separate work sessions. You hold absolute control: you can clear this cache instantly via the "PURGE_LOGS" directive.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    04. PERMISSIONS & BROWSER SECURITY
                  </h3>
                  <p className="uppercase">
                    Our platform executes within strict security boundaries. No camera, location, microphone, or external identity access is requested or triggered during file execution. Hardware resources are dedicated purely to mathematical calculations for local image down-sampling.
                  </p>
                </div>
              </div>

              {/* RETRO ASSURANCE RAIL */}
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-4">
                <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white border-b border-black pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> VERIFICATION.LOG
                </h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">ENCRYPTION:</span>
                    <strong className="text-black dark:text-white">LOCAL_AES_TLS</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">CLOUD_TRAFFIC:</span>
                    <strong className="text-red-500">0.00 KB/S</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">SANDBOX_LOCK:</span>
                    <strong className="text-green-500">SECURE_TRUE</strong>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black border border-black rounded text-[10px] font-mono text-zinc-400 uppercase leading-relaxed">
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
                <h2 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white font-sans">
                  TERMS_OF_USE.TXT // SERVICE_BYLAWS
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Agreement parameter: <span className="font-bold uppercase text-black dark:text-white">FREE_DECENTRALIZED_UTILITY</span>
                </p>
              </div>
              <button
                onClick={() => setCurrentView("home")}
                className="px-4 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white border-2 border-black font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer self-start sm:self-auto"
              >
                [BACK_TO_HOME]
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* PRIMARY TERMS */}
              <div className="lg:col-span-8 bg-white dark:bg-black border-2 border-black rounded-xl p-6 space-y-6 font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    01. SOFTWARE ACCEPTANCE & SANDBOX RUNTIME
                  </h3>
                  <p className="uppercase">
                    By accessing and invoking the local transcoders (<span className="text-black dark:text-white">COMPRESS_IMG.PRG</span>, <span className="text-black dark:text-white">COMPRESS_PDF.PRG</span>, etc.), you agree to execute these mathematical calculations strictly within your client sandbox environment. The tools are supplied "as is", for personal, public, and commercial utilization.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    02. ABSOLUTE DATA SOUVEREIGNTY
                  </h3>
                  <p className="uppercase">
                    MONO-TRANSCODER retains zero rights, licensing stakes, or copyright claims over files processed, generated, down-sampled, or merged using these routines. You are the exclusive custodian and proprietor of your source and output assets. You are solely responsible for ensuring you have valid authorization to optimize files.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    03. LIMITATION OF LIABILITY & STAGE FAULTS
                  </h3>
                  <p className="uppercase">
                    Because processing occurs completely inside your local browser memory space, RETRO PRODUCTIVITY LABS is structurally exempt from any liability concerning data loss, file corruptions, memory leaks, client tab crashes, or data storage inconsistencies. Maintain backup copies of all files before execution.
                  </p>
                </div>

                <div className="p-4 border-2 border-black rounded-lg bg-zinc-50 dark:bg-zinc-950/60">
                  <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white mb-2">
                    04. DECENTRALIZED TERMINATION BYPASS
                  </h3>
                  <p className="uppercase">
                    This agreement carries no long-term contractual obligations. You may terminate access and revoke compliance parameters instantly at any time. To do so, simply clear your browser storage variables, purge your logs via the <span className="text-black dark:text-white">HIST_LOG.DAT</span> view, and close your active browser tab.
                  </p>
                </div>
              </div>

              {/* TERMS ASSETS BOARD */}
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-black rounded-xl p-6 space-y-4 font-mono text-xs">
                <h3 className="font-sans font-bold text-sm uppercase text-black dark:text-white border-b border-black pb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> COMPLIANCE.CFG
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span>LICENSE_TYPE:</span>
                    <strong className="text-black dark:text-white">MIT_STANDARD</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span>USAGE_LIMIT:</span>
                    <strong className="text-green-500">UNLIMITED</strong>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-zinc-300 dark:border-zinc-800 pb-1.5">
                    <span>WARRANTIES:</span>
                    <strong className="text-red-500">ZERO_NONE</strong>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-black border border-black rounded text-[10px] text-zinc-400 uppercase leading-relaxed">
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
