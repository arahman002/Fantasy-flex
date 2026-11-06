export const sports = {
  nfl: { label: "NFL", path: "football/nfl" },
  nba: { label: "NBA", path: "basketball/nba" },
  mlb: { label: "MLB", path: "baseball/mlb" },
  nhl: { label: "NHL", path: "hockey/nhl" },
} as const;
export type Sport = keyof typeof sports;
export type Game = {
  id: string;
  name: string;
  date: string;
  state: "pre" | "in" | "post";
  status: string;
  teams: { name: string; score: string; homeAway: string }[];
  leaders: { category: string; name: string; value: string }[];
  url: string;
};
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" ? (value as RecordValue) : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const string = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
export function espnLink(value: unknown, fallback: string) {
  try {
    const url = new URL(string(value));
    if (
      url.protocol === "https:" &&
      (url.hostname === "espn.com" || url.hostname.endsWith(".espn.com"))
    )
      return url.href;
  } catch {
    /* Missing or malformed upstream link. */
  }
  return fallback;
}
export function parseScoreboard(payload: unknown, sport: Sport): Game[] {
  const root = record(payload);
  if (!Array.isArray(root.events))
    throw new Error("ESPN returned an unreadable scoreboard.");
  return root.events
    .flatMap<Game>((value) => {
      const event = record(value),
        competition = record(list(event.competitions)[0]);
      const type = record(record(competition.status ?? event.status).type);
      const state: Game["state"] =
        type.state === "in" || type.state === "post" ? type.state : "pre";
      const teams = list(competition.competitors)
        .map((value) => {
          const competitor = record(value),
            team = record(competitor.team);
          return {
            name: string(
              team.shortDisplayName,
              string(team.displayName, "Unknown team"),
            ),
            score: state === "pre" ? "—" : string(competitor.score, "—"),
            homeAway: string(competitor.homeAway),
          };
        })
        .sort(
          (a, b) =>
            (a.homeAway === "away" ? 0 : 1) - (b.homeAway === "away" ? 0 : 1),
        );
      if (!string(event.id) || teams.length < 2) return [];
      const leaders = list(competition.leaders)
        .flatMap((value) => {
          const category = record(value),
            leader = record(list(category.leaders)[0]);
          const athlete = record(leader.athlete);
          return string(athlete.displayName) && string(leader.displayValue)
            ? [
                {
                  category: string(
                    category.shortDisplayName,
                    string(category.displayName, "Leader"),
                  ),
                  name: string(athlete.displayName),
                  value: string(leader.displayValue),
                },
              ]
            : [];
        })
        .slice(0, 3);
      const fallback = `https://www.espn.com/${sport}/scoreboard`;
      const link = list(event.links)
        .map(record)
        .find((link) => list(link.rel).includes("summary"));
      return [
        {
          id: string(event.id),
          name: string(event.name, teams.map((t) => t.name).join(" vs ")),
          date: string(event.date),
          state,
          status: string(
            type.shortDetail,
            string(type.description, "Scheduled"),
          ),
          teams,
          leaders,
          url: espnLink(link?.href, fallback),
        },
      ];
    })
    .sort(
      (a, b) =>
        ({ in: 0, pre: 1, post: 2 })[a.state] -
        { in: 0, pre: 1, post: 2 }[b.state],
    );
}
