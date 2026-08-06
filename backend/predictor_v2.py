"""
predictor_v2.py — loads the models exported by palakkad_gpu_complete.ipynb
and provides a single predict() function for the backend.

Priority:
  1. models_v2/  (exported from notebook, 89%+ accuracy, 34/150 features)
  2. model/      (old fallback, 5 features, ~85% accuracy)
"""

import os, json, warnings
import numpy as np
from pathlib import Path

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent
V2_DIR = BASE / "models_v2"
V1_DIR = BASE / "model"

# ── Global state ──────────────────────────────────────────────────────────
_loaded = False
_meta   = None
_scaler_dl  = None
_scaler_ml  = None
_feat_dl    = None
_feat_ml    = None
_ml_model   = None   # XGBoost or LightGBM
_dl_model   = None   # TorchScript BiLSTM (CPU)
_use_v2     = False

LABEL_NAMES = ["None", "Low", "High"]   # default; overridden from meta


def _load_v2():
    global _loaded, _meta, _scaler_dl, _scaler_ml, _feat_dl, _feat_ml
    global _ml_model, _dl_model, _use_v2, LABEL_NAMES

    if not V2_DIR.exists():
        return False

    meta_path = V2_DIR / "inference_meta.json"
    if not meta_path.exists():
        return False

    try:
        import joblib, torch

        with open(meta_path) as f:
            _meta = json.load(f)

        LABEL_NAMES = _meta.get("LABEL_NAMES", LABEL_NAMES)

        _scaler_dl = joblib.load(V2_DIR / "scaler_dl.joblib")
        _scaler_ml = joblib.load(V2_DIR / "scaler_ml.joblib")

        with open(V2_DIR / "feat_cols_dl.json") as f:
            _feat_dl = json.load(f)
        with open(V2_DIR / "feat_cols_ml.json") as f:
            _feat_ml = json.load(f)

        # Load best ML model (XGBoost preferred)
        for mname in ["XGBoost", "LightGBM", "Random_Forest"]:
            p = V2_DIR / f"{mname}.joblib"
            if p.exists():
                _ml_model = joblib.load(p)
                print(f"[predictor_v2] ML model: {mname}  "
                      f"Acc={_meta['accuracies'].get(mname.replace('_',' '), '?')}")
                break

        # Load best DL TorchScript model (CPU)
        best_dl = _meta.get("best_dl_model", "BiLSTM")
        ts_path = V2_DIR / f"best_dl_{best_dl}.pt"
        if ts_path.exists():
            _dl_model = torch.jit.load(str(ts_path), map_location="cpu")
            _dl_model.eval()
            print(f"[predictor_v2] DL model: {best_dl}  "
                  f"Acc={_meta['accuracies'].get(best_dl, '?')}")

        _use_v2 = True
        print(f"[predictor_v2] v2 models loaded — "
              f"DL={_meta['N_FEAT_DL']} features / ML={_meta['N_FEAT_ML']} features")
        return True

    except Exception as e:
        print(f"[predictor_v2] v2 load failed ({e}) — falling back to v1")
        return False


def _load_v1():
    global _loaded, _use_v2
    _use_v2 = False
    print("[predictor_v2] Using legacy v1 models (5 features)")


def load():
    global _loaded
    if _loaded:
        return
    if not _load_v2():
        _load_v1()
    _loaded = True


def is_v2_available() -> bool:
    load()
    return _use_v2


def get_model_info() -> dict:
    load()
    if _use_v2 and _meta:
        return {
            "version": "v2",
            "source": "palakkad_gpu_complete.ipynb",
            "n_feat_dl": _meta["N_FEAT_DL"],
            "n_feat_ml": _meta["N_FEAT_ML"],
            "best_dl":   _meta.get("best_dl_model"),
            "best_ml":   _meta.get("best_ml_model"),
            "accuracies": _meta.get("accuracies", {}),
            "label_names": LABEL_NAMES,
        }
    return {"version": "v1", "source": "backend/model/", "label_names": LABEL_NAMES}


def predict_from_sequence(sequence_30d: list, model: str = "auto") -> dict:
    """
    Predict crop stress from a 30-day weather sequence.

    Parameters
    ----------
    sequence_30d : list of dicts, length 30
        Each dict must contain the raw feature keys matching feat_cols_dl.
        Example keys: temperature_2m_mean, precipitation_mm, vpd_kpa, ...
    model : "dl" | "ml" | "auto"
        "auto" uses DL if available, else ML.

    Returns
    -------
    dict with keys: label (str), label_idx (int), probabilities (list),
                    confidence (float), model_used (str)
    """
    load()

    if not _use_v2:
        return _fallback_predict(sequence_30d)

    try:
        import torch

        # Build feature matrix: (30, N_FEAT_DL)
        rows = []
        for day in sequence_30d[-_meta["LOOKBACK"]:]:
            row = [float(day.get(f, 0.0)) for f in _feat_dl]
            rows.append(row)

        X = np.array(rows, dtype=np.float32)           # (30, N_FEAT_DL)
        X_scaled = _scaler_dl.transform(X)              # normalise
        seq = torch.tensor(X_scaled[np.newaxis], dtype=torch.float32)  # (1,30,N_FEAT_DL)

        use_dl = (model in ("dl", "auto")) and _dl_model is not None
        use_ml = (model == "ml") or (model == "auto" and not use_dl)

        if use_dl:
            with torch.no_grad():
                logits = _dl_model(seq)
                probs  = torch.softmax(logits, dim=-1).numpy()[0].tolist()
            idx   = int(np.argmax(probs))
            mused = f"DL-{_meta.get('best_dl_model','BiLSTM')}"
        elif use_ml and _ml_model is not None:
            # Use the last day's full feature set for ML (flat prediction)
            last_day = {f: float(sequence_30d[-1].get(f, 0.0)) for f in _feat_ml}
            X_ml = np.array([[last_day[f] for f in _feat_ml]], dtype=np.float32)
            X_ml_s = _scaler_ml.transform(X_ml)
            probs  = _ml_model.predict_proba(X_ml_s)[0].tolist()
            idx    = int(np.argmax(probs))
            mused  = f"ML-{_meta.get('best_ml_model','XGBoost')}"
        else:
            return _fallback_predict(sequence_30d)

        return {
            "label":       LABEL_NAMES[idx],
            "label_idx":   idx,
            "probabilities": probs,
            "confidence":  round(float(probs[idx]) * 100, 1),
            "model_used":  mused,
        }

    except Exception as e:
        print(f"[predictor_v2] predict error: {e}")
        return _fallback_predict(sequence_30d)


def _fallback_predict(sequence_30d: list) -> dict:
    """Rule-based fallback when no trained model is available."""
    if not sequence_30d:
        return {"label": "None", "label_idx": 0,
                "probabilities": [1.0, 0.0, 0.0], "confidence": 100.0,
                "model_used": "rule-based-fallback"}

    last = sequence_30d[-1]
    temp  = float(last.get("temperature_2m_mean", last.get("t2m_C", 28)))
    rain  = float(last.get("precipitation_mm",   last.get("tp_mm", 10)))
    vpd   = float(last.get("vpd_kpa", 1.5))

    # Simple rules based on Palakkad agro-climate knowledge
    stress_score = 0.0
    if temp > 36:   stress_score += 0.4
    elif temp > 33: stress_score += 0.2
    if rain < 1:    stress_score += 0.3
    elif rain < 5:  stress_score += 0.1
    if vpd > 3.5:   stress_score += 0.3
    elif vpd > 2.5: stress_score += 0.15

    if stress_score >= 0.6:
        probs = [0.05, 0.25, 0.70]
    elif stress_score >= 0.3:
        probs = [0.20, 0.55, 0.25]
    else:
        probs = [0.70, 0.25, 0.05]

    idx = int(np.argmax(probs))
    return {
        "label":       LABEL_NAMES[idx],
        "label_idx":   idx,
        "probabilities": probs,
        "confidence":  round(float(probs[idx]) * 100, 1),
        "model_used":  "rule-based-fallback",
    }
