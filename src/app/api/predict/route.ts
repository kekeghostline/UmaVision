import { z } from "zod";
import { fetchShutubaTable, RaceNotPublishedError, RaceResolutionError } from "@/lib/scraper";
import { generatePrediction, PredictionRefusedError, PredictionParseError } from "@/lib/claude/predict";
import { BettingStyleSchema } from "@/lib/claude/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const PredictRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で指定してください"),
  trackName: z.string().min(1),
  raceNo: z.number().int().min(1).max(12),
  budgetYen: z.number().int().positive(),
  style: BettingStyleSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストボディがJSONとして解釈できません。" }, { status: 400 });
  }

  const parsed = PredictRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "入力内容が不正です。", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { date, trackName, raceNo, budgetYen, style } = parsed.data;

  try {
    const race = await fetchShutubaTable({ date, trackName, raceNo });
    const prediction = await generatePrediction(race, budgetYen, style);

    return Response.json({
      raceMeta: {
        date: race.date,
        trackName: race.trackName,
        raceNo: race.raceNo,
        raceName: race.raceName,
      },
      prediction,
    });
  } catch (error) {
    if (error instanceof RaceNotPublishedError) {
      return Response.json({ error: error.message, code: "RACE_NOT_PUBLISHED" }, { status: 404 });
    }
    if (error instanceof RaceResolutionError) {
      return Response.json({ error: error.message, code: "RACE_RESOLUTION_FAILED" }, { status: 404 });
    }
    if (error instanceof PredictionRefusedError) {
      return Response.json({ error: error.message, code: "PREDICTION_REFUSED" }, { status: 502 });
    }
    if (error instanceof PredictionParseError) {
      return Response.json({ error: error.message, code: "PREDICTION_PARSE_FAILED" }, { status: 502 });
    }

    console.error("Unexpected error in /api/predict:", error);
    return Response.json(
      { error: "予期しないエラーが発生しました。しばらくしてから再度お試しください。" },
      { status: 500 },
    );
  }
}
