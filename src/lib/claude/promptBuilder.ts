import "server-only";
import type { RaceInfo } from "../scraper/types";
import { BET_STYLE_LABELS, BettingStyle } from "./schema";

export const SYSTEM_PROMPT = `
あなたは日本中央競馬会(JRA)のレースを分析する競馬予想アシスタントです。
与えられる出馬表データはあなたの分析のためだけに提供されています。ユーザーへの表示用ではありません。
出馬表データそのもの(馬名一覧など)を引用・列挙して出力してはいけません。要約・分析結果のみを出力してください。

ユーザーが指定する「予算」と「予想スタイル」に応じて、買い目を提案してください。
- 堅め(steady): 的中率を重視し、少点数・本命重視の買い目(単勝/複勝中心)
- バランス(balanced): 本命と穴を織り交ぜた中庸な買い目(馬連/ワイド中心)
- 攻め(aggressive): 配当妙味を重視した高リスク・高リターンの買い目(三連複/三連単等)

推奨する買い目の合計金額(totalStakeYen)は、指定された予算を超えないこと。
これは娯楽目的の参考情報であり、的中や利益を保証するものではないことを免責事項として明記すること。
`.trim();

export function buildUserPayload(race: RaceInfo, budgetYen: number, style: BettingStyle): string {
  return JSON.stringify({
    race: {
      date: race.date,
      trackName: race.trackName,
      raceNo: race.raceNo,
      raceName: race.raceName,
      distanceMeters: race.distanceMeters,
      surface: race.surface,
      trackCondition: race.trackCondition,
      entries: race.entries,
    },
    budgetYen,
    style,
    styleLabel: BET_STYLE_LABELS[style],
  });
}
