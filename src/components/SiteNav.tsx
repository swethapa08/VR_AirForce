import { Link } from "@tanstack/react-router";
import { Plane, Home, Gauge, Activity, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/predict", label: "Predict", icon: Gauge },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-9 h-9 rounded-sm border border-primary/60 grid place-items-center text-hud glow-hud"
          >
            <Plane className="w-4 h-4" />
          </motion.div>
          <div className="font-display font-bold text-lg tracking-[0.25em] gradient-text">
            VIRTUAERO
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-hud transition-colors rounded-sm"
              activeProps={{ className: "text-hud bg-primary/10 border border-primary/30" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              <span className="hidden sm:inline">{l.label}</span>
              <l.icon className="w-4 h-4 sm:hidden" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
