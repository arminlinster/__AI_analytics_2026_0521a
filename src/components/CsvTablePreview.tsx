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
      <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <FileSpreadsheet className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
        <span className="text-slate-400 text-sm">尚未貼上任何 CSV 格式資料。可以使用上方的範例數據試試看！</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Sheet className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm">數據即時預覽</span>
            <span className="text-xs text-slate-500 ml-2">
              (共 {headers.length} 欄，{rows.length} 筆資料)
            </span>
          </div>
        </div>

        {/* Search tool */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋預覽數據..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 transition-all"
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-2.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12 text-center">
                #
              </th>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="py-8 px-4 text-center text-slate-400 text-xs"
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
                    className="hover:bg-slate-50/50 text-slate-700 transition-all"
                  >
                    <td className="py-2 px-4 text-xs font-mono text-slate-400 text-center border-r border-slate-50">
                      {globalIndex}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-4 text-xs whitespace-nowrap">
                        {cell || <span className="text-slate-300">N/A</span>}
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
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3 text-slate-400" />
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
              className="px-2 py-1 border border-slate-200 rounded bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-slate-600"
            >
              上一頁
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-slate-200 rounded bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-slate-600"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
