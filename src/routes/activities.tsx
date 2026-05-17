import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain, Crosshair, Headphones, HandMetal, Eye, Wind, Timer } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Activities — Virtuaero" },
      { name: "description", content: "Targeted drills mapped to the cognitive, motor, and behavioral axes the model scores." },
    ],
  }),
  component: Activities,
});

const ACTIVITIES = [
  { icon: Brain,      cat: "Cognitive",  title: "Pattern Lock",        dur: "12 min", lvl: "Intermediate", desc: "Sequence-recall drill that lifts CR and IP scores under time pressure.", axes: ["CR", "IP", "Concentration"] },
  { icon: Crosshair,  cat: "Motor",      title: "Vector Trace",        dur: "10 min", lvl: "Advanced",     desc: "Dual-stick tracing of curved flight paths. Trains MP and PP fine control.", axes: ["MP", "PP.1", "ACT"] },
  { icon: Headphones, cat: "Sensory",    title: "Tower Static",        dur: "8 min",  lvl: "Beginner",     desc: "Hear and repeat ATC calls buried in cockpit noise.", axes: ["Hearing", "Responsiveness"] },
  { icon: HandMetal,  cat: "Motor",      title: "Grip Hold",           dur: "6 min",  lvl: "Beginner",     desc: "Sustained force calibration for HG, H1, H2 axes.", axes: ["HG", "H1", "H2"] },
  { icon: Eye,        cat: "Cognitive",  title: "Horizon Scan",        dur: "15 min", lvl: "Advanced",     desc: "Multi-target tracking simulating cluttered airspace.", axes: ["IP", "Initiative"] },
  { icon: Wind,       cat: "Behavioral", title: "Storm Calm",          dur: "20 min", lvl: "Intermediate", desc: "Stress-inoculation breathing. Reduces excitability spikes.", axes: ["Excitability", "Confidence"] },
  { icon: Timer,      cat: "Cognitive",  title: "Reaction Grid",       dur: "5 min",  lvl: "Beginner",     desc: "Quick-stimulus response. Sharpens overall responsiveness.", axes: ["Responsiveness", "CR.1"] },
  { icon: Brain,      cat: "Cognitive",  title: "Mental Math Dive",    dur: "10 min", lvl: "Intermediate", desc: "Headwind/fuel calculations under altitude loss simulation.", axes: ["PP", "Concentration"] },
];

const CATS = ["All", "Cognitive", "Motor", "Sensory", "Behavioral"] as const;

import { useState } from "react";

function Activities() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const filtered = cat === "All" ? ACTIVITIES : ACTIVITIES.filter((a) => a.cat === cat);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-hud">// training_grid</div>
        <h1 className="mt-2 text-4xl font-bold">Targeted Activities</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Each drill is mapped to the same axes the AI model scores. Train your weakest signals and rerun the scan.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 border font-mono uppercase text-xs tracking-widest transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary glow-hud" : "border-border text-muted-foreground hover:border-primary/60 hover:text-hud"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a, i) => (
            <motion.article
              key={a.title}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative border border-border bg-card/40 backdrop-blur p-5 overflow-hidden hover:border-primary/60 transition"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/15 transition" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 grid place-items-center border border-primary/40 text-hud">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-secondary">{a.cat}</div>
                </div>
                <h3 className="mt-4 text-lg font-bold">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {a.axes.map((x) => (
                    <span key={x} className="text-[10px] font-mono px-2 py-0.5 border border-border text-muted-foreground">{x}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-muted-foreground">{a.dur} · {a.lvl}</span>
                  <span className="text-hud group-hover:translate-x-1 transition-transform">Engage →</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
