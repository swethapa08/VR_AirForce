"""
Train CNN + Random Forest + Logistic Regression on Virtuaero aptitude features.
Uses the same 20 inputs as the web form (no Control Number / axis columns).
Target: BehElim (0 = success, 1 = eliminated). Success rate = P(BehElim == 0).
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.layers import (
    Conv1D,
    Dense,
    Dropout,
    Flatten,
    MaxPooling1D,
)
from tensorflow.keras.models import Model, Sequential

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "Virtuaero_5000.csv"
ARTIFACT_DIR = ROOT / "artifacts"

FEATURE_COLUMNS = [
    "Confidence",
    "Concentration",
    "Responsiveness",
    "Initiative",
    "Excitability",
    "Hearing Sensitivity",
    "Body Sensitivity",
    "CR",
    "IP",
    "PP",
    "Total Score",
    "CR.1",
    "MP",
    "PP.1",
    "IP.1",
    "HG",
    "H1",
    "H2",
    "ACT",
    "Total Score.1",
]

TARGET_COLUMN = "BehElim"


def main() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    df = df.fillna(df[FEATURE_COLUMNS].mean(numeric_only=True))

    X = df[FEATURE_COLUMNS].astype(np.float64)
    y = df[TARGET_COLUMN].astype(np.int32)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    X_train_cnn = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
    X_test_cnn = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

    cnn_model = Sequential(
        [
            Conv1D(
                64,
                kernel_size=3,
                activation="relu",
                input_shape=(X_train.shape[1], 1),
            ),
            MaxPooling1D(pool_size=2),
            Dropout(0.3),
            Conv1D(128, kernel_size=3, activation="relu"),
            MaxPooling1D(pool_size=2),
            Flatten(),
            Dense(128, activation="relu"),
            Dropout(0.3),
            Dense(64, activation="relu"),
            Dense(1, activation="sigmoid"),
        ]
    )
    cnn_model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )

    cnn_model.fit(
        X_train_cnn,
        y_train,
        epochs=20,
        batch_size=32,
        validation_split=0.2,
        verbose=1,
    )

    # Keras 3: build graph before accessing .input
    _ = cnn_model(X_train_cnn[:1])
    feature_extractor = Model(
        inputs=cnn_model.inputs,
        outputs=cnn_model.layers[-2].output,
    )

    cnn_train_features = feature_extractor.predict(X_train_cnn, verbose=0)
    cnn_test_features = feature_extractor.predict(X_test_cnn, verbose=0)

    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
    )
    rf_model.fit(cnn_train_features, y_train)

    rf_train_probs = rf_model.predict_proba(cnn_train_features)
    rf_test_probs = rf_model.predict_proba(cnn_test_features)

    lr_model = LogisticRegression(max_iter=1000)
    lr_model.fit(rf_train_probs, y_train)

    # Success = class 0 (not eliminated)
    success_prob_test = lr_model.predict_proba(rf_test_probs)[:, 0]
    test_acc = np.mean((success_prob_test >= 0.5).astype(int) == (y_test == 0).astype(int))
    print(f"Held-out success-class accuracy (approx): {test_acc:.3f}")

    cnn_model.save(ARTIFACT_DIR / "cnn_model.keras")
    joblib.dump(feature_extractor, ARTIFACT_DIR / "feature_extractor.pkl")
    joblib.dump(rf_model, ARTIFACT_DIR / "random_forest.pkl")
    joblib.dump(lr_model, ARTIFACT_DIR / "logistic_regression.pkl")
    joblib.dump(scaler, ARTIFACT_DIR / "scaler.pkl")
    joblib.dump(FEATURE_COLUMNS, ARTIFACT_DIR / "feature_columns.pkl")

    print("All models saved to", ARTIFACT_DIR)


if __name__ == "__main__":
    main()
