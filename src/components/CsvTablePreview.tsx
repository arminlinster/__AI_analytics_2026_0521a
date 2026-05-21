import { useState, useMemo } from "react";
import { parseCsv } from "../utils/csvParser";
import { Search, Sheet, Info, FileSpreadsheet } from "lucide-react";

interface CsvTablePreviewProps {
  csvText: string;
}

export default function CsvTablePreview({ csvText }: CsvTablePreviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  const { headers, rows } = useMemo(() => {
    return parseCsv(csvText);
  }, [csvText]);

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(lower))
    );
  }, [rows, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  if (headers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
        <FileSpreadsheet className="h-10 w-10 text-slate-300 dark:text-slate-600 stroke-[1.5] mb-2" />
        <span className="text-slate-400 dark:text-slate-500 text-sm text-center">尚未貼上任何 CSV 格式資料。可以使用上方的範例數據試試看！</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-lg">
            <Sheet className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">數據即時預覽</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              (共 {headers.length} 欄，{rows.length} 筆資料)
            </span>
          </div>
        </div>

        {/* Search tool */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="搜尋預覽數據..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-550 focus:ring-1 focus:ring-indigo-550 text-slate-700 dark:text-slate-300 transition-all"
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12 text-center">
                #
              </th>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="py-8 px-4 text-center text-slate-400 dark:text-slate-500 text-xs"
                >
                  無符合篩選條件的資料。
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + rowIndex + 1;
                return (
                  <tr
                    key={rowIndex}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <td className="py-2 px-4 text-xs font-mono text-slate-400 dark:text-slate-500 text-center border-r border-slate-50 dark:border-slate-800/80">
                      {globalIndex}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-4 text-xs whitespace-nowrap">
                        {cell || <span className="text-slate-300 dark:text-slate-700">N/A</span>}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3 text-slate-400 dark:text-slate-500" />
          <span>
            {filteredRows.length !== rows.length
              ? `篩選出 ${filteredRows.length} 筆 / `
              : ""}
            顯示第 {Math.min((currentPage - 1) * rowsPerPage + 1, filteredRows.length)} 至{" "}
            {Math.min(currentPage * rowsPerPage, filteredRows.length)} 筆
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400"
            >
              上一頁
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
