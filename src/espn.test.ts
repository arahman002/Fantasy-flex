import { describe, expect, it } from "vitest";
import { parseScoreboard, espnLink } from "./espn";
const event = (state: string, id = "1") => ({
  id,
  name: "Away at Home",
  date: "2026-11-06T01:00Z",
  competitions: [
    {
      status: {
        type: { state, shortDetail: state === "in" ? "Q2 3:20" : "Final" },
      },
      competitors: [
        { homeAway: "home", score: "0", team: { shortDisplayName: "Home" } },
        { homeAway: "away", score: "7", team: { shortDisplayName: "Away" } },
      ],
      leaders: [
        {
          shortDisplayName: "PASS",
          leaders: [
            { displayValue: "242 YDS", athlete: { displayName: "A Player" } },
          ],
        },
      ],
    },
  ],
});
describe("ESPN scoreboard", () => {
  it("preserves zero scores and leader stats, and orders away before home", () => {
    const [game] = parseScoreboard({ events: [event("in")] }, "nfl");
    expect(game.teams.map((team) => team.score)).toEqual(["7", "0"]);
    expect(game.leaders[0]).toEqual({
      category: "PASS",
      name: "A Player",
      value: "242 YDS",
    });
    expect(game.status).toBe("Q2 3:20");
  });
  it("shows scheduled scores as dashes and places live games first", () => {
    const games = parseScoreboard(
      { events: [event("post", "3"), event("pre", "2"), event("in", "1")] },
      "nfl",
    );
    expect(games.map((game) => game.id)).toEqual(["1", "2", "3"]);
    expect(games[1].teams[0].score).toBe("—");
  });
  it("handles empty feeds and incomplete events without inventing games", () => {
    expect(parseScoreboard({ events: [] }, "nba")).toEqual([]);
    expect(
      parseScoreboard({ events: [null, { id: "broken" }] }, "nba"),
    ).toEqual([]);
    expect(() => parseScoreboard({ error: "unavailable" }, "nba")).toThrow();
  });
  it("allows only HTTPS ESPN links", () => {
    const fallback = "https://www.espn.com/nfl/scoreboard";
    for (const link of [
      "javascript:alert(1)",
      "https://espn.com.attacker.test",
      "http://espn.com",
      null,
    ])
      expect(espnLink(link, fallback)).toBe(fallback);
    expect(
      espnLink("https://www.espn.com/nfl/game/_/gameId/1", fallback),
    ).toContain("/game/");
  });
});
