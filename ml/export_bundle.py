"""
Export trained artifacts to public/models/ensemble.json for browser inference.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression as SkLogisticRegression
from tensorflow.keras.models import load_model

ROOT = Path(__file__).resolve().parent
ARTIFACT_DIR = ROOT / "artifacts"
OUT_PATH = ROOT.parent / "public" / "models" / "ensemble.json"


def _tolist(x: np.ndarray) -> list:
    return np.asarray(x, dtype=np.float64).tolist()


def export_cnn(cnn_model) -> dict:
    layers = []
    for layer in cnn_model.layers:
        weights = layer.get_weights()
        if not weights:
            continue
        entry: dict = {"class": layer.__class__.__name__, "config": layer.get_config()}
        if len(weights) == 1:
            entry["weights"] = [_tolist(weights[0])]
        else:
            entry["weights"] = [_tolist(weights[0]), _tolist(weights[1])]
        layers.append(entry)
    return {"layers": layers, "input_shape": list(cnn_model.input_shape[1:])}


def export_rf(rf_model) -> dict:
    trees = []
    for est in rf_model.estimators_:
        t = est.tree_
        trees.append(
            {
                "children_left": t.children_left.tolist(),
                "children_right": t.children_right.tolist(),
                "feature": t.feature.tolist(),
                "threshold": t.threshold.tolist(),
                "value": t.value.reshape(-1, t.value.shape[-1]).tolist(),
            }
        )
    return {
        "n_classes": int(rf_model.n_classes_),
        "n_features": int(rf_model.n_features_in_),
        "trees": trees,
    }


def export_lr(lr_model) -> dict:
    return {
        "coef": _tolist(lr_model.coef_),
        "intercept": _tolist(lr_model.intercept_),
        "classes": lr_model.classes_.tolist(),
    }


def export_scaler(scaler) -> dict:
    return {
        "mean": _tolist(scaler.mean_),
        "scale": _tolist(scaler.scale_),
    }


def export_feature_labels() -> list[dict]:
    return [
        {"key": "confidence", "label": "Confidence"},
        {"key": "concentration", "label": "Concentration"},
        {"key": "responsiveness", "label": "Responsiveness"},
        {"key": "initiative", "label": "Initiative"},
        {"key": "excitability", "label": "Excitability"},
        {"key": "hearingSensitivity", "label": "Hearing Sensitivity"},
        {"key": "bodySensitivity", "label": "Body Sensitivity"},
        {"key": "cr", "label": "CR"},
        {"key": "ip", "label": "IP"},
        {"key": "pp", "label": "PP"},
        {"key": "cognitiveTotal", "label": "Total Score"},
        {"key": "cr1", "label": "CR.1"},
        {"key": "mp", "label": "MP"},
        {"key": "pp1", "label": "PP.1"},
        {"key": "ip1", "label": "IP.1"},
        {"key": "hg", "label": "HG"},
        {"key": "h1", "label": "H1"},
        {"key": "h2", "label": "H2"},
        {"key": "act", "label": "ACT"},
        {"key": "motorTotal", "label": "Total Score.1"},
    ]


def export_driver_weights(scaler, feature_columns) -> list[dict]:
    """Linear proxy on raw aptitude features for UI driver labels."""
    df = pd.read_csv(ROOT / "data" / "Virtuaero_5000.csv")
    df = df.fillna(df[feature_columns].mean(numeric_only=True))
    X = scaler.transform(df[feature_columns].astype(np.float64))
    y = df["BehElim"].astype(np.int32)
    proxy = SkLogisticRegression(max_iter=1000)
    proxy.fit(X, y)
    labels = export_feature_labels()
    weights = proxy.coef_[0].tolist()
    return [
        {"key": labels[i]["key"], "label": labels[i]["label"], "weight": weights[i]}
        for i in range(len(labels))
    ]


def main() -> None:
    cnn_model = load_model(ARTIFACT_DIR / "cnn_model.keras")
    rf_model = joblib.load(ARTIFACT_DIR / "random_forest.pkl")
    lr_model = joblib.load(ARTIFACT_DIR / "logistic_regression.pkl")
    scaler = joblib.load(ARTIFACT_DIR / "scaler.pkl")
    feature_columns = joblib.load(ARTIFACT_DIR / "feature_columns.pkl")

    bundle = {
        "version": 1,
        "target": "BehElim",
        "success_class": 0,
        "feature_columns": feature_columns,
        "feature_labels": export_feature_labels(),
        "scaler": export_scaler(scaler),
        "cnn": export_cnn(cnn_model),
        "random_forest": export_rf(rf_model),
        "logistic_regression": export_lr(lr_model),
        "driver_weights": export_driver_weights(scaler, feature_columns),
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(bundle, f)

    size_mb = OUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT_PATH} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
