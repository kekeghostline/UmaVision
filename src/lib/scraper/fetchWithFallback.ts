import "server-only";
import { fetchJraHtml } from "./http";
import { parseShutubaHtml } from "./shutubaParser";
import { RaceInfo, RaceQuery, RaceResolutionError } from "./types";

/**
 * accessD.htmlを取得し出馬表をパースする。
 *
 * 出馬表データはaccessD.htmlの静的HTMLに直接含まれていることを実データで確認済み
 * (JS動的読み込みではない)。パース結果が0件の場合は、JRAサイトのテーブル構造が
 * 変わった可能性が高い。
 */
export async function fetchAndParseShutuba(query: RaceQuery, raceUrl: string): Promise<RaceInfo> {
  const html = await fetchJraHtml(raceUrl);
  const raceInfo = parseShutubaHtml(query, html);

  if (raceInfo.entries.length === 0) {
    throw new RaceResolutionError(
      query,
      "出馬表データを抽出できませんでした。JRAサイトのページ構造が変更された可能性があります。",
    );
  }

  return raceInfo;
}
