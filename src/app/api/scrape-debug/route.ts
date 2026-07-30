import { z } from "zod";
import { fetchShutubaTable } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 30;

const ScrapeDebugRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trackName: z.string().min(1),
  raceNo: z.number().int().min(1).max(12),
});

/**
 * 開発時のみ有効なデバッグ用エンドポイント。
 * Claude呼び出しを行わず、スクレイピング結果のJSONだけを返す。
 * 出馬表の生データを含むため、本番環境では無効化する。
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = ScrapeDebugRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "入力内容が不正です。", details: parsed.error.issues }, { status: 400 });
  }

  const race = await fetchShutubaTable(parsed.data);
  return Response.json(race);
}
