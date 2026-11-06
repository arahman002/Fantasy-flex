import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { demoLeagues, supabase, validateLeague, type League } from "./lib";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(!!supabase);
  const [demo, setDemo] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<League | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setInitializing(false);
          if (error) setMessage(error.message);
        }
      })
      .catch(() => {
        if (active) {
          setInitializing(false);
          setMessage("Unable to restore your session. Please sign in again.");
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setInitializing(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (demo) {
      setLeagues(demoLeagues);
      return;
    }
    if (!userId || !supabase) {
      setLeagues([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    supabase
      .from("leagues")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error) setError(error.message);
        else setLeagues(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [userId, demo]);
  useEffect(() => {
    if (modal || selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal, selected]);
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const credentials = {
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      };
      const { error } =
        authMode === "login"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({
              ...credentials,
              options: { emailRedirectTo: window.location.origin },
            });
      setMessage(
        error
          ? error.message
          : authMode === "signup"
            ? "Check your email to confirm your account, then sign in."
            : "",
      );
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setError("");
    if (demo) {
      setDemo(false);
      setLeagues([]);
      return;
    }
    const { error } = await supabase!.auth.signOut();
    if (error) setError(error.message);
  }
  async function createLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim(),
      team_count = Number(form.get("teams"));
    const invalid = validateLeague(name, team_count);
    if (invalid) {
      setMessage(invalid);
      return;
    }
    setBusy(true);
    setMessage("");
    const league = {
      name,
      team_count,
      sport: String(form.get("sport")),
      scoring: String(form.get("scoring")),
      season: new Date().getFullYear(),
      owner_id: userId!,
    };
    try {
      if (demo)
        setLeagues((current) => [
          {
            ...league,
            owner_id: "demo",
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      else {
        const { data, error } = await supabase!
          .from("leagues")
          .insert(league)
          .select()
          .single();
        if (error) throw error;
        setLeagues((current) => [data as League, ...current]);
      }
      setModal(false);
    } catch (err) {
      setMessage(
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Could not create the league. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const brand = (
    <a className="brand" href="/" aria-label="Fantasy Flex home">
      <span className="brand-mark">
        <Zap size={23} fill="currentColor" />
      </span>
      fantasy<span>flex</span>
      <span className="brand-dot">.</span>
    </a>
  );
  if (initializing)
    return (
      <main className="auth-page">
        <p role="status">Loading Fantasy Flex…</p>
      </main>
    );
  if (!session && !demo)
    return (
      <main className="auth-page">
        <section className="auth-story">
          {brand}
          <div>
            <span className="eyebrow">
              A LITTLE COMPETITION. A LOT OF CONNECTION.
            </span>
            <h1>
              Your league.
              <br />
              Your people.
              <br />
              <em>Your next win.</em>
            </h1>
            <p>
              A home for every league and every big move.
              <br />
              Let’s make this season one to remember.
            </p>
            <div className="auth-badge">
              <Trophy size={20} /> Built for the love of the game
            </div>
          </div>
          <small>FANTASY SPORTS, MORE CONNECTED.</small>
        </section>
        <section className="auth-panel">
          <div className="auth-card">
            <span className="eyebrow">WELCOME TO FANTASY FLEX</span>
            <div
              className="auth-options"
              role="group"
              aria-label="Account options"
            >
              <button
                type="button"
                aria-pressed={authMode === "login"}
                onClick={() => {
                  setAuthMode("login");
                  setMessage("");
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={authMode === "signup"}
                onClick={() => {
                  setAuthMode("signup");
                  setMessage("");
                }}
              >
                Create account
              </button>
            </div>
            <h2>
              {authMode === "login"
                ? "Back in the game."
                : "Your season starts here."}
            </h2>
            <p>
              {authMode === "login"
                ? "Sign in to your fantasy headquarters."
                : "Create your login with an email and password. Confirm your email to start saving leagues."}
            </p>
            <form onSubmit={authenticate}>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  disabled={!supabase}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="At least 8 characters"
                  required
                  disabled={!supabase}
                />
              </label>
              <button className="button primary" disabled={busy || !supabase}>
                {busy
                  ? "Please wait…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
                <ArrowRight size={18} />
              </button>
            </form>
            {message && (
              <p role="status" className="notice">
                {message}
              </p>
            )}
            {!supabase && (
              <p className="notice">
                Authentication needs Supabase configuration. Explore the demo
                below.
              </p>
            )}
            <p className="auth-switch">
              {authMode === "login"
                ? "New to the league?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setMessage("");
                }}
              >
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <div className="divider">OR TAKE A LOOK AROUND</div>
            <button className="button secondary" onClick={() => setDemo(true)}>
              Explore demo dashboard
              <ArrowUpRight size={17} />
            </button>
            <small className="fine-print">
              Demo data stays in this session. No account needed.
            </small>
          </div>
        </section>
      </main>
    );
  const visible = leagues.filter((league) =>
    `${league.name} ${league.sport}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        {brand}
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={19} /> Overview <span className="nav-dot" />
          </a>
          <a className="nav-item" href="#leagues">
            <Trophy size={19} /> My leagues{" "}
            <span className="nav-count">{leagues.length}</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="season-card">
            <span className="mini-icon">
              <Zap size={18} />
            </span>
            <h3>
              A fresh season.
              <br />
              Endless possibilities.
            </h3>
            <p>
              Bring your people together.
              <br />
              Build your next great league.
            </p>
            <button
              onClick={() => {
                setMessage("");
                setModal(true);
              }}
            >
              Create a league <ArrowUpRight size={15} />
            </button>
          </div>
          <a
            className="nav-item"
            href="https://supabase.com/docs/guides/auth"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={18} /> Authentication help{" "}
            <ArrowUpRight size={14} />
          </a>
          <button className="nav-item" onClick={signOut}>
            <LogOut size={18} /> Sign out
          </button>
          <div className="profile">
            <span className="avatar">
              {demo ? "D" : session?.user.email?.[0].toUpperCase()}
            </span>
            <div>
              <strong>
                {demo ? "Demo manager" : session?.user.email?.split("@")[0]}
              </strong>
              <small>
                {demo ? "Exploring Fantasy Flex" : "League manager"}
              </small>
            </div>
            <ShieldCheck size={16} />
          </div>
        </div>
      </aside>
      <main className="dashboard" id="dashboard">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={14} /> <strong>Overview</strong>
          </span>
          <span className="season-pill">
            <span /> {new Date().getFullYear()} season
          </span>
        </header>
        <div className="page-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <ShieldCheck size={16} /> You’re exploring the demo. Changes
                aren’t saved.
              </span>
              <div className="demo-account-actions">
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setMessage("");
                    setDemo(false);
                  }}
                >
                  Create account <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setMessage("");
                    setDemo(false);
                  }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR FANTASY HEADQUARTERS</span>
              <h1>
                Let’s make moves<span>.</span>
              </h1>
              <p>Your leagues. Your competition. All in one place.</p>
            </div>
            <button
              className="button primary"
              onClick={() => {
                setMessage("");
                setModal(true);
              }}
            >
              <Plus size={18} /> Create league
            </button>
          </div>
          <section className="hero">
            <div>
              <span className="hero-label">
                <span /> THE NEXT GREAT SEASON STARTS HERE
              </span>
              <h2>
                Big rivalries.
                <br />
                <em>Even bigger possibilities.</em>
              </h2>
              <p>
                Good friends. Close matchups. Bragging rights.
                <br />
                Your next chapter starts with a league.
              </p>
              <button
                onClick={() =>
                  document
                    .getElementById("leagues")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find your next move <ArrowRight size={18} />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="trophy-emblem">
                <Trophy size={90} strokeWidth={1.25} />
                <span>PLAY FOR MORE</span>
              </div>
              <span className="spark spark-one">✦</span>
              <span className="spark spark-two">✧</span>
            </div>
          </section>
          <section className="stats" aria-label="League summary">
            <article>
              <span className="stat-icon green">
                <Trophy size={21} />
              </span>
              <div>
                <span>My leagues</span>
                <strong>{loading ? "—" : leagues.length}</strong>
              </div>
              <small>Your competition hub</small>
            </article>
            <article>
              <span className="stat-icon amber">
                <Users size={21} />
              </span>
              <div>
                <span>Total team slots</span>
                <strong>
                  {loading
                    ? "—"
                    : leagues.reduce(
                        (sum, league) => sum + league.team_count,
                        0,
                      )}
                </strong>
              </div>
              <small>Across your leagues</small>
            </article>
            <article>
              <span className="stat-icon blue">
                <ShieldCheck size={21} />
              </span>
              <div>
                <span>Your role</span>
                <strong className="text-stat">Commissioner</strong>
              </div>
              <small>Build it. Make it yours.</small>
            </article>
          </section>
          <section id="leagues" className="leagues-section">
            <div className="section-heading">
              <div>
                <h2>
                  My leagues <span>{leagues.length}</span>
                </h2>
                <p>A little rivalry looks good on you.</p>
              </div>
              <label className="search">
                <Search size={17} />
                <input
                  aria-label="Search leagues"
                  placeholder="Search leagues…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            {error && (
              <p role="alert" className="notice">
                {error}
              </p>
            )}
            {loading ? (
              <p role="status">Loading your leagues…</p>
            ) : (
              <div className="league-grid">
                {visible.map((league, index) => (
                  <button
                    className="league-card"
                    key={league.id}
                    onClick={() => setSelected(league)}
                  >
                    <div className="league-card-top">
                      <span className={`league-icon color-${index % 3}`}>
                        <Trophy size={24} />
                      </span>
                      <span className="league-status">
                        {demo ? "DEMO LEAGUE" : "GETTING STARTED"}
                      </span>
                    </div>
                    <h3>{league.name}</h3>
                    <p>
                      {league.sport} <span>•</span> {league.season} season
                    </p>
                    <div className="league-tags">
                      <span>
                        <Users size={13} /> {league.team_count} teams
                      </span>
                      <span>{league.scoring}</span>
                    </div>
                    <div className="league-footer">
                      <span>View league</span>
                      <ArrowUpRight size={18} />
                    </div>
                  </button>
                ))}
                <button
                  className="new-league-card"
                  onClick={() => {
                    setMessage("");
                    setModal(true);
                  }}
                >
                  <span>
                    <Plus size={24} />
                  </span>
                  <h3>
                    {leagues.length
                      ? "Room for one more?"
                      : "Start your first league"}
                  </h3>
                  <p>
                    New league. New rivalries.
                    <br />
                    Same love for the game.
                  </p>
                  <strong>
                    Create a league <ArrowRight size={15} />
                  </strong>
                </button>
              </div>
            )}
            {query && !visible.length && !loading && (
              <p role="status">
                No leagues match “{query}”. Try another name or sport.
              </p>
            )}
          </section>
          <footer>
            <span className="footer-brand">
              <Zap size={14} /> FANTASY FLEX
            </span>
            <span>Made for the managers. Built for the game.</span>
          </footer>
        </div>
      </main>
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (busy) {
            event.preventDefault();
            return;
          }
          setModal(false);
          setSelected(null);
          setMessage("");
        }}
        onClose={() => {
          setModal(false);
          setSelected(null);
        }}
        aria-labelledby="dialog-title"
      >
        <button
          className="close-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={() => {
            setModal(false);
            setSelected(null);
          }}
        >
          <X size={20} />
        </button>
        {selected ? (
          <>
            <span className="stat-icon green">
              <Trophy />
            </span>
            <h2 id="dialog-title">{selected.name}</h2>
            <p>
              {selected.sport} · {selected.season} season
            </p>
            <dl>
              <dt>Team slots</dt>
              <dd>{selected.team_count}</dd>
              <dt>Scoring</dt>
              <dd>{selected.scoring}</dd>
              <dt>Your role</dt>
              <dd>Commissioner</dd>
            </dl>
            <p className="notice">
              <Check size={16} /> League foundation ready. Drafts, rosters, and
              invitations are coming in a future release.
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow">BRING YOUR PEOPLE TOGETHER</span>
            <h2 id="dialog-title">Create your league.</h2>
            <p>Set the stage for your next great rivalry.</p>
            <form onSubmit={createLeague}>
              <label>
                League name
                <input
                  name="name"
                  autoFocus
                  required
                  minLength={3}
                  maxLength={60}
                  placeholder="e.g. Sunday Night Legends"
                />
              </label>
              <label>
                Sport
                <select name="sport">
                  <option>Football</option>
                  <option>Basketball</option>
                  <option>Baseball</option>
                  <option>Hockey</option>
                </select>
              </label>
              <div className="form-row">
                <label>
                  Team slots
                  <input
                    name="teams"
                    type="number"
                    min={4}
                    max={20}
                    defaultValue={12}
                    required
                  />
                </label>
                <label>
                  Scoring
                  <select name="scoring">
                    <option>Points</option>
                    <option>PPR</option>
                    <option>Half PPR</option>
                    <option>Head-to-head</option>
                  </select>
                </label>
              </div>
              {message && (
                <p role="alert" className="notice">
                  {message}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                {busy ? "Creating…" : "Create league"}
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
