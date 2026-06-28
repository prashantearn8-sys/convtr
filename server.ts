import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use helmet for robust security headers (XSS protection, Clickjacking prevention, Content Sniffing prevention, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval is required by Vite's development bundler
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https://*"], // allow local blobs, data URIs, and external images for conversion/compression
          connectSrc: ["'self'", "https://*", "wss://*"], // allows API queries and WebSocket triggers for Dev HMR
          workerSrc: ["'self'", "blob:"], // critical for PDF libraries using web workers
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Disabled to prevent blocking local Object URL blobs from rendering in browser memory
    })
  );

  // Configure Cross-Origin Resource Sharing (CORS) to prevent malicious domains from calling the API
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" ? false : true, // Strict self-only CORS in production
      credentials: true,
    })
  );

  // Rate limiter for API endpoints to prevent DoS/brute-force abuse
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP address to 100 requests per 15 minutes
    standardHeaders: true, // Return rate limit info in standard response headers
    legacyHeaders: false, // Disable old rate limit headers
    message: {
      error: "Too many requests from this IP Address. Please try again in 15 minutes."
    }
  });

  // Apply rate limiting specifically to api endpoints
  app.use("/api/", apiLimiter);

  // Parse incoming JSON payloads with a strict limit to prevent buffer exhaustion attacks
  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini client if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI Assistant will run in simulated demo mode.");
  }

  // API endpoint for Gemini chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array." });
      }

      // Input Payload Security Validation: limit message count and total size to prevent memory starvation attacks
      if (messages.length > 50) {
        return res.status(400).json({ error: "Conversation history size limit exceeded." });
      }
      
      const payloadString = JSON.stringify(messages);
      if (payloadString.length > 512 * 1024) { // 512 KB payload ceiling
        return res.status(400).json({ error: "Request payload too large." });
      }

      if (!ai) {
        // Fallback demo mode if key is missing (for safety and instant load in previews)
        const lastMsg = messages[messages.length - 1]?.parts?.[0]?.text || "";
        let demoReply = "I am operating in helper demo mode because the server API key is not yet configured. ";
        if (lastMsg.toLowerCase().includes("webp")) {
          demoReply += "WebP is indeed a modern image format that provides superior lossless and lossy compression for images on the web. Using WebP, webmasters can create smaller, richer images that make the web faster.";
        } else {
          demoReply += "To enable my fully capable AI with Google Search grounding, please configure your GEMINI_API_KEY in the Secrets / Settings panel of AI Studio.";
        }
        return res.json({
          text: demoReply,
          groundingSources: [
            { title: "Google AI Studio Secrets", url: "https://ai.studio" }
          ]
        });
      }

      const systemInstruction = `You are a professional File Converter & Compressor Specialist, a digital wizard who understands media, text, document, archive, and code formats.
Your goal is to guide the user on how to compress and convert files efficiently. 
You should:
1. Explain the differences between formats (e.g. PNG vs WebP, JPEG vs WebP, ZIP vs GZIP, etc.).
2. Recommend optimal settings for quality vs file size.
3. Help users with code or format transformations (e.g. how to convert JSON to CSV or XML, formatting, minification, Base64 encoding).
4. Since you have Google Search grounding enabled, you can lookup up-to-date details about latest formats (like AVIF, JXL, WebP 2) or tools if asked.
Be concise, accurate, and speak with a highly professional yet supportive tone.`;

      // Call Gemini API with googleSearch grounding tool enabled
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      // Extract text safely
      const replyText = response.text || "I was unable to formulate a response.";
      
      // Extract search grounding metadata if available
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      res.json({
        text: replyText,
        groundingSources: groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "Search Reference",
          url: chunk.web?.uri || "#"
        })).filter((source: any) => source.title && source.url) || []
      });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({ error: error.message || "An error occurred during generating content." });
    }
  });

  // Google Search Console Verification Route
  app.get("/google92bc6b05d0ebbf60.html", (req, res) => {
    const devPath = path.join(process.cwd(), "public", "google92bc6b05d0ebbf60.html");
    const prodPath = path.join(process.cwd(), "dist", "google92bc6b05d0ebbf60.html");
    
    res.sendFile(prodPath, (err) => {
      if (err) {
        res.sendFile(devPath, (err2) => {
          if (err2) {
            res.setHeader("Content-Type", "text/html");
            res.send("google-site-verification: google92bc6b05d0ebbf60.html");
          }
        });
      }
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
