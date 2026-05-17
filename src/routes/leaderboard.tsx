import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { getLeaderboard } from "@/lib/leaderboard";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Virtuaero" },
      { name: "description", content: "Top aviators ranked by AI-predicted success rate." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [rows, setRows] = useState<ReturnType<typeof getLeaderboard>>([]);
  useEffect(() => { setRows(getLeaderboard()); }, []);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-hud">// squadron_ranking</div>
        <h1 className="mt-2 text-4xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">Highest AI-predicted success rates, all-time.</p>

        {/* Podium */}
        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 items-end">
          {[1, 0, 2].map((idx, i) => {
            const r = rows[idx];
            if (!r) return <div key={i} />;
            const height = ["h-32", "h-44", "h-24"][i];
            const Icon = [Medal, Trophy, Award][i];
            const place = [2, 1, 3][i];
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <Icon className={`w-8 h-8 mb-2 ${place === 1 ? "text-hud" : place === 2 ? "text-secondary" : "text-accent"}`} />
                <div className="font-display font-bold text-sm tracking-widest text-center truncate w-full">{r.callsign}</div>
                <div className="text-2xl font-display font-black text-hud mt-1">{r.rate}%</div>
                <div className={`mt-3 w-full ${height} border border-primary/40 bg-gradient-to-t from-primary/20 to-transparent grid place-items-start justify-center pt-2 relative overflow-hidden`}>
                  <div className="absolute inset-0 hud-grid opacity-50" />
                  <div className="relative font-display font-black text-3xl text-hud">#{place}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Table */}
        <div className="mt-12 border border-border bg-card/40 backdrop-blur overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border bg-background/40">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Callsign</div>
            <div className="col-span-3">Band</div>
            <div className="col-span-3 text-right">Success Rate</div>
          </div>
          {rows.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-12 px-5 py-3 items-center border-b border-border/50 last:border-b-0 hover:bg-primary/5 transition"
            >
              <div className="col-span-1 font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
              <div className="col-span-5 font-display font-bold tracking-wider">{r.callsign}</div>
              <div className="col-span-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                  r.band === "Elite" ? "text-hud border-primary/60" :
                  r.band === "Strong" ? "text-secondary border-secondary/60" :
                  r.band === "Capable" ? "text-accent border-accent/60" :
                  "text-destructive border-destructive/60"
                }`}>{r.band}</span>
              </div>
              <div className="col-span-3 text-right">
                <div className="inline-flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-border overflow-hidden hidden sm:block">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.rate}%` }}
                      transition={{ duration: 0.8, delay: i * 0.04 }}
                      className="h-full bg-primary glow-hud"
                    />
                  </div>
                  <div className="font-mono tabular-nums text-hud font-bold">{r.rate}%</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
