export type AnalysisPreset = "general" | "trends" | "marketing" | "anomalies";

export interface DemoDataset {
  id: string;
  title: string;
  description: string;
  csvData: string;
}

export interface AnalysisHistory {
  id: string;
  time: string;
  title: string;
  csvData: string;
  preset: AnalysisPreset;
  customFocus: string;
  result: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}
