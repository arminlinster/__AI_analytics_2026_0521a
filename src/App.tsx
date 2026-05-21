import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Sparkles, 
  Play, 
  Copy, 
  Download, 
  Trash2, 
  Search, 
  History, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  PenTool, 
  HelpCircle,
  FileCheck2,
  FileDown
} from "lucide-react";
import Markdown from "react-markdown";

import { DEMO_DATASETS } from "./constants";
import { AnalysisPreset, AnalysisHistory } from "./types";
import { parseCsv } from "./utils/csvParser";
import CsvTablePreview from "./components/CsvTablePreview";
import HistoryList from "./components/HistoryList";

export default function App() {
  const [csvText, setCsvText] = useState("");
  const [preset, setPreset] = useState<AnalysisPreset>("general");
  const [customFocusText, setCustomFocusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [histories, setHistories] = useState<AnalysisHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>(undefined);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_analysis_histories");
      if (saved) {
        setHistories(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistories = (newHistories: AnalysisHistory[]) => {
    setHistories(newHistories);
    try {
      localStorage.setItem("ai_analysis_histories", JSON.stringify(newHistories));
    } catch (e) {
      console.error("Failed to save search history:", e);
    }
  };

  // Automated step message transition during analysis
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    "正在分析 CSV 資料欄位結構與屬性...",
    "正在運算資料集之交叉統計指標與彙總規律...",
    "正在比對極端觀測值、探勘異常離群點...",
    "正在統整深度商業價值報告與具體策略建議..."
  ];

  // Pick a sample dataset
  const handleSelectDemo = (demoId: string) => {
    const dataset = DEMO_DATASETS.find((d) => d.id === demoId);
    if (dataset) {
      setCsvText(dataset.csvData);
      setError("");
    }
  };

  // Perform AI analysis request
  const handleRunAnalysis = async () => {
    if (!csvText || !csvText.trim()) {
      setError("請先貼上 CSV 格式的報表數據，或從上方選擇一個示範資料集。");
      return;
    }

    const { headers, rows } = parseCsv(csvText);
    if (headers.length === 0 || rows.length === 0) {
      setError("無法正確解析此 CSV 內容。請確認第一列為欄位名稱，且不同項目間以英文逗號 (,) 隔開。");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setSelectedHistoryId(undefined);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData: csvText.trim(),
          preset,
          customFocus: customFocusText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "伺服器處理失敗");
      }

      setResult(data.result);

      // Create new history log
      const title = `數據報告：${headers[0] || "未命名"} 及相關 ${headers.length - 1} 個欄位`;
      const newHistoryItem: AnalysisHistory = {
        id: `hist_${Date.now()}`,
        time: new Date().toLocaleString("zh-TW", { hour12: false }),
        title,
        csvData: csvText,
        preset,
        customFocus: customFocusText,
        result: data.result,
      };

      const updated = [newHistoryItem, ...histories];
      saveHistories(updated);
      setSelectedHistoryId(newHistoryItem.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "伺服器通訊錯誤，請確認網路連線或 API 金鑰配置。");
    } finally {
      setLoading(false);
    }
  };

  // Copy result to clipboard
  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  // Download raw markdown report
  const handleDownloadReport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AI_數據洞察報告_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load a historical analysis record
  const handleSelectHistory = (item: AnalysisHistory) => {
    setCsvText(item.csvData);
    setPreset(item.preset);
    setCustomFocusText(item.customFocus || "");
    setResult(item.result);
    setError("");
    setSelectedHistoryId(item.id);
  };

  // Delete a specific history item
  const handleDeleteHistory = (id: string) => {
    const updated = histories.filter((h) => h.id !== id);
    saveHistories(updated);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(undefined);
      setResult("");
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("確定要清除所有歷史分析報告記錄嗎？此動作無法復原。")) {
      saveHistories([]);
      setSelectedHistoryId(undefined);
      setResult("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900 justify-between">
      
      {/* Sleek Header Section */}
      <header className="h-16 flex items-center justify-between px-6 sm:px-8 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-150 shadow-md">
            <Sparkles className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight flex items-center gap-2">
              AI 數據分析與洞察工具
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
              貼上 CSV 表格，釋放先進語言模型 Gemini 的智慧決策洞察。
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-550 bg-slate-100 px-2.5 py-1 rounded-md hidden md:inline-block">
            模型：Gemini 3.5 Flash
          </span>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ring-1 ring-emerald-200 flex items-center gap-1.5 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            系統就緒
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Left Panel - Input / Presets */}
        <div className="flex-1 flex flex-col gap-6 lg:max-w-[55%]">
          
          {/* Step 1: Demo Datasets Options Container */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                1. 預載範例數據快速測試
              </h2>
              <span className="text-xxs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">DEMOS</span>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEMO_DATASETS.map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => handleSelectDemo(dataset.id)}
                  className="text-left border border-slate-150 rounded-xl p-3 hover:border-indigo-500 hover:bg-indigo-50/20 active:bg-indigo-50/40 transition-all cursor-pointer group"
                >
                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 block mb-1">
                    {dataset.title}
                  </span>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal">
                    {dataset.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Main CSV Input Code Text Area */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                2. 貼上您的 CSV 數據
              </h2>
              {csvText && (
                <button
                  onClick={() => setCsvText("")}
                  className="text-slate-400 hover:text-rose-500 text-xs transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 清空數據
                </button>
              )}
            </div>
            
            <div className="p-4 bg-slate-50/20 flex flex-col gap-2">
              <p className="text-xs text-slate-400 leading-normal">
                請確保第一列為英文 or 中文欄位標題，隨後各行以逗號隔開。亦可直接由 Excel 或試算表複製後直接貼上：
              </p>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="在此貼上您的 CSV 資料表。例如：&#10;日期,通路類別,總曝光,實際點擊,轉換業績&#10;2026-05-18,社群投放,420000,12800,245000&#10;2026-05-19,關鍵字廣告,610000,28900,482000"
                rows={7}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl resize-none text-xs font-mono focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-600 outline-none shadow-xs text-slate-700 leading-relaxed transition-all"
              />
            </div>
          </section>

          {/* Interactive Live Preview Spreadsheet component with pagination */}
          <div className="flex flex-col gap-2">
            <CsvTablePreview csvText={csvText} />
          </div>

          {/* Step 3: Preset configuration setup */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                3. 設定 AI 分析維度
              </h2>
              <span className="text-xxs font-mono text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded">CONFIG</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Analysis Presets Cards styling list */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: "general", label: "綜合分析", icon: "💎", desc: "綜合商業透視" },
                  { id: "trends", label: "趨勢發掘", icon: "📈", desc: "週期趨勢規律" },
                  { id: "marketing", label: "行銷轉換", icon: "🎯", desc: "效益流失盲點" },
                  { id: "anomalies", label: "異常檢測", icon: "⚠️", desc: "起伏極端波動" },
                ].map((p) => {
                  const isSelected = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id as AnalysisPreset)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-200"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className="text-lg leading-none">{p.icon}</span>
                      <span className="font-bold text-xs block">{p.label}</span>
                      <span className="text-[10px] text-slate-400 block">{p.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Advanced User Focus Input line */}
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/30">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold mb-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>我要指定特定分析目標 / 指標優先度 (選填)：</span>
                </div>
                <input
                  type="text"
                  placeholder="例：請優先幫我找出 ROI 最高與最低的管道，並點出 Q3 以來的轉折原因..."
                  value={customFocusText}
                  onChange={(e) => setCustomFocusText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-600 font-sans text-slate-700"
                />
              </div>
            </div>
          </section>

          {/* Trigger Request Actions */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5 text-rose-800 text-xs shadow-xs animate-shake">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">分析未成功發送：</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition-all transform flex items-center justify-center gap-2 group cursor-pointer ${
              loading
                ? "bg-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200/50 shadow-md shadow-indigo-150/40 active:scale-[0.99]"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-white/90" />
                <span>AI 正在探勘數據隱藏特徵，請稍候...</span>
              </>
            ) : (
              <>
                <Play className="h-4.5 w-4.5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
                <span>開始 AI 分析</span>
              </>
            )}
          </button>

          {/* Staggered progress status container */}
          {loading && (
            <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/20 text-center animate-pulse">
              <p className="text-xs font-semibold text-indigo-700 mb-1">
                {loadingMessages[loadingStep]}
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[280px] mx-auto mt-2">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(loadingStep + 1) * 25}%` }}
                ></div>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel - Outputs & History logs */}
        <div className="flex-1 flex flex-col gap-6 lg:max-w-[45%]">
          
          {/* Analysis Results Display Output Block */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[420px] h-full flex-1">
            
            {/* Action Bar Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                <h2 className="font-semibold text-slate-800 text-sm">智能分析報告</h2>
              </div>

              {result && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="一鍵複製結果"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">已複製</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>複製</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="下載 Markdown 報告檔"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>下載</span>
                  </button>
                </div>
              )}
            </div>

            {/* Structured Report Analysis Results container */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/20 prose prose-indigo max-w-none">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileCheck2 className="h-12 w-12 text-slate-300 stroke-[1.25] mb-3" />
                  <span className="font-semibold text-slate-400 block text-sm">等待數據輸入並開始分析</span>
                  <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-normal">
                    精準解讀商業變數。請在左側填入 CSV，並按下主按鈕，我們將透過多維度統計探勘，提供即時洞察報告。
                  </p>
                </div>
              )}

              {loading && !result && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                  <span className="font-bold text-slate-600 block text-sm">正在深度解析交叉數據指標...</span>
                  <p className="text-slate-400 text-xs mt-1 max-w-[280px] leading-normal">
                    Gemini 模型正在剖析關聯權重、極端觀測，並生成繁體中文優化建议報告。
                  </p>
                </div>
              )}

              {result && (
                <div className="markdown-body select-text space-y-4">
                  <Markdown>{result}</Markdown>
                </div>
              )}
            </div>

            {/* Micro warning hints */}
            <div className="px-4 py-2.5 bg-indigo-50/20 border-t border-slate-100 text-[10px] text-indigo-700 leading-normal">
              💡 提報提示：此報告完全忠於您貼上的 CSV 觀測事實。點擊複製按鈕可匯出格式至 PPT/Word。
            </div>
          </section>

          {/* Session History widget selection list */}
          <HistoryList
            histories={histories}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
            activeId={selectedHistoryId}
          />

        </div>

      </main>

      {/* Sleek Design Theme Dark Footer */}
      <footer className="h-10 bg-slate-900 flex items-center justify-between px-6 sm:px-8 text-[10px] text-slate-400 uppercase tracking-widest mt-6">
        <div className="flex gap-6">
          <span>Session: ACTIVE</span>
          <span className="hidden sm:inline">Encryption: SSL</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1 bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CONNECTED
          </span>
          <span>© 2026 AI ANALYTICS ENGINE</span>
        </div>
      </footer>

    </div>
  );
}
