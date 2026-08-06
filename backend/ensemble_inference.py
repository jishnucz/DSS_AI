"""
Live ensemble inference using models trained in Palakkad_Ensemble_Forecasting.ipynb.

Lean variant: uses LightGBM (best individual at 86.39%) + XGBoost (second opinion).
Skips the 3 PyTorch DL models (no torch dependency).
Pulls live weather from Open-Meteo (free, no API key).

Exposes one entry point: `forecast_taluk(taluk)` returning a list of 8 daily forecasts
(today + next 7) with stress class, weather, advisory.
"""
from __future__ import annotations

import datetime as _dt
import json
import os
import warnings
from pathlib import Path
from typing import Any

# Quiet sklearn version-pickle warnings + XGBoost device warnings — models were
# trained on a slightly different env (sklearn 1.6, GPU XGBoost). Predictions
# are still correct, the warnings are noise.
warnings.filterwarnings("ignore", category=UserWarning,    module="sklearn")
warnings.filterwarnings("ignore", category=UserWarning,    module="xgboost")
warnings.filterwarnings("ignore", category=FutureWarning,  module="sklearn")
warnings.filterwarnings("ignore", message=".*InconsistentVersion.*")
warnings.filterwarnings("ignore", message=".*valid feature names.*")

import joblib
import numpy as np
import pandas as pd
import requests

# --------------------------------------------------------------------------- paths

BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT   = BACKEND_DIR.parent
NWP_DIR     = REPO_ROOT / "research_analysis" / "notebooks" / "Output_nwp"
MASTER_CSV  = REPO_ROOT / "research_analysis" / "data" / "extended" / "palakkad_master_extended.csv"
DOMAIN_DIR  = REPO_ROOT / "data"

# --------------------------------------------------------------------------- artefacts

_meta:        dict[str, Any] | None = None
_lgb:         Any = None
_xgb:         Any = None
_scaler_seq:  Any = None
_scaler_stat: Any = None
_master_df:   pd.DataFrame | None = None
_taluk_recent: dict[str, dict[str, float]] = {}
_taluk_static: dict[str, dict[str, float]] = {}
# District-wide averages — used as fallback when a requested taluk is not in
# the master CSV (e.g. Palakkad, Alathur, Ottapalam, Pattambi, Thrithala).
_global_recent: dict[str, float] = {}
_global_static: dict[str, float] = {}
_taluk_coords: dict[str, tuple[float, float]] = {}
_dominant_crop: dict[str, str] = {}

# Spelling mismatch: master uses "Mannarkkad", domain CSVs use "Mannarkad"
TALUK_ALIAS = {"Mannarkkad": "Mannarkad"}

# Feature engineering constants — must match the notebook exactly
LOOKBACK = 30
HORIZON  = 7
LABEL_NAMES = ["None", "Low", "High"]
FC, PWP = 0.28, 0.14
KC_BY_MONTH = {1: 0.90, 2: 0.82, 3: 0.68, 4: 0.62, 5: 0.70, 6: 0.88,
               7: 1.12, 8: 1.18, 9: 1.05, 10: 0.88, 11: 0.78, 12: 0.88}

RICE_SEASONS = {
    "Virippu":  {"sow_doy": 152, "stages": [(1, 15, "Germination"), (16, 50, "Vegetative"),
                                              (51, 75, "Flowering"), (76, 100, "GrainFilling"),
                                              (101, 110, "Maturity")]},
    "Mundakan": {"sow_doy": 274, "stages": [(1, 15, "Germination"), (16, 50, "Vegetative"),
                                              (51, 75, "Flowering"), (76, 100, "GrainFilling"),
                                              (101, 110, "Maturity")]},
}
STAGE_TO_IDX = {"None": 0, "Germination": 1, "Vegetative": 2,
                "Flowering": 3, "GrainFilling": 4, "Maturity": 5}
STAGE_NAMES_IDX = {v: k for k, v in STAGE_TO_IDX.items()}

OM_BASIC_VARS = ["temperature_2m_max", "temperature_2m_min", "precipitation_sum",
                 "et0_fao_evapotranspiration", "shortwave_radiation_sum",
                 "wind_speed_10m_max", "relative_humidity_2m_max",
                 "relative_humidity_2m_min", "uv_index_max"]

# Columns the Open-Meteo forecast endpoint doesn't reliably return — backfilled
# from per-taluk last-7-day climatology in the master CSV.
NEED_FROM_MASTER = [
    "vapour_pressure_deficit_max",
    "soil_moisture_0_to_7cm_mean",
    "soil_moisture_7_to_28cm_mean",
    "soil_moisture_28_to_100cm_mean",
    "soil_moisture_100_to_255cm_mean",
    "wind_speed_10m_mean",
]


def _load_meta() -> dict[str, Any]:
    global _meta
    if _meta is None:
        with open(NWP_DIR / "inference_meta.json", "r") as f:
            _meta = json.load(f)
    return _meta


def _load_master() -> pd.DataFrame:
    global _master_df, _taluk_recent, _taluk_static, _global_recent, _global_static
    if _master_df is not None:
        return _master_df
    df = pd.read_csv(MASTER_CSV)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["taluk", "date"]).reset_index(drop=True)
    _master_df = df

    static_cols = ["elevation_m", "soil_clay", "soil_sand", "soil_soc", "soil_cec"]
    for taluk, g in df.groupby("taluk"):
        last7 = g.sort_values("date").tail(7)
        _taluk_recent[taluk] = {c: float(last7[c].mean()) for c in NEED_FROM_MASTER if c in last7.columns}
        _taluk_static[taluk] = {c: float(g[c].iloc[0]) for c in static_cols if c in g.columns}

    # District-wide fallback values (mean over all taluks present in master)
    last7_all = df.sort_values("date").groupby("taluk").tail(7)
    _global_recent = {c: float(last7_all[c].mean()) for c in NEED_FROM_MASTER if c in df.columns}
    _global_static = {c: float(df[c].mean())        for c in static_cols       if c in df.columns}
    return df


def _load_domain():
    global _taluk_coords, _dominant_crop
    if _taluk_coords:
        return
    try:
        tm = pd.read_csv(DOMAIN_DIR / "palakkad_taluk_crop_map.csv")
        for _, r in tm.iterrows():
            _taluk_coords[r["taluk_name"]] = (float(r["latitude"]), float(r["longitude"]))
    except FileNotFoundError:
        pass
    _taluk_coords.setdefault("Kollengode",   (10.5923, 76.6878))
    _taluk_coords.setdefault("Kuzhalmannam", (10.8833, 76.6000))
    _taluk_coords.setdefault("Mannarkad",    (10.9869, 76.4717))

    try:
        cd = pd.read_csv(DOMAIN_DIR / "palakkad_crop_distribution.csv")
        for taluk, g in cd.groupby("taluk_name"):
            top = g.sort_values("area_hectares", ascending=False).iloc[0]
            _dominant_crop[taluk] = top["crop_name"]
    except FileNotFoundError:
        pass


def _t_alias(t: str) -> str:
    return TALUK_ALIAS.get(t, t)


def _coords_for(taluk: str) -> tuple[float, float]:
    _load_domain()
    return _taluk_coords.get(_t_alias(taluk), _taluk_coords.get(taluk, (10.78, 76.65)))


def _load_models():
    global _lgb, _xgb, _scaler_seq, _scaler_stat
    if _lgb is None:
        _lgb = joblib.load(NWP_DIR / "LightGBM.joblib")
    if _xgb is None:
        _xgb = joblib.load(NWP_DIR / "XGBoost.joblib")
        # Trained on GPU; predict on CPU to avoid device-mismatch warning every call
        try:
            _xgb.set_params(device="cpu")
        except Exception:
            pass
    if _scaler_seq is None:
        _scaler_seq = joblib.load(NWP_DIR / "scaler_seq.joblib")
    if _scaler_stat is None:
        _scaler_stat = joblib.load(NWP_DIR / "scaler_stat.joblib")


# --------------------------------------------------------------------------- open-meteo

def fetch_open_meteo(lat: float, lon: float, hist_days: int = 34, fc_days: int = 8,
                     timeout: int = 45) -> pd.DataFrame:
    today      = _dt.date.today()
    hist_start = (today - _dt.timedelta(days=hist_days)).isoformat()
    hist_end   = (today - _dt.timedelta(days=2)).isoformat()
    vars_str = ",".join(OM_BASIC_VARS)
    frames = []
    for url, params in [
        ("https://archive-api.open-meteo.com/v1/archive",
         {"start_date": hist_start, "end_date": hist_end, "daily": vars_str}),
        ("https://api.open-meteo.com/v1/forecast",
         {"daily": vars_str, "forecast_days": fc_days}),
    ]:
        r = requests.get(url, timeout=timeout, params={
            "latitude": lat, "longitude": lon,
            "timezone": "Asia/Kolkata", **params})
        r.raise_for_status()
        d = pd.DataFrame(r.json()["daily"])
        d["date"] = pd.to_datetime(d["time"])
        d.drop(columns=["time"], inplace=True)
        frames.append(d)
    combined = (pd.concat(frames).drop_duplicates("date")
                                  .sort_values("date").reset_index(drop=True))
    for c in OM_BASIC_VARS:
        combined[c] = combined[c].ffill().bfill()
    return combined


# --------------------------------------------------------------------------- feature pipeline

def _rice_stage(doy: int) -> int:
    for season, cfg in RICE_SEASONS.items():
        delta = (doy - cfg["sow_doy"]) % 365 + 1
        for s, e, name in cfg["stages"]:
            if s <= delta <= e:
                return STAGE_TO_IDX[name]
    return 0


def _add_features(d: pd.DataFrame) -> pd.DataFrame:
    d = d.sort_values("date").reset_index(drop=True).copy()
    d["heat_stress"] = np.clip((d["temperature_2m_max"] - 35.0) / 10.0, 0, 1)
    d["rain_7d"]     = (d["precipitation_sum"].shift(1).fillna(0)
                                              .rolling(7, min_periods=1).sum())
    rain = d["precipitation_sum"].values
    dry, s = np.zeros(len(rain), dtype=np.float32), 0
    for i, r in enumerate(rain):
        s = s + 1 if r < 1 else 0
        dry[i] = s
    d["dry_streak"] = dry
    months = d["date"].dt.month.values
    d["crop_et"] = d["et0_fao_evapotranspiration"].values * \
                   np.array([KC_BY_MONTH[m] for m in months], dtype=np.float32)
    d["vpd_x_heat"]  = d["vapour_pressure_deficit_max"] * d["heat_stress"]
    d["sm_gradient"] = d["soil_moisture_100_to_255cm_mean"] - d["soil_moisture_0_to_7cm_mean"]
    d["sin_doy"] = np.sin(2 * np.pi * d["date"].dt.dayofyear / 365)
    d["cos_doy"] = np.cos(2 * np.pi * d["date"].dt.dayofyear / 365)
    return d


def _run_swb(et0: np.ndarray, rain: np.ndarray, months: np.ndarray,
             init: float | None = None) -> np.ndarray:
    s = FC if init is None else float(init)
    out = np.empty(len(et0), dtype=np.float32)
    for i in range(len(et0)):
        kc  = KC_BY_MONTH[int(months[i])]
        etc = float(et0[i]) * kc
        s   = s + float(rain[i]) - etc
        s   = min(FC, max(PWP, s))
        out[i] = (s - PWP) / (FC - PWP)
    return out


def _backfill(api_df: pd.DataFrame, taluk: str) -> pd.DataFrame:
    # Per-taluk values when available, else district-wide global average.
    fills = {**_global_recent, **_taluk_recent.get(taluk, {})}
    for col, val in fills.items():
        if col not in api_df.columns:
            api_df[col] = val
        else:
            api_df[col] = api_df[col].fillna(val)
    statics = {**_global_static, **_taluk_static.get(taluk, {})}
    for col, val in statics.items():
        api_df[col] = val
    return api_df


# --------------------------------------------------------------------------- advisory

def _advise(stress: str, conf: float, tmax: float, tmin: float, rain: float,
            swb: float, stage_idx: int, crop: str) -> str:
    msgs: list[str] = []
    if stress == "High":
        msgs.append(f"HIGH stress predicted ({conf * 100:.0f}% confidence)")
    elif stress == "Low":
        msgs.append(f"LOW stress emerging ({conf * 100:.0f}%)")
    else:
        msgs.append(f"Normal conditions ({conf * 100:.0f}%)")
    if tmax > 36:
        msgs.append(f"heat alert: Tmax={tmax:.1f}°C (>36° stress)")
    if rain > 40:
        msgs.append(f"heavy rain: {rain:.0f}mm (flood risk)")
    elif rain < 1 and swb < 0.4:
        msgs.append(f"dry + low SWB ({swb:.2f}): irrigate")

    stage = STAGE_NAMES_IDX.get(stage_idx, "None")
    if "Rice" in (crop or ""):
        if stage == "Flowering":
            if tmax > 35:
                msgs.append("Flowering + Tmax>35°C: maintain 7 cm standing water, no N top-dress")
            else:
                msgs.append("Flowering: maintain 5–7 cm standing water")
        elif stage == "GrainFilling" and swb < 0.4:
            msgs.append("Grain-filling + drought: supplementary irrigation on 2-day cycle")
        elif stage == "Vegetative" and stress != "None":
            msgs.append("Vegetative stress: delay mid-season top-dress 3 days")
        elif stage == "Germination" and rain > 30:
            msgs.append("Germination + heavy rain: drain field to avoid seed rot")
    if "Coconut" in (crop or "") and stress == "High":
        msgs.append("Coconut: 280 L/palm + 10 cm mulch")
    if "Banana" in (crop or "") and stress == "High":
        msgs.append("Banana: 70–80 L/plant, remove old leaves")
    if "Sugarcane" in (crop or "") and stress != "None" and stage == "Vegetative":
        msgs.append("Sugarcane grand-growth water stress: irrigate now")
    return " | ".join(msgs)


# --------------------------------------------------------------------------- main entry

def forecast_taluk(taluk: str) -> dict[str, Any]:
    """
    Pull live Open-Meteo data, build features, predict 8 days of stress for `taluk`.

    Returns:
        {
            "taluk":      "Chittur",
            "source":     "API" | "MASTER_CSV",
            "model":      "LightGBM",
            "as_of":      "2026-05-13",
            "rows": [
                {date, days_ahead, tmax, tmin, rain, swb, stress_lbl, confidence,
                 p_none, p_low, p_high, rice_stage, stage_name, crop, advisory,
                 forecast_source},
                ... 8 rows
            ]
        }
    """
    _load_master()
    _load_domain()
    _load_models()
    meta = _load_meta()

    crop = _dominant_crop.get(_t_alias(taluk), "Rice (Paddy)")
    static_cols = meta["STATIC_COLS"]

    # 1. Get the 30-day input window + 7-day future weather
    used_source = "MASTER_CSV"
    api_df = None
    try:
        lat, lon = _coords_for(taluk)
        api_df = fetch_open_meteo(lat, lon)
        api_df = _backfill(api_df, taluk)
        used_source = "API"
    except Exception:
        # Fall back to master CSV's last 30 rows + Seq2Seq-less synthetic future
        sub = _master_df[_master_df["taluk"] == taluk].sort_values("date").tail(LOOKBACK + HORIZON).copy()
        api_df = sub
        if "source" not in api_df.columns:
            api_df["source"] = "history"

    api_df = api_df.copy()
    if "source" not in api_df.columns:
        # Mark first hist_days rows as history, rest as forecast based on today
        today = pd.Timestamp(_dt.date.today())
        api_df["source"] = np.where(api_df["date"] < today, "history", "forecast")

    # Ensure static taluk fields are present
    _taluk_st_local = {**_global_static, **_taluk_static.get(taluk, {})}
    for c in static_cols:
        if c not in api_df.columns and c in _taluk_st_local:
            api_df[c] = _taluk_st_local[c]

    # 2. Engineer features (including SWB forward simulation)
    api_df = _add_features(api_df)
    months = api_df["date"].dt.month.values
    init_swb = FC  # could thread from master, but FC is fine for short windows
    api_df["swb_norm"] = _run_swb(api_df["et0_fao_evapotranspiration"].values,
                                  api_df["precipitation_sum"].values, months, init_swb)

    # 3. Pick the LOOKBACK rows ending at "today" and the next HORIZON rows
    today = pd.Timestamp(_dt.date.today())
    today_idx = api_df.index[api_df["date"] >= today]
    if len(today_idx) == 0:
        base_idx = len(api_df) - 1 - HORIZON
    else:
        base_idx = int(today_idx[0])

    # 4. Predict for today + 7 future days
    feat_cols   = meta["FEAT_COLS"]
    ml_feat_names = meta["ML_FEAT_NAMES"]
    # Prefer per-taluk static fields, fall back to district average for taluks not in master.
    _taluk_st = _taluk_static.get(taluk, {})
    static_vec = np.array(
        [_taluk_st.get(c, _global_static.get(c, 0.0)) for c in static_cols],
        dtype=np.float32,
    )
    static_s   = _scaler_stat.transform(static_vec[np.newaxis])[0]

    rows: list[dict[str, Any]] = []
    for d in range(HORIZON + 1):  # 0..7
        end = base_idx + d
        start = end - LOOKBACK + 1
        if start < 0 or end >= len(api_df):
            continue
        win = api_df.iloc[start:end + 1][feat_cols].values.astype(np.float32)
        win_s = _scaler_seq.transform(win)
        flat = np.concatenate([win_s[-1], static_s])

        probs_lgb = _lgb.predict_proba(flat[np.newaxis])[0]
        probs_xgb = _xgb.predict_proba(flat[np.newaxis])[0]
        # 50/50 of the two ML models — both validated, gives a smoother probability
        probs = 0.6 * probs_lgb + 0.4 * probs_xgb
        idx = int(probs.argmax())

        row_w = api_df.iloc[end]
        stage_idx = _rice_stage(int(row_w["date"].dayofyear))

        # Auxiliary weather fields for the UI weather card.
        # Open-Meteo daily endpoint returns wind speeds in km/h by default, so
        # no unit conversion is needed.
        wind_kmh = (float(row_w["wind_speed_10m_max"])
                    if "wind_speed_10m_max" in row_w and pd.notna(row_w["wind_speed_10m_max"])
                    else (float(row_w["wind_speed_10m_mean"])
                          if "wind_speed_10m_mean" in row_w and pd.notna(row_w["wind_speed_10m_mean"])
                          else None))
        rh_max = float(row_w["relative_humidity_2m_max"]) if "relative_humidity_2m_max" in row_w and pd.notna(row_w["relative_humidity_2m_max"]) else None
        rh_min = float(row_w["relative_humidity_2m_min"]) if "relative_humidity_2m_min" in row_w and pd.notna(row_w["relative_humidity_2m_min"]) else None
        rh_mean = round((rh_max + rh_min) / 2, 1) if (rh_max is not None and rh_min is not None) else None
        uv     = float(row_w["uv_index_max"]) if "uv_index_max" in row_w and pd.notna(row_w["uv_index_max"]) else None

        rows.append({
            "date":        row_w["date"].date().isoformat(),
            "days_ahead":  d,
            "tmax":        float(row_w["temperature_2m_max"]),
            "tmin":        float(row_w["temperature_2m_min"]),
            "rain":        float(row_w["precipitation_sum"]),
            "swb":         float(row_w["swb_norm"]),
            "wind_kmh":    round(wind_kmh, 1) if wind_kmh is not None else None,
            "humidity":    rh_mean,
            "uv_index":    round(uv, 1) if uv is not None else None,
            "stress_idx":  idx,
            "stress_lbl":  LABEL_NAMES[idx],
            "p_none":      float(probs[0]),
            "p_low":       float(probs[1]),
            "p_high":      float(probs[2]),
            "confidence":  float(probs.max()),
            "rice_stage":  stage_idx,
            "stage_name":  STAGE_NAMES_IDX[stage_idx],
            "crop":        crop,
            "advisory":    _advise(LABEL_NAMES[idx], float(probs.max()),
                                    float(row_w["temperature_2m_max"]),
                                    float(row_w["temperature_2m_min"]),
                                    float(row_w["precipitation_sum"]),
                                    float(row_w["swb_norm"]),
                                    stage_idx, crop),
            "forecast_source": str(row_w.get("source", "history")),
        })
    return {
        "taluk":  taluk,
        "source": used_source,
        "model":  "LightGBM + XGBoost (60/40)",
        "as_of":  _dt.date.today().isoformat(),
        "rows":   rows,
    }


def forecast_all_taluks() -> dict[str, Any]:
    _load_master()
    taluks = sorted(_master_df["taluk"].unique())
    out = []
    errors = []
    for t in taluks:
        try:
            out.append(forecast_taluk(t))
        except Exception as e:
            errors.append({"taluk": t, "error": str(e)})
    return {"taluks": out, "errors": errors,
            "as_of": _dt.date.today().isoformat()}


def model_info() -> dict[str, Any]:
    """Return the trained-model accuracies and ensemble weights for the dashboard."""
    meta = _load_meta()
    try:
        with open(NWP_DIR / "ensemble_kind.json", "r") as f:
            ek = json.load(f)
    except FileNotFoundError:
        ek = {}
    return {
        "models": [
            {"name": "GRU",          "type": "RNN",         "test_acc": meta["individual_acc"]["GRU"]},
            {"name": "BiLSTM",       "type": "RNN+Attn",    "test_acc": meta["individual_acc"]["BiLSTM"]},
            {"name": "PatchTST",     "type": "Transformer", "test_acc": meta["individual_acc"]["PatchTST"]},
            {"name": "RandomForest", "type": "Ensemble ML", "test_acc": meta["individual_acc"]["RandomForest"]},
            {"name": "XGBoost",      "type": "GBM",         "test_acc": meta["individual_acc"]["XGBoost"]},
            {"name": "LightGBM",     "type": "GBM",         "test_acc": meta["individual_acc"]["LightGBM"]},
        ],
        "ensemble": {
            "kind":     ek.get("kind", "stacking"),
            "test_acc": ek.get("final_test_acc", meta.get("ensemble_acc")),
            "test_f1":  ek.get("final_test_f1",  meta.get("ensemble_f1")),
            "weights":  dict(zip(meta["ensemble_names"], meta["ensemble_weights"])),
        },
        "live_inference": "LightGBM + XGBoost (60/40)",
        "feature_count": {"sequence": meta["N_FEAT"], "ml_flat": meta["N_FEAT_ML"]},
        "thresholds": {"csi_q33": meta["CSI_Q33"], "csi_q67": meta["CSI_Q67"]},
        "trained_date": meta.get("trained_date"),
    }


if __name__ == "__main__":
    # Quick CLI sanity check
    import sys, pprint
    taluk = sys.argv[1] if len(sys.argv) > 1 else "Chittur"
    pprint.pp(forecast_taluk(taluk))
