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
        "flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-white shadow-sm",
        isDragging ? "border-[#F37321] bg-[#F37321]/5" : "border-gray-300 hover:border-[#F37321] hover:bg-gray-50"
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
      <div className="flex flex-col items-center gap-3">
        <UploadCloud className="w-12 h-12 text-[#F37321] mb-2" />
        <h3 className="text-xl font-bold text-gray-900">Upload Test Log</h3>
        <p className="text-sm text-gray-500 font-medium">Drag and drop your .csv or .log file here, or click to browse</p>
      </div>
    </div>
  );
}
