import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropicClient } from "./client";
import { SYSTEM_PROMPT, buildUserPayload } from "./promptBuilder";
import { PredictionResultSchema, PredictionResult, BettingStyle } from "./schema";
import type { RaceInfo } from "../scraper/types";

export class PredictionRefusedError extends Error {
  constructor(public readonly category?: string | null) {
    super(`AIモデルが予想の生成を拒否しました${category ? ` (category: ${category})` : ""}。`);
    this.name = "PredictionRefusedError";
  }
}

export class PredictionParseError extends Error {
  constructor() {
    super("AIの予想結果を期待した形式で取得できませんでした。もう一度お試しください。");
    this.name = "PredictionParseError";
  }
}

export async function generatePrediction(
  race: RaceInfo,
  budgetYen: number,
  style: BettingStyle,
): Promise<PredictionResult> {
  const response = await anthropicClient.messages.parse({
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: {
      format: zodOutputFormat(PredictionResultSchema),
    },
    messages: [{ role: "user", content: buildUserPayload(race, budgetYen, style) }],
  });

  if (response.stop_reason === "refusal") {
    throw new PredictionRefusedError(response.stop_details?.category);
  }

  if (!response.parsed_output) {
    throw new PredictionParseError();
  }

  return response.parsed_output;
}
