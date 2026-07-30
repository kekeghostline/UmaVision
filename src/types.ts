import type { PredictionResult, BettingStyle } from "@/lib/claude/schema";

export interface RaceMeta {
  date: string;
  trackName: string;
  raceNo: number;
  raceName: string;
}

export interface PredictResponse {
  raceMeta: RaceMeta;
  prediction: PredictionResult;
}

export interface PredictErrorResponse {
  error: string;
  code?: string;
}

export interface PredictFormValues {
  date: string;
  trackName: string;
  raceNo: number;
  budgetYen: number;
  style: BettingStyle;
}
