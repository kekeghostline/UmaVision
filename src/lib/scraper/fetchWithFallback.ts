import "server-only";
import { fetchJraHtml } from "./http";
import { parseShutubaHtml } from "./shutubaParser";
import { RaceInfo, RaceQuery, RaceResolutionError } from "./types";

/**
 * accessD.htmlを取得し出馬表をパースする。
 *
 * 現時点ではCheerio(静的HTMLパース)のみを実装している。
 * パース結果が0件で、かつ「掲載終了」等のメッセージも検出されない場合は
 * JSによる動的読み込みの可能性が高いと判断し、その旨を示すエラーを投げる。
 * その場合は Playwright + @sparticuz/chromium を追加してこの関数にフォールバック処理を
 * 実装する(実装計画1.2節を参照。個人利用プロトタイプでは新規サーバーを立てない方針)。
 */
export async function fetchAndParseShutuba(query: RaceQuery, raceUrl: string): Promise<RaceInfo> {
  const html = await fetchJraHtml(raceUrl);
  const raceInfo = parseShutubaHtml(query, html);

  if (raceInfo.entries.length === 0) {
    throw new RaceResolutionError(
      query,
      "出馬表データを静的HTMLから抽出できませんでした。JavaScriptによる動的読み込みの可能性があります" +
        "(Playwrightフォールバック未実装。実装計画1.2節を参照してください)。",
    );
  }

  return raceInfo;
}
