import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

const SYSTEM_INSTRUCTION = `你是一位專業的資料分析師。
你的任務是接收一段 CSV 或表格結構的原始數據，理解其欄位意義，並提出精確的摘要報告與洞察。

請務必嚴格遵循以下 Markdown 輸出格式：

### 1. 📊 資料概況與欄位理解
簡要說明這份資料的主題是什麼，並列出關鍵欄位的意義。

### 2. ⚠️ 異常與缺值檢查
檢查資料中是否有空白（例如缺少數量或金額）、極端值（例如不合理的高價），並將發現的異常項目條列出來。若無異常，說明「未發現明顯異常」。

### 3. 📈 統計與趨勢洞察
請回答以下問題的總結：
- **總計概況**：銷售數量或總金額的大概加總。
- **分類表現**：哪個業務員或哪項產品表現最好？
- **業務建議**：從數據中給出 1-2 個可以執行的商業建議。

請以 Markdown 格式輸出，所有繁體中文部分必須使用繁體中文回覆，不要包含任何額外的問候語或結語。`;

async function startServer() {
  const app = express();

  // Allow body up to 15MB for large CSV tables
  app.use(express.json({ limit: "15mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Route to handle Gemini analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { csvData, preset, customFocus } = req.body;

      if (!csvData || typeof csvData !== "string" || !csvData.trim()) {
        return res.status(400).json({ error: "請貼上有效的 CSV 格式數據資料。" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "伺服器未檢測到有效金鑰 (GEMINI_API_KEY)。請於 Google AI Studio 控制台的 [Settings > Secrets] 面板中完成設定與儲存。" 
        });
      }

      // Initialize standard GoogleGenAI SDK with recommended header
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Preset guidance injection
      let presetInstruction = "";
      if (preset === "general") {
        presetInstruction = "請進行全方面的「綜合透視與交叉分析」，涵蓋主要層面的特徵與整體分佈規律。";
      } else if (preset === "trends") {
        presetInstruction = "深度聚焦在「趨勢發掘、週期規律與時間序列發展」，找出隨著時間發生的週期性規律、顯著躍升/衰退點，並分析成因。";
      } else if (preset === "marketing") {
        presetInstruction = "深度聚焦在「行銷轉化、獲客漏斗與產品/服務效益」，著重分析各活動/渠道/類別的價值比重、投資轉化率與目標瓶頸。";
      } else if (preset === "anomalies") {
        presetInstruction = "深度聚焦在「異常檢測、落差/離群值與風險控制」，著重捕捉統計離群、極端觀測、陡峭變化、數據缺漏，並探討背後可能的問題瓶頸。";
      }

      let focusPrompt = "";
      if (customFocus && typeof customFocus === "string" && customFocus.trim()) {
        focusPrompt = `\n【使用者特別指定的補充分析重點】\n${customFocus.trim()}`;
      }

      const userPrompt = `
以下是需要您代為分析的數據資料表 (CSV 格式)：
\`\`\`csv
${csvData}
\`\`\`

【分析模式設定】
${presetInstruction}
${focusPrompt}

請開始對此 CSV 資料進行深度解讀、交叉計算分析，並撰寫繁體中文的優化洞察報告：
`;

      // Perform generation content with Gemini 3.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.25, // relatively low temperature for highly stable and deterministic analytics
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("AI 模型未回傳任何有效的分析文本內容。");
      }

      res.json({ result: text });
    } catch (error: any) {
      console.error("Gemini Analytical Engine Error:", error);
      res.status(500).json({ 
        error: error.message || "通訊時發生未知錯誤，請重試或確認專案的金鑰設定。" 
      });
    }
  });

  // Configure client routing based on environment
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
    console.log(`AI Analysis server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server Startup Failure:", err);
});
