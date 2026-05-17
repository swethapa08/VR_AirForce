import type { EnsembleBundle } from "./ensemble-types";
import type { PredictInput } from "./predict";

const INPUT_KEYS: (keyof PredictInput)[] = [
  "confidence",
  "concentration",
  "responsiveness",
  "initiative",
  "excitability",
  "hearingSensitivity",
  "bodySensitivity",
  "cr",
  "ip",
  "pp",
  "cognitiveTotal",
  "cr1",
  "mp",
  "pp1",
  "ip1",
  "hg",
  "h1",
  "h2",
  "act",
  "motorTotal",
];

let bundlePromise: Promise<EnsembleBundle> | null = null;

export function loadEnsembleBundle(): Promise<EnsembleBundle> {
  if (!bundlePromise) {
    bundlePromise = fetch("/models/ensemble.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load model bundle (${r.status})`);
        return r.json() as Promise<EnsembleBundle>;
      })
      .catch((err) => {
        bundlePromise = null;
        throw err;
      });
  }
  return bundlePromise;
}

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function conv1d(
  input: number[][],
  kernel: number[][][],
  bias: number[],
): number[][] {
  const kSize = kernel.length;
  const inCh = input[0].length;
  const filters = bias.length;
  const outLen = input.length - kSize + 1;
  const out: number[][] = [];

  for (let o = 0; o < outLen; o++) {
    const row = new Array(filters).fill(0);
    for (let f = 0; f < filters; f++) {
      let sum = bias[f];
      for (let k = 0; k < kSize; k++) {
        for (let c = 0; c < inCh; c++) {
          sum += input[o + k][c] * kernel[k][c][f];
        }
      }
      row[f] = relu(sum);
    }
    out.push(row);
  }
  return out;
}

function maxPool1d(input: number[][], pool: number): number[][] {
  const outLen = Math.floor(input.length / pool);
  const out: number[][] = [];
  for (let i = 0; i < outLen; i++) {
    const slice = input.slice(i * pool, i * pool + pool);
    const width = slice[0].length;
    const row = new Array(width).fill(-Infinity);
    for (const step of slice) {
      for (let c = 0; c < width; c++) {
        if (step[c] > row[c]) row[c] = step[c];
      }
    }
    out.push(row);
  }
  return out;
}

function flatten2d(input: number[][]): number[] {
  const flat: number[] = [];
  for (const step of input) flat.push(...step);
  return flat;
}

function dense(input: number[], kernel: number[][], bias: number[], activation: "relu" | "none"): number[] {
  const out = new Array(bias.length).fill(0);
  for (let u = 0; u < bias.length; u++) {
    let sum = bias[u] ?? 0;
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * (kernel[i]?.[u] ?? 0);
    }
    out[u] = activation === "relu" ? relu(sum) : sum;
  }
  return out;
}

function runCnn(bundle: EnsembleBundle, scaled: number[]): number[] {
  const [conv1, conv2, dense128, dense64] = bundle.cnn.layers;
  let x: number[][] = scaled.map((v) => [v]);

  x = conv1d(x, conv1.weights[0] as number[][][], conv1.weights[1] as number[]);
  x = maxPool1d(x, 2);
  x = conv1d(x, conv2.weights[0] as number[][][], conv2.weights[1] as number[]);
  x = maxPool1d(x, 2);
  const flat = flatten2d(x);
  const h128 = dense(flat, dense128.weights[0] as number[][], dense128.weights[1] as number[], "relu");
  return dense(h128, dense64.weights[0] as number[][], dense64.weights[1] as number[], "relu");
}

function walkTree(
  tree: EnsembleBundle["random_forest"]["trees"][0],
  features: number[],
  node = 0,
): number[] {
  const left = tree.children_left[node];
  const right = tree.children_right[node];
  if (left === -1) {
    return tree.value[node];
  }
  const idx = tree.feature[node];
  const thr = tree.threshold[node];
  if (features[idx] <= thr) return walkTree(tree, features, left);
  return walkTree(tree, features, right);
}

function rfPredictProba(bundle: EnsembleBundle, features: number[]): number[] {
  const nClasses = bundle.random_forest.n_classes;
  const sums = new Array(nClasses).fill(0);
  for (const tree of bundle.random_forest.trees) {
    const leaf = walkTree(tree, features);
    for (let c = 0; c < nClasses; c++) sums[c] += leaf[c] ?? 0;
  }
  const total = sums.reduce((a, b) => a + b, 0) || 1;
  return sums.map((v) => v / total);
}

function lrPredictProba(
  bundle: EnsembleBundle,
  rfProbs: number[],
): number[] {
  const { coef, intercept, classes } = bundle.logistic_regression;
  const row = coef[0] ?? [];
  let z = intercept[0] ?? 0;
  for (let j = 0; j < rfProbs.length; j++) z += (row[j] ?? 0) * rfProbs[j];
  const p1 = sigmoid(z);
  const p0 = 1 - p1;
  const probs = classes[0] === 0 ? [p0, p1] : [p1, p0];
  return probs;
}

function scaleInput(bundle: EnsembleBundle, input: PredictInput): number[] {
  const raw = INPUT_KEYS.map((k) => input[k]);
  return raw.map((v, i) => (v - bundle.scaler.mean[i]) / bundle.scaler.scale[i]);
}

function bandForRate(rate: number): "Elite" | "Strong" | "Capable" | "At Risk" {
  if (rate >= 85) return "Elite";
  if (rate >= 70) return "Strong";
  if (rate >= 50) return "Capable";
  return "At Risk";
}

function driversFromInput(bundle: EnsembleBundle, input: PredictInput, scaled: number[]) {
  const labelByKey = new Map(bundle.driver_weights.map((d) => [d.key, d.label]));
  return bundle.driver_weights
    .map((d, i) => ({
      label: labelByKey.get(d.key) ?? d.label,
      impact: d.weight * scaled[i],
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);
}

export function predictWithBundle(bundle: EnsembleBundle, input: PredictInput) {
  const scaled = scaleInput(bundle, input);
  const cnnFeatures = runCnn(bundle, scaled);
  const rfProbs = rfPredictProba(bundle, cnnFeatures);
  const lrProbs = lrPredictProba(bundle, rfProbs);
  const successIdx = bundle.logistic_regression.classes.indexOf(bundle.success_class);
  const successProb = lrProbs[successIdx >= 0 ? successIdx : 0];
  const rate = Math.max(1, Math.min(99, Math.round(successProb * 100)));

  return {
    rate,
    band: bandForRate(rate),
    drivers: driversFromInput(bundle, input, scaled),
  };
}

export async function predictSuccessAsync(input: PredictInput) {
  const bundle = await loadEnsembleBundle();
  return predictWithBundle(bundle, input);
}
