import "server-only";
import { resolveThisweekUrl } from "./calendar";
import { resolveRaceUrl } from "./thisweek";
import { fetchAndParseShutuba } from "./fetchWithFallback";
import { RaceInfo, RaceQuery } from "./types";

export type { RaceQuery, RaceInfo, ShutubaEntry } from "./types";
export { RaceNotPublishedError, RaceResolutionError } from "./types";

export async function fetchShutubaTable(query: RaceQuery): Promise<RaceInfo> {
  const thisweekUrl = await resolveThisweekUrl(query);
  const raceUrl = await resolveRaceUrl(query, thisweekUrl);
  return fetchAndParseShutuba(query, raceUrl);
}
