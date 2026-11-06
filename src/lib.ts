import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export type League = {
  id: string;
  name: string;
  sport: string;
  scoring: string;
  team_count: number;
  season: number;
  owner_id: string;
  created_at: string;
};
export const demoLeagues: League[] = [
  {
    id: "demo-1",
    name: "Sunday Night Legends",
    sport: "Football",
    scoring: "PPR",
    team_count: 12,
    season: 2026,
    owner_id: "demo",
    created_at: "",
  },
  {
    id: "demo-2",
    name: "The Hardwood Club",
    sport: "Basketball",
    scoring: "Points",
    team_count: 10,
    season: 2026,
    owner_id: "demo",
    created_at: "",
  },
  {
    id: "demo-3",
    name: "Fourth & Friends",
    sport: "Football",
    scoring: "Half PPR",
    team_count: 8,
    season: 2026,
    owner_id: "demo",
    created_at: "",
  },
];
export function validateLeague(name: string, teams: number) {
  if (name.trim().length < 3 || name.trim().length > 60)
    return "Use a league name between 3 and 60 characters.";
  if (!Number.isInteger(teams) || teams < 4 || teams > 20)
    return "Choose between 4 and 20 teams.";
  return null;
}
