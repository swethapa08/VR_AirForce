import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gauge, Activity, Trophy, Cpu, Radar, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIRTUAERO — AI Pilot Aptitude Engine" },
      { name: "description", content: "Cinematic AI cockpit that scores pilot success rate from a 20-feature aptitude scan." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-secondary/10" />
        <motion.div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        <motion.div className="absolute inset-0 hud-grid opacity-60" />

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 border border-primary/40 bg-background/50 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-widest text-hud"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Virtuaero · CNN + RF + LR ensemble
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight"
          >
            PREDICT THE <br />
            <span className="gradient-text">PILOT SUCCESS RATE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Feed a 20-feature aptitude scan into our deep-learning ensemble.
            Get a calibrated success probability, behavioral drivers, and a
            cockpit-grade readout in under a second.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              to="/predict"
              className="group relative inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-mono uppercase text-sm tracking-widest glow-hud hover:scale-[1.02] transition-transform"
            >
              Launch Scan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 border border-border bg-background/40 backdrop-blur px-6 py-3 font-mono uppercase text-sm tracking-widest text-foreground hover:border-primary/60 hover:text-hud transition"
            >
              View Top Aviators
            </Link>
          </motion.div>

          {/* HUD readout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { k: "Features", v: "20" },
              { k: "Training rows", v: "5,000" },
              { k: "Architecture", v: "CNN→RF→LR" },
              { k: "Latency", v: "<200ms" },
            ].map((s) => (
              <div key={s.k} className="relative border border-border bg-card/40 backdrop-blur p-4 overflow-hidden scanline">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.k}</div>
                <div className="mt-2 text-2xl font-display font-bold text-hud">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Gauge, t: "Prediction", d: "Enter 20 aptitude readings. Get a probability, band, and top drivers.", to: "/predict" },
            { icon: Activity, t: "Activities", d: "Targeted drills mapped to your weakest cognitive and motor axes.", to: "/activities" },
            { icon: Trophy, t: "Leaderboard", d: "Where do you rank vs. squadron history? Climb the ladder.", to: "/leaderboard" },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={f.to} className="block group relative border border-border bg-card/40 backdrop-blur p-6 hover:border-primary/60 transition overflow-hidden h-full">
                <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
                <f.icon className="w-7 h-7 text-hud" />
                <h3 className="mt-4 text-xl font-bold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
                <div className="mt-6 text-xs font-mono uppercase tracking-widest text-hud inline-flex items-center gap-1">
                  Engage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mt-24">
          <div className="text-xs font-mono uppercase tracking-widest text-hud">// pipeline</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">From signal to success rate.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { icon: Radar, t: "1 · Capture", d: "20 standardized aptitude features collected on the dataset's 0–5 / 0–40 scale." },
              { icon: Cpu, t: "2 · Encode", d: "1D Convolutional Network learns local patterns across cognitive & motor axes." },
              { icon: Gauge, t: "3 · Decide", d: "Random Forest distills CNN features, Logistic Regression calibrates the final probability." },
            ].map((s) => (
              <div key={s.t} className="relative border border-border bg-card/40 p-6 overflow-hidden sweep">
                <s.icon className="w-6 h-6 text-hud" />
                <div className="mt-4 font-display font-bold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Virtuaero · Aviator Aptitude Engine · v2.0
      </footer>
    </div>
  );
}
