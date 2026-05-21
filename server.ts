import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

const SYSTEM_INSTRUCTION = `你是一位專業的「AI 數據分析師」與「商業智慧專家」。
你的任務是協助分析使用者提供的 CSV 格式數據表，提供深入、有商業價值且可落地的洞察。

請遵循以下分析與輸出格式準則：
1. 請完全使用「繁體中文（台灣繁體，例如：數據、行銷、資訊、專案、營收）」回答。保持口吻專業、客觀、邏輯清晰、切中要點。
2. 採用清晰、生動且高對比度的 Markdown 排版，章節必須包含：
   - 📋 數據集總覽 (Data Overview)：摘要該數據集的主要欄位、時間週期或類別、資料筆數，並說明該資料集的核心焦點與分析維度。
   - 📈 核心統計指標 (Core Statistical Indicators)：對關鍵的數值型欄位進行運算、彙加或比例描述（計算如平均值、最大/最小值、增長幅度等），建立具體的指標。
   - 🔍 關鍵發現與深度洞察 (Key Findings & Insights)：探勘數據間的關聯性，挖掘隱藏的規律（例如：高價值貢獻者、銷售淡旺季、轉換瓶頸等、影響營收最顯著的因子）。
   - ⚠️ 異常偵測與潛在風險 (Anomalies & Risks)：找出極端值、劇烈波動、數據異常缺漏或潛在的衰退警訊，探討原因。
   - 💡 具體行動與優化建議 (Actionable Recommendations)：針對數據中的發現，提出 3-4 個「可被具體執行」、高可行性且具商業效益的優化和改善策略。
3. 排版時，請適當使用 Markdown 表格、粗體、縮排列表及生動的 Emoji 圖示，使分析報告結構分明、利於宣讀與報告展示。
4. 提醒：請只基於使用者給予的 CSV 數據進行合理分析，分析請保持嚴謹，絕不憑空捏造未包含的關鍵數值。`;

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
