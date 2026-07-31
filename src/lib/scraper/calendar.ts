import "server-only";
import * as cheerio from "cheerio";
import { postJraForm } from "./http";
import { RaceQuery, RaceNotPublishedError, RaceResolutionError } from "./types";

const ACCESS_D_URL = "https://www.jra.go.jp/JRADB/accessD.html";

// 「出馬表 開催選択」画面の固定CNAME。JRAサイトのJS(doAction)がこの値でPOSTしている。
const KAISAI_SELECT_CNAME = "pw01dli00/F3";

const DO_ACTION_PATTERN = /doAction\(\s*'\/JRADB\/accessD\.html'\s*,\s*'([^']+)'\s*\)/;

/**
 * 「出馬表 開催選択」ページ(POST /JRADB/accessD.html, cname=pw01dli00/F3)から、
 * 指定した日付・競馬場に対応する「レース選択」ページのCNAMEを解決する。
 *
 * このページには開催が近い(概ね今週の)レースのみ掲載される。日付の見出し
 * (例:「8月1日」)が見つからない場合は掲載期間外、見出しはあるが競馬場名の
 * リンクが見つからない場合はその日にその競馬場の開催がないと判断する。
 */
export async function resolveRaceSelectCname(query: RaceQuery): Promise<string> {
  const date = new Date(query.date);
  if (Number.isNaN(date.getTime())) {
    throw new RaceResolutionError(query, `日付の形式が不正です: ${query.date}`);
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateLabel = `${month}月${day}日`; // JRAの表記はゼロ埋めなし

  const html = await postJraForm(ACCESS_D_URL, KAISAI_SELECT_CNAME);
  const $ = cheerio.load(html);

  const panel = $("div.panel").filter(
    (_, el) => $(el).find("h3.sub_header").text().includes(dateLabel),
  );

  if (panel.length === 0) {
    throw new RaceNotPublishedError(query);
  }

  let cname: string | undefined;
  panel.find("a").each((_, el) => {
    if (cname) return;
    const text = $(el).text();
    const onclick = $(el).attr("onclick") ?? "";
    const match = onclick.match(DO_ACTION_PATTERN);
    if (match && text.includes(query.trackName)) {
      cname = match[1];
    }
  });

  if (!cname) {
    throw new RaceResolutionError(
      query,
      `${dateLabel}に「${query.trackName}」の開催情報が見つかりませんでした。`,
    );
  }

  return cname;
}
