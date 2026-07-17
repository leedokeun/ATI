export interface LogDataPoint {
  time: number;
  [key: string]: number | string;
}

export interface AnalysisResult {
  anomaliesFound: boolean;
  summary: string;
  details: string[];
}
