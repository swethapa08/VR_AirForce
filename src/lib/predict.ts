// Cadet aptitude → pilot success-rate prediction (CNN + RF + LR ensemble).

export type PredictInput = {
  confidence: number;
  concentration: number;
  responsiveness: number;
  initiative: number;
  excitability: number;
  hearingSensitivity: number;
  bodySensitivity: number;
  cr: number;
  ip: number;
  pp: number;
  cognitiveTotal: number;
  cr1: number;
  mp: number;
  pp1: number;
  ip1: number;
  hg: number;
  h1: number;
  h2: number;
  act: number;
  motorTotal: number;
};

export type PredictResult = {
  rate: number;
  band: "Elite" | "Strong" | "Capable" | "At Risk";
  drivers: { label: string; impact: number }[];
};

export { predictSuccessAsync, loadEnsembleBundle, predictWithBundle } from "./ensemble-inference";

export const DEFAULT_INPUT: PredictInput = {
  confidence: 4,
  concentration: 4,
  responsiveness: 4,
  initiative: 4,
  excitability: 2,
  hearingSensitivity: 4,
  bodySensitivity: 4,
  cr: 3,
  ip: 3,
  pp: 3,
  cognitiveTotal: 32,
  cr1: 4,
  mp: 4,
  pp1: 4,
  ip1: 4,
  hg: 4,
  h1: 3,
  h2: 3,
  act: 4,
  motorTotal: 33,
};
