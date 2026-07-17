import React, { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { LogDataPoint } from "../types";
import { cn } from "../utils";

interface FileUploadProps {
  onDataParsed: (data: LogDataPoint[], columns: string[]) => void;
}

export default function FileUpload({ onDataParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as any[];
          if (rawData.length === 0) return;

          // Normalize data, assume first column is 'time' or we add an index if not found
          const firstRow = rawData[0];
          const allCols = Object.keys(firstRow);
          
          let timeCol = allCols.find(c => c.toLowerCase() === 'time' || c.toLowerCase() === 'timestamp' || c.toLowerCase() === 't');
          
          const parsedData: LogDataPoint[] = rawData.map((row, index) => {
            const point: LogDataPoint = { time: timeCol ? row[timeCol] : index };
            allCols.forEach(col => {
              if (col !== timeCol) {
                point[col] = row[col];
              }
            });
            return point;
          });

          const dataCols = allCols.filter(c => c !== timeCol);
          onDataParsed(parsedData, dataCols);
        },
      });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 border-2 border-dashed transition-colors cursor-pointer",
        isDragging ? "border-[#F27D26] bg-[#F27D26]/10" : "border-[#141414]/40 hover:bg-[#141414]/5"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept=".csv,.log"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex flex-col items-center gap-2">
        <UploadCloud className="w-8 h-8 mb-2" />
        <span>DRAG LOG TO IMPORT</span>
        <span className="font-mono opacity-60">or click to browse (.csv, .log)</span>
      </div>
    </div>
  );
}
