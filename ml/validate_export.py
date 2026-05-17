"""Compare Python artifacts vs exported JSON pipeline on a sample row."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

ROOT = Path(__file__).resolve().parent
BUNDLE = json.load(open(ROOT.parent / "public" / "models" / "ensemble.json"))

df = pd.read_csv(ROOT / "data" / "Virtuaero_5000.csv").iloc[0]
cols = BUNDLE["feature_columns"]
X = df[cols].astype(float).values.reshape(1, -1)

scaler = joblib.load(ROOT / "artifacts" / "scaler.pkl")
fe = joblib.load(ROOT / "artifacts" / "feature_extractor.pkl")
rf = joblib.load(ROOT / "artifacts" / "random_forest.pkl")
lr = joblib.load(ROOT / "artifacts" / "logistic_regression.pkl")

Xs = scaler.transform(X).reshape(1, -1, 1)
cnn_feat = fe.predict(Xs, verbose=0)
rf_probs = rf.predict_proba(cnn_feat)[0]
lr_probs = lr.predict_proba(rf_probs.reshape(1, -1))[0]
success = int(BUNDLE["success_class"])
rate = round(lr_probs[success] * 100)

print("Python success rate %:", rate)
print("RF probs:", rf_probs.tolist())
print("LR probs:", lr_probs.tolist())
