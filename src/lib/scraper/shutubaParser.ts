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
 * 実データで確認した構造: 出馬表テーブルは `table.basic.narrow-xy.mt20`
 * (同じページ内にある「過去5年の成績」テーブルは `.mt20` が付かないため区別できる)。
 * 各行は td.waku(枠、画像のみ) / td.num(馬番) / td.horse(馬名・厩舎名などが入れ子) /
 * td.jockey(性齢・斤量・騎手名が入れ子) / 過去走4列、という構成でクラスベースに抽出する。
 * オッズはこのページには含まれない(別ページaccessO.htmlが必要、今回のスコープ外)。
 */
export function parseShutubaHtml(query: RaceQuery, html: string): RaceInfo {
  const $ = cheerio.load(html);
  const bodyText = $("body").text();

  if (isUnpublished(bodyText)) {
    throw new RaceNotPublishedError(query);
  }

  const entries: ShutubaEntry[] = [];

  $("table.basic.narrow-xy.mt20 tbody tr").each((_, row) => {
    const $row = $(row);
    const umaban = Number($row.find("td.num").text().trim());
    if (!Number.isInteger(umaban) || umaban <= 0 || umaban > 18) return;

    const horseName = $row.find("td.horse .name a").first().text().trim();
    const trainerName = $row.find("td.horse .trainer a").first().text().trim();

    const ageText = $row.find("td.jockey p.age").first().text().trim();
    const sexAge = ageText.split("/")[0]?.trim() ?? ageText;

    const weightText = $row.find("td.jockey p.weight").first().text().trim();
    const weightCarried = Number(weightText.replace(/[^\d.]/g, "")) || 0;

    const jockeyName = $row.find("td.jockey p.jockey a").first().text().trim();

    entries.push({
      umaban,
      horseName,
      sexAge,
      weightCarried,
      jockeyName,
      trainerName,
    });
  });

  const raceName = $("span.race_name").first().text().trim() || `${query.trackName}${query.raceNo}R`;

  const courseText = $("div.cell.course").first().text().replace(/\s+/g, "");
  const distanceMatch = courseText.match(/([\d,]+)メートル/);
  const distanceMeters = distanceMatch ? Number(distanceMatch[1].replace(/,/g, "")) : undefined;
  const surfaceMatch = courseText.match(/[（(]([芝ダート]+)/);
  const surface = surfaceMatch ? surfaceMatch[1] : undefined;

  return {
    date: query.date,
    trackName: query.trackName,
    raceNo: query.raceNo,
    raceName,
    distanceMeters,
    surface,
    entries,
  };
}
