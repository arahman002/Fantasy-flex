import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw, Radio } from "lucide-react";
import { parseScoreboard, sports, type Game, type Sport } from "./espn";

export default function LiveScores() {
  const [sport, setSport] = useState<Sport>("nfl");
  const [games, setGames] = useState<Game[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true,
      running = false;
    let controller: AbortController | undefined;
    async function load() {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      setBusy(true);
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 12000);
      try {
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${sports[sport].path}/scoreboard`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`ESPN returned ${response.status}.`);
        const data = parseScoreboard(await response.json(), sport);
        if (active) {
          setGames(data);
          setUpdated(new Date());
          setError("");
        }
      } catch {
        if (active)
          setError("ESPN scores are temporarily unavailable. Try refreshing.");
      } finally {
        clearTimeout(timeout);
        running = false;
        if (active) setBusy(false);
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 60000);
    const wake = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [sport, refresh]);
  return (
    <section className="live-scores" aria-labelledby="live-scores-heading">
      <div className="section-heading">
        <div>
          <h2 id="live-scores-heading">
            <Radio size={19} /> ESPN scores & stats
          </h2>
          <p>Current scoreboard · refreshes every minute</p>
        </div>
        <div className="score-controls">
          <label>
            League
            <select
              value={sport}
              onChange={(e) => {
                setGames([]);
                setUpdated(null);
                setError("");
                setSport(e.target.value as Sport);
              }}
            >
              {Object.entries(sports).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => setRefresh((value) => value + 1)}
            aria-label="Refresh ESPN scores"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
      <div className="score-update" role="status">
        {busy
          ? "Updating ESPN scores…"
          : updated
            ? `${error ? "Last successful update" : "Updated"} ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : "Waiting for ESPN scores"}
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
          {updated && " Scores below may be out of date."}
        </p>
      )}
      {!busy && !error && !games.length && (
        <p className="score-empty">
          No games are listed on ESPN’s current {sports[sport].label}{" "}
          scoreboard.
        </p>
      )}
      <div className="score-grid">
        {games.slice(0, 6).map((game) => (
          <article className="score-card" key={game.id} aria-label={game.name}>
            <div className="score-card-heading">
              <span className={game.state === "in" ? "game-live" : ""}>
                {game.state === "in" && "● LIVE · "}
                {game.status}
              </span>
              <time dateTime={game.date}>
                {Number.isNaN(Date.parse(game.date))
                  ? ""
                  : new Date(game.date).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
              </time>
            </div>
            {game.teams.map((team, index) => (
              <div className="score-team" key={`${team.name}-${index}`}>
                <span>
                  {team.name}
                  <small>{team.homeAway}</small>
                </span>
                <strong>{team.score}</strong>
              </div>
            ))}
            {game.leaders.length > 0 && (
              <ul className="score-leaders">
                {game.leaders.map((leader, index) => (
                  <li key={index}>
                    <span>
                      {leader.category} · {leader.name}
                    </span>
                    <strong>{leader.value}</strong>
                  </li>
                ))}
              </ul>
            )}
            <a
              className="score-link"
              href={game.url}
              target="_blank"
              rel="noreferrer"
            >
              Game details on ESPN
              <ArrowUpRight size={14} />
            </a>
          </article>
        ))}
      </div>
      <a
        className="score-source"
        href={`https://www.espn.com/${sport}/scoreboard`}
        target="_blank"
        rel="noreferrer"
      >
        View full {sports[sport].label} scoreboard on ESPN{" "}
        <ArrowUpRight size={13} />
      </a>
    </section>
  );
}
