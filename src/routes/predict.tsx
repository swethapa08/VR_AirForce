import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, RotateCcw, Zap } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { predictSuccessAsync, type PredictInput, type PredictResult } from "@/lib/predict";
import { addEntry } from "@/lib/leaderboard";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict — Virtuaero" },
      { name: "description", content: "Enter aptitude readings and get the AI predicted pilot success rate." },
    ],
  }),
  component: Predict,
});

const FIELDS: { key: keyof PredictInput; label: string; max: number; group: string; hint?: string }[] = [
  { key: "confidence",        label: "Confidence",         max: 5, group: "Behavioral" },
  { key: "concentration",     label: "Concentration",      max: 5, group: "Behavioral" },
  { key: "responsiveness",    label: "Responsiveness",     max: 5, group: "Behavioral" },
  { key: "initiative",        label: "Initiative",         max: 5, group: "Behavioral" },
  { key: "excitability",      label: "Excitability",       max: 5, group: "Behavioral", hint: "lower is better" },
  { key: "hearingSensitivity",label: "Hearing Sensitivity",max: 5, group: "Behavioral" },
  { key: "bodySensitivity",   label: "Body Sensitivity",   max: 5, group: "Behavioral" },
  { key: "cr",                label: "CR",                 max: 5, group: "Cognitive" },
  { key: "ip",                label: "IP",                 max: 5, group: "Cognitive" },
  { key: "pp",                label: "PP",                 max: 5, group: "Cognitive" },
  { key: "cognitiveTotal",    label: "Cognitive Total",    max: 40, group: "Cognitive" },
  { key: "cr1",  label: "CR.1", max: 5,  group: "Motor" },
  { key: "mp",   label: "MP",   max: 5,  group: "Motor" },
  { key: "pp1",  label: "PP.1", max: 5,  group: "Motor" },
  { key: "ip1",  label: "IP.1", max: 5,  group: "Motor" },
  { key: "hg",   label: "HG",   max: 5,  group: "Motor" },
  { key: "h1",   label: "H1",   max: 5,  group: "Motor" },
  { key: "h2",   label: "H2",   max: 5,  group: "Motor" },
  { key: "act",  label: "ACT",  max: 5,  group: "Motor" },
  { key: "motorTotal", label: "Motor Total", max: 40, group: "Motor" },
];

type FormState = Record<keyof PredictInput, string>;
const EMPTY: FormState = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {} as FormState);

function Predict() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [callsign, setCallsign] = useState("");
  const [result, setResult] = useState<PredictResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PredictInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const navigate = useNavigate();

  const groups = ["Behavioral", "Cognitive", "Motor"];

  function reset() {
    setForm(EMPTY);
    setResult(null);
    setErrors({});
    setCallsign("");
    setPredictError(null);
    setLoading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof PredictInput, string>> = {};
    const parsed: Partial<PredictInput> = {};
    for (const f of FIELDS) {
      const raw = form[f.key].trim();
      if (raw === "") { errs[f.key] = "required"; continue; }
      const n = Number(raw);
      if (Number.isNaN(n)) { errs[f.key] = "number"; continue; }
      if (n < 0 || n > f.max) { errs[f.key] = `0–${f.max}`; continue; }
      parsed[f.key] = n;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setResult(null);
      return;
    }

    setLoading(true);
    setPredictError(null);
    setResult(null);
    try {
      const prediction = await predictSuccessAsync(parsed as PredictInput);
      setResult(prediction);
      requestAnimationFrame(() => {
        document.getElementById("result-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setPredictError("Model failed to load. Run ml/train.py and ml/export_bundle.py, then redeploy.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!callsign.trim() || !result) return;
    addEntry({ callsign: callsign.toUpperCase().slice(0, 16), rate: result.rate, band: result.band });
    navigate({ to: "/leaderboard" });
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-hud">// scan_input</div>
            <h1 className="mt-2 text-4xl font-bold">Aptitude Scan</h1>
            <p className="mt-1 text-muted-foreground text-sm">Enter each cadet reading manually, then run the prediction.</p>
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-mono uppercase tracking-widest hover:border-primary/60 hover:text-hud transition">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {groups.map((g) => (
            <div key={g} className="border border-border bg-card/40 backdrop-blur p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-primary glow-hud" />
                <div className="font-display font-bold tracking-widest">{g.toUpperCase()}</div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FIELDS.filter((f) => f.group === g).map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      <span>
                        {f.label} {f.hint && <span className="text-secondary normal-case">· {f.hint}</span>}
                      </span>
                      <span className="text-muted-foreground/60">0–{f.max}</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder="0.00"
                      className={`mt-1 w-full bg-input border px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary transition ${
                        errors[f.key] ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors[f.key] && (
                      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-destructive">
                        {errors[f.key]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 border border-primary/40 bg-card/40 backdrop-blur p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="text-hud">{Object.values(form).filter((v) => v.trim() !== "").length}</span> / {FIELDS.length} fields filled
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-mono uppercase text-sm tracking-widest glow-hud hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              <Zap className="w-4 h-4" /> {loading ? "Running ensemble…" : "Predict Success Rate"}
            </button>
          </div>
          {predictError && (
            <p className="text-xs font-mono uppercase tracking-widest text-destructive">{predictError}</p>
          )}
        </form>

        {/* RESULT */}
        <AnimatePresence>
          {result && (
            <motion.section
              id="result-panel"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5 }}
              className="mt-10 relative border border-primary/40 bg-card/60 backdrop-blur p-8 glow-hud overflow-hidden"
            >
              <div className="absolute inset-0 hud-grid opacity-40 pointer-events-none" />
              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div className="grid place-items-center">
                  <RateDial rate={result.rate} band={result.band} />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-hud">// prediction_complete</div>
                  <h2 className="mt-2 text-3xl font-bold">
                    Pilot is rated <span className="gradient-text">{result.band}</span>
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    The ensemble projects a <span className="text-hud font-mono">{result.rate}%</span> probability of training success based on the 20 entered readings.
                  </p>

                  <div className="mt-5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Top drivers</div>
                    <div className="space-y-1.5">
                      {result.drivers.map((d) => (
                        <div key={d.label} className="flex items-center justify-between text-xs font-mono border-b border-border/50 pb-1">
                          <span>{d.label}</span>
                          <span className={d.impact >= 0 ? "text-hud" : "text-secondary"}>
                            {d.impact >= 0 ? "+" : ""}{d.impact.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Callsign</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value)}
                        placeholder="MAVERICK"
                        maxLength={16}
                        className="flex-1 bg-input border border-border px-3 py-2 font-mono uppercase tracking-widest text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={save}
                        disabled={!callsign.trim()}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-mono uppercase text-xs tracking-widest disabled:opacity-40 hover:scale-[1.02] transition-transform"
                      >
                        <Save className="w-3.5 h-3.5" /> Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RateDial({ rate, band }: { rate: number; band: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  const color = rate >= 85 ? "text-hud" : rate >= 70 ? "text-primary" : rate >= 50 ? "text-secondary" : "text-destructive";

  return (
    <div className="relative w-56 h-56">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} stroke="currentColor" className="text-border" strokeWidth="6" fill="none" />
        <motion.circle
          cx="80" cy="80" r={r}
          stroke="currentColor" className={color}
          strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 50, damping: 16 }}
          style={{ filter: "drop-shadow(0 0 10px currentColor)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={`font-display font-black text-6xl ${color}`}>{rate}<span className="text-2xl">%</span></div>
          <div className={`mt-2 inline-block px-3 py-0.5 border font-mono uppercase tracking-widest text-[10px] ${color} border-current`}>
            {band}
          </div>
        </div>
      </div>
    </div>
  );
}
