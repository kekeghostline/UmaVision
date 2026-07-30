import "server-only";
import * as cheerio from "cheerio";
import { fetchJraHtml } from "./http";
import { RaceQuery, RaceResolutionError } from "./types";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * JRAの開催カレンダーページから、指定した日付・競馬場に対応する
 * 週間出走馬情報ページ(thisweek)のURLを解決する。
 *
 * URL構造 (https://www.jra.go.jp/keiba/calendar{year}/{year}/{month}/{mmdd}.html) は
 * 実際の開催週でのみ確認できており、年をまたいだ再現性は未検証。
 * 開催が近いレースで実際に動作確認してから信頼すること(実装計画の検証手順を参照)。
 */
export async function resolveThisweekUrl(query: RaceQuery): Promise<string> {
  const date = new Date(query.date);
  if (Number.isNaN(date.getTime())) {
    throw new RaceResolutionError(query, `日付の形式が不正です: ${query.date}`);
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mmdd = `${pad2(month)}${pad2(day)}`;

  const calendarUrl = `https://www.jra.go.jp/keiba/calendar${year}/${year}/${month}/${mmdd}.html`;
  const html = await fetchJraHtml(calendarUrl);
  const $ = cheerio.load(html);

  let thisweekHref: string | undefined;

  $("a[href*='/keiba/thisweek/']").each((_, el) => {
    if (thisweekHref) return;
    const text = $(el).text();
    const href = $(el).attr("href");
    if (href && text.includes(query.trackName)) {
      thisweekHref = href;
    }
  });

  if (!thisweekHref) {
    throw new RaceResolutionError(
      query,
      `開催カレンダー(${calendarUrl})から「${query.trackName}」の開催情報を見つけられませんでした。開催のない日付・競馬場の組み合わせの可能性があります。`,
    );
  }

  return new URL(thisweekHref, "https://www.jra.go.jp").toString();
}
