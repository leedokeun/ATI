import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON body
  app.use(express.json({ limit: "50mb" }));

  // API Route for AI Anomaly Detection
  app.post("/api/analyze-log", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }
      const ai = new GoogleGenAI({ apiKey });

      const { data, parameters } = req.body;
      
      // We will summarize the data a bit to not overwhelm the LLM with huge payload
      // Typically, taking a sample or describing statistical outliers is better.
      // But for this mockup, we'll send a truncated string.
      const dataStr = JSON.stringify(data).substring(0, 15000); // 15k chars limit for fast response

      const prompt = `
You are an expert defense software test log analyzer.
I am providing you a sample of telemetry data from a HILS test log.
The parameters being focused on are: ${parameters.join(", ")}.

Data sample (JSON):
${dataStr}

Identify any potential anomalies, glitches, or communication delays. 
Focus on sudden spikes, unexpected zeros, or out-of-range values in the parameters.
Provide a concise, professional assessment report suitable for a "Vibe-Check" anomaly detection comment.
Return ONLY valid JSON with the following structure:
{
  "anomaliesFound": boolean,
  "summary": "Short 1-2 sentence summary of findings",
  "details": ["Point 1", "Point 2", "Point 3"]
}
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      if (!response.text) {
         throw new Error("No text returned from Gemini");
      }

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing log:", error);
      res.status(500).json({ error: "Failed to analyze log." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
