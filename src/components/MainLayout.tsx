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

  const handleDataParsed = (parsedData: LogDataPoint[], parsedColumns: string[]) => {
    setData(parsedData);
    setColumns(parsedColumns);
    // Auto-select first 3 columns if available
    setSelectedColumns(new Set(parsedColumns.slice(0, 3)));
    setAnalysis(null);
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
      }
    } catch (error) {
      console.error("Failed to run vibe check", error);
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

  const colors = ["#2563eb", "#dc2626", "#F27D26", "#16a34a", "#9333ea", "#0891b2"];

  return (
    <div className="flex flex-col min-h-screen bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden border-[8px] border-[#141414]">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 bg-[#141414] text-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#F27D26] rotate-45"></div>
            <span className="font-mono font-bold tracking-tighter text-lg uppercase">ATI // AeroTest Insight</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <span className="text-[10px] font-mono text-white/60 tracking-widest">SYSTEM READY // MISSION_HILS_102</span>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
            <span>STATUS: {isAnalyzing ? "ANALYZING" : "LIVE"}</span>
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
            <aside className="w-64 border-r border-[#141414] flex flex-col shrink-0 bg-[#D8D7D2]">
              <div className="p-3 border-b border-[#141414] bg-[#141414]/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Parameters</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {columns.map((col) => (
                  <label key={col} className="flex items-center gap-2 p-2 text-xs font-mono hover:bg-white/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="accent-[#141414]"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
              </div>
              <div className="p-3 border-t border-[#141414] bg-[#141414] text-white flex flex-col gap-2">
                <button
                  onClick={runVibeCheck}
                  disabled={isAnalyzing || selectedColumns.size === 0}
                  className="w-full py-2 bg-[#F27D26] text-black font-bold text-[11px] uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? "ANALYZING..." : "+ RUN VIBE-CHECK"}
                </button>
                <button
                  onClick={generateReport}
                  className="w-full py-2 bg-[#141414] border border-[#141414] hover:bg-[#222] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Auto-Reporter</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                  </svg>
                </button>
              </div>
            </aside>

            {/* Dashboard Area */}
            <section className="flex-1 flex flex-col overflow-hidden">
              
              {/* Vibe-Check Banner */}
              {analysis && (
                <div className="p-4 border-b border-[#141414] bg-[#EBEAE6]">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-3">Vibe-Check Analysis</span>
                  <div className="bg-[#141414] text-white p-3 rounded-sm flex items-start gap-3">
                    <div className="mt-0.5">
                      {analysis.anomaliesFound ? <AlertTriangle className="w-4 h-4 text-[#F27D26]" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-mono leading-relaxed mb-2">
                        <span className={analysis.anomaliesFound ? "text-[#F27D26]" : "text-green-500"}>
                          {analysis.anomaliesFound ? "@ANOMALIES_DETECTED" : "@SYSTEMS_NORMAL"}
                        </span>
                        <br/>
                        {analysis.summary}
                      </p>
                      {analysis.details.length > 0 && (
                        <ul className="text-[10px] font-mono opacity-80 list-disc list-inside mt-1">
                          {analysis.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#E4E3E0]">
                <div className="flex justify-between items-end p-4 border-b border-[#141414]">
                  <h2 className="font-serif italic text-lg">Synchronized Telemetry</h2>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="opacity-60">{data.length} RECORDS LOADED</span>
                  </div>
                </div>
                
                {selectedColumns.size === 0 ? (
                  <div className="flex-1 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-40">
                    Select parameters from the sidebar to begin
                  </div>
                ) : (
                  <div className="flex-1 relative border-[#141414]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#141414" strokeOpacity={0.1} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fill: '#141414', fontSize: 10, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#141414' }}
                          axisLine={{ stroke: '#141414' }}
                        />
                        <YAxis 
                          tick={{ fill: '#141414', fontSize: 10, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#141414' }}
                          axisLine={{ stroke: '#141414' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid #F27D26', borderRadius: '0', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#E4E3E0' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }}/>
                        {Array.from(selectedColumns).map((col: string, idx: number) => (
                          <Line
                            key={col}
                            type="monotone"
                            dataKey={col}
                            stroke={colors[idx % colors.length]}
                            dot={false}
                            strokeWidth={1.5}
                            activeDot={{ r: 4, fill: '#141414', stroke: colors[idx % colors.length] }}
                          />
                        ))}
                        <Brush dataKey="time" height={20} stroke="#141414" fill="#EBEAE6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
