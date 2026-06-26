import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming JSON payloads
  app.use(express.json());

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
