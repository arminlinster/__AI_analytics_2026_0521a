import { AnalysisHistory } from "../types";
import { History, Calendar, Trash2, ChevronRight, FileText } from "lucide-react";

interface HistoryListProps {
  histories: AnalysisHistory[];
  onSelect: (item: AnalysisHistory) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  activeId?: string;
}

export default function HistoryList({
  histories,
  onSelect,
  onDelete,
  onClearAll,
  activeId,
}: HistoryListProps) {
  if (histories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-sm">
        <History className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5] mb-2" />
        <h4 className="text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">尚未有分析記錄</h4>
        <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
          當您貼上資料並完成 AI 分析後，過去的專業報告將會安全地保存在此處。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
      {/* Title Header */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">歷史分析報告</h3>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xxs font-semibold px-2 py-0.5 rounded-full">
            {histories.length}
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-350 hover:underline transition-all font-medium cursor-pointer"
        >
          全部清除
        </button>
      </div>

      {/* List Container */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
        {histories.map((item) => {
          const isActive = activeId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-start gap-3 relative ${
                isActive ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-l-indigo-600 pl-2.5" : "border-l-4 border-l-transparent"
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 ${isActive ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-800 dark:text-slate-200 block text-xs truncate">
                  {item.title}
                </span>
                
                {/* Meta details */}
                <div className="flex items-center gap-3 mt-1.5 text-xxs text-slate-400 dark:text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.time}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-sans uppercase">
                    {item.preset === "general" && "綜合分析"}
                    {item.preset === "trends" && "趨勢發掘"}
                    {item.preset === "marketing" && "行銷轉換"}
                    {item.preset === "anomalies" && "異常檢測"}
                  </span>
                </div>
              </div>

              {/* Operations */}
              <div className="flex items-center gap-1 self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-all cursor-pointer"
                  title="刪除此記錄"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
