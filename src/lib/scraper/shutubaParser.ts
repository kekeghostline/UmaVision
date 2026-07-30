import "server-only";
import * as cheerio from "cheerio";
import { RaceInfo, RaceQuery, ShutubaEntry, RaceNotPublishedError } from "./types";

const UNPUBLISHED_MARKERS = [
  "掲載を終了しています",
  "掲載していません",
  "出馬表の発表は",
];

function isUnpublished(pageText: string): boolean {
  return UNPUBLISHED_MARKERS.some((marker) => pageText.includes(marker));
}

/**
 * accessD.html の出馬表HTMLをパースする。
 *
 * JRAサイトの出馬表テーブルの正確なDOM構造は、開催直前〜当日の実際のページでしか
 * 確認できないため、ここでは一般的な構造(馬番を含む行のテーブル)を仮定した
 * 暫定実装にしている。開催中のレースで動作確認し、必要に応じてセレクタを調整すること
 * (実装計画の検証手順を参照)。
 *
 * 実データが0件かつ「掲載終了」等のメッセージも検出できない場合は、
 * JSによる動的読み込みの可能性を示すため呼び出し側でPlaywrightフォールバックを検討する。
 */
export function parseShutubaHtml(query: RaceQuery, html: string): RaceInfo {
  const $ = cheerio.load(html);
  const bodyText = $("body").text();

  if (isUnpublished(bodyText)) {
    throw new RaceNotPublishedError(query);
  }

  const entries: ShutubaEntry[] = [];

  $("table").each((_, table) => {
    $(table)
      .find("tr")
      .each((__, row) => {
        const cells = $(row)
          .find("td, th")
          .map((___, cell) => $(cell).text().trim())
          .get();

        if (cells.length < 4) return;

        const umaban = Number(cells[0]);
        if (!Number.isInteger(umaban) || umaban <= 0 || umaban > 18) return;

        entries.push({
          umaban,
          horseName: cells[1] ?? "",
          sexAge: cells[2] ?? "",
          weightCarried: Number(cells[3]) || 0,
          jockeyName: cells[4] ?? "",
          trainerName: cells[5] ?? "",
          odds: cells[6] ? Number(cells[6]) || undefined : undefined,
        });
      });
  });

  const raceNameMatch = bodyText.match(/([\wぁ-んァ-ヶ一-龠]+(?:ステークス|カップ|記念|賞|杯))/);

  return {
    date: query.date,
    trackName: query.trackName,
    raceNo: query.raceNo,
    raceName: raceNameMatch?.[1] ?? `${query.trackName}${query.raceNo}R`,
    entries,
  };
}
