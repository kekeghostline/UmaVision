import "server-only";
import * as cheerio from "cheerio";
import { postJraForm } from "./http";
import { RaceQuery, RaceResolutionError } from "./types";

const ACCESS_D_URL = "https://www.jra.go.jp/JRADB/accessD.html";
const RACE_NUM_ALT_PATTERN = /(\d{1,2})レース/;

/**
 * 「レース選択」ページ(POST /JRADB/accessD.html, cname=<開催選択で解決したCNAME>)から、
 * 指定レース番号の出馬表(accessD.html?CNAME=...)URLを解決する。
 *
 * レース番号はリンク内の画像alt属性(例:「6レース」)から取得する。同じリンクが
 * レース番号ボタンと「出馬表」ボタンの2箇所に出現するため、hrefで重複排除する。
 */
export async function resolveRaceUrl(query: RaceQuery, raceSelectCname: string): Promise<string> {
  const html = await postJraForm(ACCESS_D_URL, raceSelectCname);
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const candidates: { href: string; raceNo?: number }[] = [];

  $("a[href*='/JRADB/accessD.html?CNAME=']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || seen.has(href)) return;
    seen.add(href);

    const alt = $(el).find("img").attr("alt") ?? "";
    const match = alt.match(RACE_NUM_ALT_PATTERN);
    candidates.push({ href, raceNo: match ? Number(match[1]) : undefined });
  });

  if (candidates.length === 0) {
    throw new RaceResolutionError(query, "レース選択ページに出馬表リンクが見つかりませんでした。");
  }

  const byExplicitNo = candidates.find((c) => c.raceNo === query.raceNo);
  const target = byExplicitNo ?? candidates[query.raceNo - 1];

  if (!target) {
    throw new RaceResolutionError(
      query,
      `${query.raceNo}Rに対応する出馬表リンクを特定できませんでした(候補${candidates.length}件)。`,
    );
  }

  return new URL(target.href, "https://www.jra.go.jp").toString();
}
