import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import { Download, AlertTriangle, CheckCircle, Activity, FileText, Bot } from "lucide-react";
import FileUpload from "./FileUpload";
import { LogDataPoint, AnalysisResult } from "../types";
import { cn } from "../utils";

export default function MainLayout() {
  const [data, setData] = useState<LogDataPoint[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDataParsed = (parsedData: LogDataPoint[], parsedColumns: string[]) => {
    setData(parsedData);
    setColumns(parsedColumns);
    // Auto-select first 3 columns if available
    setSelectedColumns(new Set(parsedColumns.slice(0, 3)));
    setAnalysis(null);
    setErrorMsg(null);
  };

  const toggleColumn = (col: string) => {
    const newSet = new Set(selectedColumns);
    if (newSet.has(col)) {
      newSet.delete(col);
    } else {
      newSet.add(col);
    }
    setSelectedColumns(newSet);
  };

  const runVibeCheck = async () => {
    if (!data) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    
    // Sample data to send (every 10th row, up to 100 rows) for faster/cheaper analysis
    const sampleData = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 100)) === 0);

    try {
      const response = await fetch("/api/analyze-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: sampleData,
          parameters: Array.from(selectedColumns)
        })
      });
      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        const err = await response.json();
        setErrorMsg(err.error || "Failed to analyze log.");
      }
    } catch (error) {
      console.error("Failed to run vibe check", error);
      setErrorMsg("Network error occurred while trying to run vibe check.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = () => {
    if (!data) return;
    
    const reportDate = new Date().toISOString().split('T')[0];
    let reportContent = `AEROTEST INSIGHT - TEST RESULT REPORT\n`;
    reportContent += `Date: ${reportDate}\n`;
    reportContent += `Total Records Analyzed: ${data.length}\n`;
    reportContent += `Parameters Tested: ${Array.from(selectedColumns).join(", ")}\n\n`;
    
    if (analysis) {
      reportContent += `--- AI VIBE-CHECK SUMMARY ---\n`;
      reportContent += `Status: ${analysis.anomaliesFound ? "ANOMALIES DETECTED" : "NORMAL"}\n`;
      reportContent += `${analysis.summary}\n\n`;
      reportContent += `Details:\n`;
      analysis.details.forEach(d => reportContent += `- ${d}\n`);
      reportContent += `\n`;
    }

    reportContent += `--- APPROVAL ---\n`;
    reportContent += `Tested by: _________________\n`;
    reportContent += `Approved by: _________________\n`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AeroTest_Report_${reportDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colors = ["#F37321", "#1A1A1A", "#4B5563", "#3B82F6", "#10B981", "#8B5CF6"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#1A1A1A] text-white shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#F37321] rounded flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Hanwha AeroTest Insight</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <span className={cn("w-2 h-2 rounded-full", isAnalyzing ? "bg-[#F37321] animate-pulse shadow-[0_0_8px_#F37321]" : "bg-green-400 shadow-[0_0_8px_#4ade80]")}></span>
            <span className="opacity-90 tracking-wide">{isAnalyzing ? "ANALYZING" : "SYSTEM LIVE"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {!data ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <FileUpload onDataParsed={handleDataParsed} />
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
              <div className="p-5 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800 tracking-wide">TEST PARAMETERS</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {columns.map((col) => (
                  <label key={col} className="flex items-center gap-3 p-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="w-4 h-4 text-[#F37321] border-gray-300 rounded focus:ring-[#F37321] focus:ring-2"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
                <button
                  onClick={runVibeCheck}
                  disabled={isAnalyzing || selectedColumns.size === 0}
                  className="w-full py-3 bg-[#F37321] hover:bg-[#d9651a] text-white font-bold text-sm tracking-wide rounded shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? "ANALYZING..." : "RUN AI VIBE-CHECK"}
                </button>
                <button
                  onClick={generateReport}
                  className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-sm tracking-wide rounded shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>EXPORT REPORT</span>
                </button>
              </div>
            </aside>

            {/* Dashboard Area */}
            <section className="flex-1 flex flex-col overflow-hidden bg-gray-50">
              
              {/* Error Banner */}
              {errorMsg && (
                <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 flex items-center gap-3 shadow-sm z-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm font-medium">{errorMsg}</p>
                </div>
              )}

              {/* Vibe-Check Banner */}
              {analysis && (
                <div className="p-5 border-b border-gray-200 bg-white shadow-sm z-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Analysis Result</span>
                  <div className={cn("p-4 rounded-lg flex items-start gap-4 border", analysis.anomaliesFound ? "bg-red-50 border-red-100 text-red-900" : "bg-green-50 border-green-100 text-green-900")}>
                    <div className="mt-0.5">
                      {analysis.anomaliesFound ? <AlertTriangle className="w-6 h-6 text-[#F37321]" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-relaxed mb-1">
                        <span className={analysis.anomaliesFound ? "text-[#F37321] font-bold" : "text-green-700 font-bold"}>
                          {analysis.anomaliesFound ? "ANOMALIES DETECTED" : "SYSTEMS NORMAL"}
                        </span>
                      </p>
                      <p className="text-sm opacity-90">{analysis.summary}</p>
                      {analysis.details.length > 0 && (
                        <ul className="text-sm opacity-80 list-disc list-inside mt-2 space-y-1">
                          {analysis.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="font-bold text-lg text-gray-900 tracking-tight">Synchronized Telemetry</h2>
                    <div className="flex gap-4">
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{data.length} records loaded</span>
                    </div>
                  </div>
                  
                  {selectedColumns.size === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-400">
                      Select parameters from the sidebar to begin visualization
                    </div>
                  ) : (
                    <div className="flex-1 relative p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#D1D5DB' }}
                            dy={10}
                          />
                          <YAxis 
                            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#D1D5DB' }}
                            dx={-10}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 600 }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}/>
                          {Array.from(selectedColumns).map((col: string, idx: number) => (
                            <Line
                              key={col}
                              type="monotone"
                              dataKey={col}
                              stroke={colors[idx % colors.length]}
                              dot={false}
                              strokeWidth={2}
                              activeDot={{ r: 5, fill: colors[idx % colors.length], stroke: '#fff', strokeWidth: 2 }}
                            />
                          ))}
                          <Brush dataKey="time" height={30} stroke="#D1D5DB" fill="#F9FAFB" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
