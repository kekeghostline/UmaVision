export interface RaceQuery {
  date: string; // YYYY-MM-DD
  trackName: string; // 例: "東京", "阪神"
  raceNo: number; // 1-12
}

export interface ShutubaEntry {
  umaban: number;
  horseName: string;
  sexAge: string;
  weightCarried: number;
  jockeyName: string;
  trainerName: string;
  odds?: number;
}

export interface RaceInfo {
  date: string;
  trackName: string;
  raceNo: number;
  raceName: string;
  distanceMeters?: number;
  surface?: string;
  trackCondition?: string;
  entries: ShutubaEntry[];
}

export class RaceNotPublishedError extends Error {
  constructor(query: RaceQuery) {
    super(
      `指定されたレース(${query.date} ${query.trackName} ${query.raceNo}R)の出馬表は現在JRAサイトに掲載されていません。`,
    );
    this.name = "RaceNotPublishedError";
  }
}

export class RaceResolutionError extends Error {
  constructor(query: RaceQuery, reason: string) {
    super(
      `指定されたレース(${query.date} ${query.trackName} ${query.raceNo}R)を特定できませんでした: ${reason}`,
    );
    this.name = "RaceResolutionError";
  }
}
