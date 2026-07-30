export const TRACK_CODES: Record<string, string> = {
  札幌: "01",
  函館: "02",
  福島: "03",
  新潟: "04",
  東京: "05",
  中山: "06",
  中京: "07",
  京都: "08",
  阪神: "09",
  小倉: "10",
};

export function resolveTrackCode(trackName: string): string | undefined {
  return TRACK_CODES[trackName];
}
