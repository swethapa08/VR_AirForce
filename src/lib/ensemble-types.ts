export type EnsembleBundle = {
  version: number;
  target: string;
  success_class: number;
  feature_columns: string[];
  feature_labels: { key: string; label: string }[];
  scaler: { mean: number[]; scale: number[] };
  cnn: {
    input_shape: number[];
    layers: {
      class: string;
      config: Record<string, unknown>;
      weights: number[][] | number[][][];
    }[];
  };
  random_forest: {
    n_classes: number;
    n_features: number;
    trees: {
      children_left: number[];
      children_right: number[];
      feature: number[];
      threshold: number[];
      value: number[][];
    }[];
  };
  logistic_regression: {
    coef: number[][];
    intercept: number[];
    classes: number[];
  };
  driver_weights: { key: string; label: string; weight: number }[];
};
