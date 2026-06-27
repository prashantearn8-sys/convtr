import React, { useEffect } from "react";
import { RetroView } from "../types";

interface HelmetProps {
  currentView: RetroView;
}

export default function Helmet({ currentView }: HelmetProps) {
  useEffect(() => {
    // 1. Determine title and description based on currentView
    let title = "MONO-TRANSCODER - Secure Local File Converter & Compressor";
    let description = "Compress and convert images, documents, and PDFs securely inside your browser. No server uploads. Absolute data privacy.";

    switch (currentView) {
      case "compress_img":
        title = "Compress Image - MONO-TRANSCODER";
        description = "Compress JPG, PNG, WEBP, and BMP images locally. Set target file size in KB and optimize dimensions securely.";
        break;
      case "compress_pdf":
        title = "Compress PDF - MONO-TRANSCODER";
        description = "Optimize and reduce the file size of PDF documents inside your browser securely.";
        break;
      case "convert_img":
        title = "Convert Image - MONO-TRANSCODER";
        description = "Convert image files to PNG, JPEG, WEBP, or BMP format instantly in your browser.";
        break;
      case "image_to_pdf":
        title = "Image to PDF - MONO-TRANSCODER";
        description = "Convert and combine multiple images into a beautifully aligned single PDF document.";
        break;
      case "merge_pdf":
        title = "Merge PDF - MONO-TRANSCODER";
        description = "Merge multiple PDF files into one. Rearrange page orders and combine documents locally.";
        break;
      case "privacy":
        title = "Privacy Policy - MONO-TRANSCODER";
        description = "Our absolute 100% offline-first privacy commitment. No tracking, zero servers, full client-side privacy.";
        break;
      case "terms":
        title = "Terms of Service - MONO-TRANSCODER";
        description = "Usage terms for the 100% client-side MONO-TRANSCODER application.";
        break;
      case "home":
      default:
        title = "MONO-TRANSCODER - Secure Local File Converter & Compressor";
        description = "Compress and convert images, documents, and PDFs securely inside your browser. No server uploads. Absolute data privacy.";
        break;
    }

    // Update document title
    document.title = title;

    // Helper to find or create a meta tag
    const updateMetaTag = (nameAttr: string, value: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${nameAttr}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, nameAttr);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    // Helper to find or create a link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Update meta description
    updateMetaTag("description", description);

    // 3. Update dynamic route canonical URL and OpenGraph URL meta tags
    const origin = typeof window !== "undefined" ? window.location.origin : "https://monotranscoder.netlify.app";
    const path = currentView === "home" ? "/" : `/${currentView.replace(/_/g, "-")}`;
    const canonicalUrl = `${origin}${path}`;

    updateLinkTag("canonical", canonicalUrl);
    updateMetaTag("og:url", canonicalUrl, true);
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", "website", true);

    // Dynamic Twitter Cards for SEO
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);

  }, [currentView]);

  return null;
}
