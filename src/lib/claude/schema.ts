import { z } from "zod";

export const BettingStyleSchema = z.enum(["steady", "balanced", "aggressive"]);
export type BettingStyle = z.infer<typeof BettingStyleSchema>;

export const BET_STYLE_LABELS: Record<BettingStyle, string> = {
  steady: "堅め",
  balanced: "バランス",
  aggressive: "攻め",
};

export const BetRecommendationSchema = z.object({
  betType: z.string().describe("単勝/複勝/馬連/ワイド/三連複/三連単 等の馬券種別"),
  horses: z.array(z.number()).describe("馬番の組み合わせ"),
  stakeYen: z
    .number()
    .int()
    .multipleOf(100)
    .min(100)
    .describe(
      "この買い目に投じる金額(円)。JRAの馬券は100円単位でのみ購入可能なため、必ず100の倍数(100, 200, 300...)にすること",
    ),
  confidence: z.enum(["high", "medium", "low"]),
  rationale: z.string().describe("この買い目を推奨する理由"),
});

export const PredictionResultSchema = z.object({
  summary: z.string().describe("レース全体の総評"),
  recommendations: z.array(BetRecommendationSchema),
  totalStakeYen: z
    .number()
    .int()
    .multipleOf(100)
    .describe("推奨買い目の合計金額(円)。100円単位の合計値になり、予算を超えないこと"),
  disclaimer: z.string().describe("予想は参考情報であり的中を保証しない旨の免責事項"),
});

export type PredictionResult = z.infer<typeof PredictionResultSchema>;
