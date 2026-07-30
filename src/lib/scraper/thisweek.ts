import "server-only";
import * as cheerio from "cheerio";
import { fetchJraHtml } from "./http";
import { RaceQuery, RaceResolutionError } from "./types";

const ACCESS_D_SELECTOR = "a[href*='/JRADB/accessD.html']";
const RACE_NO_PATTERN = /(\d{1,2})\s*R/i;

/**
 * 週間出走馬情報ページ(thisweek)から、指定レース番号の出馬表(accessD.html)URLを解決する。
 *
 * レース番号の特定方法:
 * 1. リンクテキストに "◯R" のような表記があればそれを優先
 * 2. 見つからない場合は、ページ内の出馬表リンクの出現順を1R〜12Rとみなすフォールバックを使う
 *
 * ページ構造は実際の開催週でのみ確認できるため、いずれの方式が正しいかは
 * 開催が近いレースで検証が必要(実装計画の検証手順を参照)。
 */
export async function resolveRaceUrl(query: RaceQuery, thisweekUrl: string): Promise<string> {
  const html = await fetchJraHtml(thisweekUrl);
  const $ = cheerio.load(html);

  const candidates: { href: string; raceNo?: number }[] = [];
  $(ACCESS_D_SELECTOR).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const text = $(el).text();
    const match = text.match(RACE_NO_PATTERN);
    candidates.push({ href, raceNo: match ? Number(match[1]) : undefined });
  });

  if (candidates.length === 0) {
    throw new RaceResolutionError(
      query,
      `週間出走馬情報ページ(${thisweekUrl})に出馬表リンクが見つかりませんでした。`,
    );
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
