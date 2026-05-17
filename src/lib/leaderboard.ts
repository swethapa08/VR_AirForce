export type LeaderEntry = {
  id: string;
  callsign: string;
  rate: number;
  band: string;
  ts: number;
};

const KEY = "virtuaero.leaderboard";

const SEED: LeaderEntry[] = [
  { id: "s1", callsign: "MAVERICK",  rate: 96, band: "Elite",   ts: Date.now() - 86400000 * 2 },
  { id: "s2", callsign: "ICEMAN",    rate: 92, band: "Elite",   ts: Date.now() - 86400000 * 3 },
  { id: "s3", callsign: "GHOSTRIDER",rate: 88, band: "Elite",   ts: Date.now() - 86400000 * 1 },
  { id: "s4", callsign: "VIPER",     rate: 81, band: "Strong",  ts: Date.now() - 86400000 * 4 },
  { id: "s5", callsign: "HOLLYWOOD", rate: 76, band: "Strong",  ts: Date.now() - 86400000 * 5 },
  { id: "s6", callsign: "SLIDER",    rate: 71, band: "Strong",  ts: Date.now() - 86400000 * 6 },
  { id: "s7", callsign: "GOOSE",     rate: 64, band: "Capable", ts: Date.now() - 86400000 * 7 },
  { id: "s8", callsign: "MERLIN",    rate: 58, band: "Capable", ts: Date.now() - 86400000 * 8 },
];

export function getLeaderboard(): LeaderEntry[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as LeaderEntry[];
    return [...SEED, ...parsed].sort((a, b) => b.rate - a.rate);
  } catch { return SEED; }
}

export function addEntry(e: Omit<LeaderEntry, "id" | "ts">) {
  if (typeof window === "undefined") return;
  const cur = (() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]") as LeaderEntry[]; }
    catch { return []; }
  })();
  cur.push({ ...e, id: crypto.randomUUID(), ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(cur));
}
