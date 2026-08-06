"""
Enhanced Decision Support System (DSS) Engine for Palakkad Agriculture
=========================================================================
- Uses LSTM model (lstm_model.h5) for AI-based stress prediction
- Integrates crop-specific stress thresholds
- Provides region/taluk-specific recommendations
- Connects with image classifier for health-based analysis
- Multi-day forecast with actionable insights
"""

import warnings
# Suppress scikit-learn version mismatch warnings early at module load
warnings.filterwarnings('ignore', category=Warning, module='sklearn.*')

import numpy as np
import joblib
import requests
import csv
import os
import pandas as pd
from tensorflow.keras.models import load_model
from datetime import datetime, timedelta
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier, ExtraTreesClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
import pickle

# Try to import XGBoost (optional but powerful)
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    print("⚠️ XGBoost not installed. Install with: pip install xgboost")
    XGBOOST_AVAILABLE = False

# Try to import Research AI for advanced analysis
try:
    import research_ai
    RESEARCH_AI_AVAILABLE = True
except ImportError:
    RESEARCH_AI_AVAILABLE = False
    print("⚠️ Research AI not available - running without advanced analysis")

# -----------------------------
# LOAD AI MODEL + SCALER
# (LSTM model trained on climate-crop data)
# -----------------------------
model = load_model("model/lstm_model.h5")

# Load scaler with fallback to create new one if missing
try:
    scaler = joblib.load("model/scaler.save")
except FileNotFoundError:
    print("⚠️ Scaler not found - will be created during model training")
    scaler = StandardScaler()
    # Fit with default Palakkad ranges so it works until models are trained
    default_data = np.array([
        [30, 10, 0.35, 10, 1010],  # Normal
        [36, 0, 0.20, 15, 1015],   # High stress
        [25, 50, 0.50, 25, 1000],  # Monsoon
    ])
    scaler.fit(default_data)

features = ['t2m_C', 'tp_mm', 'swvl1', 'wind_speed', 'sp_hpa']

# -----------------------------
# ERA5 DATA LOADING (Real Historical Data)
# -----------------------------
ERA5_DIR = Path(__file__).parent.parent / "data" / "ERA5"

def load_era5_training_data():
    """Load and preprocess ERA5 historical data for Palakkad
    
    Returns training features and labels based on REAL historical weather.
    Labels are assigned based on rice stress thresholds:
    - Normal (0): Temp 24-30°C, adequate soil moisture, moderate rain
    - Low Stress (1): Slightly warm (30-33°C) or dry, manageable conditions
    - High Stress (2): Hot (>33°C), very dry soil (<0.15), or extreme rain
    """
    try:
        # Load ERA5 datasets
        temp_df = pd.read_csv(ERA5_DIR / "reanalysis-era5-land-timeseries-sfc-2m-temperaturemx_b1ro7.csv")
        soil_df = pd.read_csv(ERA5_DIR / "reanalysis-era5-land-timeseries-sfc-soil-waterjlfxuawa.csv")
        precip_df = pd.read_csv(ERA5_DIR / "reanalysis-era5-land-timeseries-sfc-pressure-precipitation05uwyv98.csv")
        wind_df = pd.read_csv(ERA5_DIR / "reanalysis-era5-land-timeseries-sfc-windxhk_ehjo.csv")
        
        # Convert valid_time to datetime
        temp_df['valid_time'] = pd.to_datetime(temp_df['valid_time'])
        soil_df['valid_time'] = pd.to_datetime(soil_df['valid_time'])
        precip_df['valid_time'] = pd.to_datetime(precip_df['valid_time'])
        wind_df['valid_time'] = pd.to_datetime(wind_df['valid_time'])
        
        # Merge all datasets on valid_time
        df = temp_df[['valid_time', 't2m']].copy()
        df = df.merge(soil_df[['valid_time', 'swvl1']], on='valid_time', how='inner')
        df = df.merge(precip_df[['valid_time', 'sp', 'tp']], on='valid_time', how='inner')
        df = df.merge(wind_df[['valid_time', 'u10', 'v10']], on='valid_time', how='inner')
        
        # Calculate derived features
        df['t2m_C'] = df['t2m'] - 273.15  # Kelvin to Celsius
        df['wind_speed'] = np.sqrt(df['u10']**2 + df['v10']**2) * 3.6  # m/s to km/h
        df['tp_mm'] = df['tp'] * 1000  # meters to mm
        df['sp_hpa'] = df['sp'] / 100  # Pa to hPa
        
        # Get month for seasonal context
        df['month'] = df['valid_time'].dt.month
        
        # Sample to reduce memory (use daily averages for the last 20 years)
        df = df[df['valid_time'] >= '2005-01-01']
        
        # Resample to daily for training (reduce 666k to ~7k rows)
        df['date'] = df['valid_time'].dt.date
        daily = df.groupby('date').agg({
            't2m_C': ['mean', 'max', 'min'],
            'tp_mm': 'sum',
            'swvl1': 'mean',
            'wind_speed': 'mean',
            'sp_hpa': 'mean',
            'month': 'first'
        }).reset_index()
        daily.columns = ['date', 't2m_mean', 't2m_max', 't2m_min', 'tp_mm', 'swvl1', 'wind_speed', 'sp_hpa', 'month']
        
        # Use max temp for stress assessment (worst case during day)
        daily['t2m_C'] = daily['t2m_max']
        
        # Create stress labels based on rice thresholds
        # 0 = Normal, 1 = Low Stress, 2 = High Stress
        # RELAXED thresholds to capture more high stress cases matching real-world
        def assign_stress_label(row):
            temp = row['t2m_C']
            soil = row['swvl1']
            rain = row['tp_mm']
            month = row['month']
            
            # HIGH STRESS conditions (Class 2) - EXPANDED!
            # Today's conditions: 34°C + 6% soil moisture = HIGH STRESS
            if soil < 0.15:  # Critically dry soil (<15% volumetric) - HIGH STRESS
                return 2
            if temp > 35:  # Very hot day  
                return 2
            if temp > 33 and soil < 0.25:  # Hot + dry combination
                return 2
            if temp > 32 and soil < 0.20:  # Warm + very dry
                return 2
            if rain > 60:  # Flood conditions
                return 2
            if month in [3, 4, 5] and temp > 32 and rain < 5:  # Hot dry summer
                return 2
                
            # LOW STRESS conditions (Class 1)
            if temp > 30 or temp < 22:  # Warm or cool
                return 1
            if soil < 0.28 or soil > 0.48:  # Dry-ish or slightly wet
                return 1
            if rain > 30 and rain <= 60:  # Heavy rain
                return 1
            if rain < 2 and month in [2, 3, 4, 5, 6] and temp > 28:  # Dry warm
                return 1
                
            # Normal conditions (Class 0) - optimal rice conditions
            return 0
        
        daily['stress_label'] = daily.apply(assign_stress_label, axis=1)
        
        # Prepare features array
        X = daily[['t2m_C', 'tp_mm', 'swvl1', 'wind_speed', 'sp_hpa']].values
        y = daily['stress_label'].values
        
        # Count before balancing
        normal_count = (y == 0).sum()
        low_count = (y == 1).sum()
        high_count = (y == 2).sum()
        
        print(f"✅ Loaded ERA5 data: {len(daily)} daily samples")
        print(f"   Class distribution - Normal: {normal_count}, Low: {low_count}, High: {high_count}")
        
        # BALANCE CLASSES: Oversample high stress to match majority
        # This is critical for model to learn high stress patterns!
        if high_count < max(normal_count, low_count) // 2:
            from sklearn.utils import resample
            
            # Separate classes
            X_normal = X[y == 0]
            X_low = X[y == 1]
            X_high = X[y == 2]
            
            y_normal = y[y == 0]
            y_low = y[y == 1]
            y_high = y[y == 2]
            
            # Oversample high stress with small variation
            target_count = max(normal_count, low_count) // 2  # Make it at least 50% of largest
            if high_count > 0:
                X_high_oversampled = resample(X_high, replace=True, n_samples=target_count, random_state=42)
                # Add small random noise to oversampled data
                noise = np.random.normal(0, 0.1, X_high_oversampled.shape)
                X_high_oversampled = X_high_oversampled + noise
                y_high_oversampled = np.full(target_count, 2)
                
                X = np.vstack([X_normal, X_low, X_high_oversampled])
                y = np.concatenate([y_normal, y_low, y_high_oversampled])
                
                print(f"   After balancing - Normal: {len(y_normal)}, Low: {len(y_low)}, High: {len(y_high_oversampled)}")
        
        return X, y
        
    except Exception as e:
        print(f"⚠️ ERA5 load failed: {e}")
        return None, None


# -----------------------------
# ENSEMBLE MODELS (Additional Safety)
# Random Forest + Gradient Boosting + MLP
# -----------------------------
MODEL_DIR = Path(__file__).parent / "model"

def create_and_save_ensemble_models():
    """Create and save ensemble models with Palakkad-specific training data
    
    PRIORITY: Use real ERA5 historical data if available.
    FALLBACK: Use synthetic training data based on Palakkad climate patterns.
    
    Training data based on ACTUAL Palakkad, Kerala conditions:
    - Monsoon (June-Sept): 26-30°C, high rain, 80%+ humidity - OPTIMAL for rice
    - Post-monsoon (Oct-Nov): 27-31°C, moderate rain - GOOD
    - Winter (Dec-Jan): 24-30°C, low rain, moderate humidity - GOOD
    - Summer (Feb-May): 32-38°C, no rain, 30-50% humidity - STRESSFUL
    
    Rice optimal: 24-30°C, soil moisture 32-42%, humidity 65-80%
    """
    
    # Try to load real ERA5 data first
    era5_X, era5_y = load_era5_training_data()
    
    if era5_X is not None and len(era5_X) > 1000:
        print("🌍 Using REAL ERA5 historical data for model training!")
        X_train = era5_X
        y_train = era5_y
    else:
        print("📊 Using synthetic training data (ERA5 not available)")
        # Fall back to synthetic data generation
        np.random.seed(42)
        n_per_class = 2000  # More samples for better learning
    
        # ========================================
        # NORMAL CONDITIONS (class 0) - Monsoon/Post-monsoon optimal
        # ========================================
        # Monsoon season - ideal for rice (June-Sept Palakkad)
        normal_monsoon = np.column_stack([
            np.random.uniform(25, 29, n_per_class // 3),      # t2m_C - optimal monsoon temp
            np.random.uniform(8, 20, n_per_class // 3),       # tp_mm - good monsoon rain
            np.random.uniform(0.35, 0.42, n_per_class // 3),  # swvl1 - well-watered soil
            np.random.uniform(4, 12, n_per_class // 3),       # wind_speed - light
            np.random.uniform(1005, 1012, n_per_class // 3),  # sp_hpa
        ])
    
        # Post-monsoon - still good (Oct-Nov)
        normal_postmonsoon = np.column_stack([
            np.random.uniform(26, 30, n_per_class // 3),      # t2m_C
            np.random.uniform(4, 12, n_per_class // 3),       # tp_mm - moderate rain
            np.random.uniform(0.32, 0.40, n_per_class // 3),  # swvl1
            np.random.uniform(3, 10, n_per_class // 3),       # wind_speed
            np.random.uniform(1008, 1015, n_per_class // 3),  # sp_hpa
        ])
    
        # Winter - cool mornings, warm days (Dec-Jan)
        normal_winter = np.column_stack([
            np.random.uniform(24, 28, n_per_class // 3),      # t2m_C - pleasant
            np.random.uniform(0, 5, n_per_class // 3),        # tp_mm - low rain
            np.random.uniform(0.30, 0.38, n_per_class // 3),  # swvl1 - ok if irrigated
            np.random.uniform(2, 8, n_per_class // 3),        # wind_speed - calm
            np.random.uniform(1012, 1018, n_per_class // 3),  # sp_hpa - high pressure
        ])
    
        normal_data = np.vstack([normal_monsoon, normal_postmonsoon, normal_winter])
    
        # ========================================
        # LOW STRESS CONDITIONS (class 1) - Early summer, variable weather
        # ========================================
        # Early summer / late winter - getting warm (Feb early)
        low_stress_earlysummer = np.column_stack([
            np.random.uniform(28, 32, n_per_class // 4),      # t2m_C - warm but not extreme
            np.random.uniform(0, 6, n_per_class // 4),        # tp_mm - low rain
            np.random.uniform(0.28, 0.35, n_per_class // 4),  # swvl1 - slightly dry
            np.random.uniform(6, 15, n_per_class // 4),       # wind_speed
            np.random.uniform(1008, 1015, n_per_class // 4),  # sp_hpa
        ])
    
        # Slightly dry conditions with irrigation
        low_stress_irrigated = np.column_stack([
            np.random.uniform(29, 33, n_per_class // 4),      # t2m_C - warm
            np.random.uniform(0, 3, n_per_class // 4),        # tp_mm - no rain
            np.random.uniform(0.30, 0.36, n_per_class // 4),  # swvl1 - maintained by irrigation
            np.random.uniform(8, 18, n_per_class // 4),       # wind_speed
            np.random.uniform(1005, 1015, n_per_class // 4),  # sp_hpa
        ])
    
        # Heavy monsoon rain (not optimal but manageable)
        low_stress_heavyrain = np.column_stack([
            np.random.uniform(25, 28, n_per_class // 4),      # t2m_C - monsoon temp
            np.random.uniform(25, 45, n_per_class // 4),      # tp_mm - heavy rain
            np.random.uniform(0.42, 0.52, n_per_class // 4),  # swvl1 - very wet
            np.random.uniform(12, 25, n_per_class // 4),      # wind_speed - windy
            np.random.uniform(998, 1008, n_per_class // 4),   # sp_hpa - low pressure
        ])
    
        # Slightly cool conditions
        low_stress_cool = np.column_stack([
            np.random.uniform(20, 24, n_per_class // 4),      # t2m_C - cool
            np.random.uniform(2, 10, n_per_class // 4),       # tp_mm
            np.random.uniform(0.30, 0.40, n_per_class // 4),  # swvl1
            np.random.uniform(5, 15, n_per_class // 4),       # wind_speed
            np.random.uniform(1010, 1018, n_per_class // 4),  # sp_hpa
        ])
    
        low_stress_data = np.vstack([low_stress_earlysummer, low_stress_irrigated, low_stress_heavyrain, low_stress_cool])
    
        # ========================================
        # HIGH STRESS CONDITIONS (class 2) - Palakkad summer, extreme weather
        # ========================================
        # PALAKKAD SUMMER (Feb-May) - HOT + DRY = HIGH STRESS
        high_stress_summer = np.column_stack([
            np.random.uniform(33, 40, n_per_class // 5),      # t2m_C - hot summer
            np.random.uniform(0, 2, n_per_class // 5),        # tp_mm - no rain
            np.random.uniform(0.15, 0.28, n_per_class // 5),  # swvl1 - dry soil
            np.random.uniform(10, 25, n_per_class // 5),      # wind_speed - hot wind
            np.random.uniform(1005, 1018, n_per_class // 5),  # sp_hpa
        ])
    
        # Extreme heat wave
        high_stress_heatwave = np.column_stack([
            np.random.uniform(38, 45, n_per_class // 5),      # t2m_C - extreme heat
            np.random.uniform(0, 1, n_per_class // 5),        # tp_mm - no rain
            np.random.uniform(0.08, 0.18, n_per_class // 5),  # swvl1 - critically dry
            np.random.uniform(15, 35, n_per_class // 5),      # wind_speed - hot winds
            np.random.uniform(1010, 1022, n_per_class // 5),  # sp_hpa - high pressure
        ])
    
        # Flood/cyclone conditions
        high_stress_flood = np.column_stack([
            np.random.uniform(23, 28, n_per_class // 5),      # t2m_C - monsoon
            np.random.uniform(60, 150, n_per_class // 5),     # tp_mm - extreme rain
            np.random.uniform(0.55, 0.75, n_per_class // 5),  # swvl1 - waterlogged
            np.random.uniform(30, 60, n_per_class // 5),      # wind_speed - storm
            np.random.uniform(975, 995, n_per_class // 5),    # sp_hpa - cyclone pressure
        ])
    
        # Drought + moderate heat
        high_stress_drought = np.column_stack([
            np.random.uniform(31, 36, n_per_class // 5),      # t2m_C - hot
            np.random.uniform(0, 1, n_per_class // 5),        # tp_mm - drought
            np.random.uniform(0.05, 0.15, n_per_class // 5),  # swvl1 - severe drought (VERY LOW!)
            np.random.uniform(8, 20, n_per_class // 5),       # wind_speed
            np.random.uniform(1012, 1022, n_per_class // 5),  # sp_hpa - high pressure
        ])
    
        # NEW: Hot + critically dry soil + recent rain (soil hasn't absorbed yet)
        # This is TODAY'S Palakkad scenario: 36°C, 5.8% soil, 19.8mm rain
        high_stress_hot_dry_rain = np.column_stack([
            np.random.uniform(33, 40, n_per_class // 5),      # t2m_C - hot!
            np.random.uniform(5, 30, n_per_class // 5),       # tp_mm - RAIN present but soil still dry
            np.random.uniform(0.04, 0.15, n_per_class // 5),  # swvl1 - critically dry despite rain!
            np.random.uniform(8, 25, n_per_class // 5),       # wind_speed
            np.random.uniform(1005, 1018, n_per_class // 5),  # sp_hpa
        ])
    
        high_stress_data = np.vstack([high_stress_summer, high_stress_heatwave, 
                                       high_stress_flood, high_stress_drought,
                                       high_stress_hot_dry_rain])
    
        # Combine all synthetic data
        X_train = np.vstack([normal_data, low_stress_data, high_stress_data])
        y_train = np.array([0]*len(normal_data) + [1]*len(low_stress_data) + [2]*len(high_stress_data))
    
    # Common code for both ERA5 and synthetic paths
    # Shuffle the data
    shuffle_idx = np.random.permutation(len(X_train))
    X_train = X_train[shuffle_idx]
    y_train = y_train[shuffle_idx]
    
    # FIT NEW SCALER on this training data and save it
    # This is critical - scaler must match training data ranges!
    global scaler  # Update the global scaler
    new_scaler = StandardScaler()
    X_train_scaled = new_scaler.fit_transform(X_train)
    
    # Save the new scaler BEFORE training models
    with open(MODEL_DIR / "scaler.save", "wb") as f:
        pickle.dump(new_scaler, f)
    scaler = new_scaler  # Update global reference
    print("✅ New scaler saved with Palakkad training ranges")
    
    # Train Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    
    # Train Gradient Boosting
    gb_model = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    gb_model.fit(X_train_scaled, y_train)
    
    # Train MLP Neural Network
    mlp_model = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    mlp_model.fit(X_train_scaled, y_train)
    
    # Train Extra Trees (more robust than RF)
    et_model = ExtraTreesClassifier(n_estimators=100, max_depth=12, random_state=42)
    et_model.fit(X_train_scaled, y_train)
    
    # Train AdaBoost
    ada_model = AdaBoostClassifier(n_estimators=100, random_state=42)
    ada_model.fit(X_train_scaled, y_train)
    
    # Train SVM with probability
    svm_model = SVC(kernel='rbf', probability=True, random_state=42)
    svm_model.fit(X_train_scaled, y_train)
    
    # Train XGBoost if available
    xgb_model = None
    if XGBOOST_AVAILABLE:
        xgb_model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, use_label_encoder=False, eval_metric='mlogloss')
        xgb_model.fit(X_train_scaled, y_train)
    
    # Train Naive Bayes (fast probabilistic classifier)
    nb_model = GaussianNB()
    nb_model.fit(X_train_scaled, y_train)
    
    # Train K-Nearest Neighbors (instance-based learning)
    knn_model = KNeighborsClassifier(n_neighbors=7, weights='distance', metric='euclidean')
    knn_model.fit(X_train_scaled, y_train)
    
    # Save all models
    with open(MODEL_DIR / "rf_model.pkl", "wb") as f:
        pickle.dump(rf_model, f)
    with open(MODEL_DIR / "gb_model.pkl", "wb") as f:
        pickle.dump(gb_model, f)
    with open(MODEL_DIR / "mlp_model.pkl", "wb") as f:
        pickle.dump(mlp_model, f)
    with open(MODEL_DIR / "et_model.pkl", "wb") as f:
        pickle.dump(et_model, f)
    with open(MODEL_DIR / "ada_model.pkl", "wb") as f:
        pickle.dump(ada_model, f)
    with open(MODEL_DIR / "svm_model.pkl", "wb") as f:
        pickle.dump(svm_model, f)
    if xgb_model:
        with open(MODEL_DIR / "xgb_model.pkl", "wb") as f:
            pickle.dump(xgb_model, f)
    with open(MODEL_DIR / "nb_model.pkl", "wb") as f:
        pickle.dump(nb_model, f)
    with open(MODEL_DIR / "knn_model.pkl", "wb") as f:
        pickle.dump(knn_model, f)
    
    print("✅ All ensemble models created and saved!")
    return rf_model, gb_model, mlp_model, et_model, ada_model, svm_model, xgb_model, nb_model, knn_model

def load_ensemble_models():
    """Load all ensemble models, create if they don't exist"""
    required_paths = [
        MODEL_DIR / "rf_model.pkl",
        MODEL_DIR / "gb_model.pkl", 
        MODEL_DIR / "mlp_model.pkl",
        MODEL_DIR / "et_model.pkl",
        MODEL_DIR / "ada_model.pkl",
        MODEL_DIR / "svm_model.pkl",
        MODEL_DIR / "nb_model.pkl",
        MODEL_DIR / "knn_model.pkl"
    ]
    
    # Check if all required models exist
    if all(p.exists() for p in required_paths):
        with open(MODEL_DIR / "rf_model.pkl", "rb") as f:
            rf_model = pickle.load(f)
        with open(MODEL_DIR / "gb_model.pkl", "rb") as f:
            gb_model = pickle.load(f)
        with open(MODEL_DIR / "mlp_model.pkl", "rb") as f:
            mlp_model = pickle.load(f)
        with open(MODEL_DIR / "et_model.pkl", "rb") as f:
            et_model = pickle.load(f)
        with open(MODEL_DIR / "ada_model.pkl", "rb") as f:
            ada_model = pickle.load(f)
        with open(MODEL_DIR / "svm_model.pkl", "rb") as f:
            svm_model = pickle.load(f)
        with open(MODEL_DIR / "nb_model.pkl", "rb") as f:
            nb_model = pickle.load(f)
        with open(MODEL_DIR / "knn_model.pkl", "rb") as f:
            knn_model = pickle.load(f)
        
        # Load XGBoost if exists
        xgb_model = None
        xgb_path = MODEL_DIR / "xgb_model.pkl"
        if xgb_path.exists() and XGBOOST_AVAILABLE:
            with open(xgb_path, "rb") as f:
                xgb_model = pickle.load(f)
        
        print("✅ All ensemble models loaded!")
        return rf_model, gb_model, mlp_model, et_model, ada_model, svm_model, xgb_model, nb_model, knn_model
    else:
        print("📦 Creating all ensemble models (first run)...")
        return create_and_save_ensemble_models()

# Load ensemble models
try:
    rf_model, gb_model, mlp_model, et_model, ada_model, svm_model, xgb_model, nb_model, knn_model = load_ensemble_models()
    ENSEMBLE_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Ensemble models unavailable: {e}")
    rf_model, gb_model, mlp_model, et_model, ada_model, svm_model, xgb_model, nb_model, knn_model = None, None, None, None, None, None, None, None, None
    ENSEMBLE_AVAILABLE = False


# -----------------------------
# WEATHER/NWP-BASED PHYSICS MODELS
# Growing Degree Days, Evapotranspiration, Weather Severity Index
# -----------------------------
class WeatherPhysicsModels:
    """Physics-based agricultural weather models - NWP inspired"""
    
    # Crop base temperatures for GDD calculation (°C)
    CROP_BASE_TEMPS = {
        "Rice": 10, "Wheat": 5, "Maize": 10, "Sugarcane": 12,
        "Cotton": 15, "Groundnut": 13, "Coconut": 18, "Banana": 14
    }
    
    # Optimal GDD ranges per growth stage (accumulated)
    CROP_GDD_OPTIMAL = {
        "Rice": {"Germination": 100, "Tillering": 500, "Flowering": 1200, "Maturity": 1800},
        "Maize": {"Germination": 90, "Vegetative": 400, "Flowering": 1000, "Maturity": 1500},
        "default": {"Germination": 80, "Vegetative": 350, "Flowering": 900, "Maturity": 1400}
    }
    
    @staticmethod
    def calculate_gdd(temp_max, temp_min, base_temp=10):
        """Calculate Growing Degree Days"""
        avg_temp = (temp_max + temp_min) / 2
        gdd = max(0, avg_temp - base_temp)
        return gdd
    
    @staticmethod
    def calculate_eto(temp, humidity, wind_speed, solar_radiation=20):
        """
        Calculate Reference Evapotranspiration using simplified Penman-Monteith
        Returns ET0 in mm/day
        """
        # Saturation vapor pressure
        es = 0.6108 * np.exp((17.27 * temp) / (temp + 237.3))
        # Actual vapor pressure
        ea = es * (humidity / 100)
        # Vapor pressure deficit
        vpd = es - ea
        
        # Simplified Penman-Monteith (FAO-56 style)
        # Using standard values for Palakkad latitude (~10.7°N)
        delta = 4098 * es / ((temp + 237.3) ** 2)
        gamma = 0.067  # Psychrometric constant (kPa/°C)
        
        # Net radiation estimate (MJ/m²/day) - simplified
        Rn = solar_radiation * 0.77 - 0.5  # Approximate net radiation
        
        # Wind function
        u2 = wind_speed * 0.748  # Convert to 2m height if needed
        
        # ET0 calculation
        numerator = 0.408 * delta * Rn + gamma * (900 / (temp + 273)) * u2 * vpd
        denominator = delta + gamma * (1 + 0.34 * u2)
        
        eto = max(0, numerator / denominator)
        return round(eto, 2)
    
    @staticmethod
    def calculate_weather_severity_index(climate):
        """
        NWP-inspired Weather Severity Index (WSI)
        Combines multiple weather parameters into a single stress indicator
        """
        temp = climate['t2m_C']
        rain = climate['tp_mm']
        soil = climate['swvl1']
        wind = climate['wind_speed']
        pressure = climate.get('sp_hpa', 1013)
        
        # Temperature severity (0-100)
        if 22 <= temp <= 32:
            temp_sev = 0
        elif temp < 15 or temp > 40:
            temp_sev = 100
        elif temp < 22:
            temp_sev = (22 - temp) / (22 - 15) * 60
        else:  # temp > 32
            temp_sev = (temp - 32) / (40 - 32) * 80
        
        # Rainfall severity (0-100)
        if 3 <= rain <= 20:
            rain_sev = 0
        elif rain > 60:
            rain_sev = 100  # Flooding risk
        elif rain > 20:
            rain_sev = (rain - 20) / (60 - 20) * 70
        else:  # rain < 3
            rain_sev = (3 - rain) / 3 * 50  # Drought risk
        
        # Soil moisture severity (0-100)
        if 0.30 <= soil <= 0.45:
            soil_sev = 0
        elif soil < 0.15 or soil > 0.60:
            soil_sev = 100
        elif soil < 0.30:
            soil_sev = (0.30 - soil) / (0.30 - 0.15) * 80
        else:
            soil_sev = (soil - 0.45) / (0.60 - 0.45) * 60
        
        # Wind severity (0-100)
        if wind <= 20:
            wind_sev = 0
        elif wind > 50:
            wind_sev = 100
        else:
            wind_sev = (wind - 20) / (50 - 20) * 70
        
        # Pressure severity (storms indicated by low pressure)
        if pressure >= 1008:
            press_sev = 0
        elif pressure < 990:
            press_sev = 80
        else:
            press_sev = (1008 - pressure) / (1008 - 990) * 50
        
        # Weighted combination
        wsi = (
            temp_sev * 0.30 +
            rain_sev * 0.25 +
            soil_sev * 0.25 +
            wind_sev * 0.10 +
            press_sev * 0.10
        )
        
        return round(wsi, 1)
    
    @staticmethod
    def predict_stress_physics(climate, crop="Rice"):
        """Physics-based stress prediction using weather models"""
        
        # Get weather severity
        wsi = WeatherPhysicsModels.calculate_weather_severity_index(climate)
        
        # Calculate ET0
        temp = climate['t2m_C']
        humidity = climate.get('humidity', 70)
        wind = climate['wind_speed']
        et0 = WeatherPhysicsModels.calculate_eto(temp, humidity, wind)
        
        # ET stress (high ET + low soil moisture = stress)
        soil = climate['swvl1']
        et_stress = 0
        if et0 > 5 and soil < 0.30:  # High evaporation, low moisture
            et_stress = min(100, (et0 - 5) * 20 + (0.30 - soil) * 200)
        elif et0 > 7:
            et_stress = 40
        
        # GDD analysis (simplified - assumes mid-season)
        base_temp = WeatherPhysicsModels.CROP_BASE_TEMPS.get(crop, 10)
        daily_gdd = WeatherPhysicsModels.calculate_gdd(temp + 3, temp - 3, base_temp)
        
        # GDD stress (too low or too high daily accumulation)
        if daily_gdd < 5:
            gdd_stress = 60  # Too cold for growth
        elif daily_gdd > 25:
            gdd_stress = 40  # Heat accumulating too fast
        else:
            gdd_stress = 0
        
        # Combined physics-based stress
        physics_stress = wsi * 0.50 + et_stress * 0.30 + gdd_stress * 0.20
        
        # Convert to prediction
        if physics_stress >= 50:
            pred_class = 2  # High Stress
            proba = [0.1, 0.2, 0.7]
        elif physics_stress >= 25:
            pred_class = 1  # Low Stress
            proba = [0.25, 0.55, 0.2]
        else:
            pred_class = 0  # Normal
            proba = [0.7, 0.2, 0.1]
        
        # Adjust probabilities based on severity
        confidence = 0.6 + (1 - abs(physics_stress - 50) / 50) * 0.35
        
        return {
            "probabilities": np.array(proba),
            "class": pred_class,
            "confidence": proba[pred_class],
            "details": {
                "weather_severity_index": wsi,
                "evapotranspiration_mm": et0,
                "daily_gdd": round(daily_gdd, 1),
                "et_stress": round(et_stress, 1),
                "gdd_stress": round(gdd_stress, 1),
                "combined_physics_stress": round(physics_stress, 1)
            }
        }


# Initialize physics models
weather_physics = WeatherPhysicsModels()


# -----------------------------
# SMALL WEATHER FORECAST MODELS (Lightweight, No GPU)
# Persistence, Moving Average, Exponential Smoothing, Anomaly Detection
# -----------------------------
class SmallWeatherModels:
    """
    Lightweight weather forecasting models inspired by operational meteorology.
    These are computationally cheap and academically relevant baselines.
    """
    
    @staticmethod
    def persistence_model(current_climate, forecast_days=3):
        """
        Persistence Model (Naive Baseline)
        - Assumes tomorrow's weather = today's weather
        - Used as baseline in weather prediction competitions
        """
        return [{
            "day": i + 1,
            "temp_pred": current_climate["t2m_C"],
            "rain_pred": current_climate["tp_mm"],
            "confidence": max(0.3, 0.9 - i * 0.15)  # Decreases with forecast horizon
        } for i in range(forecast_days)]
    
    @staticmethod
    def simple_moving_average(forecast_data, window=3):
        """
        Simple Moving Average (SMA) Model
        - Smooths out short-term fluctuations
        - Common in time series forecasting
        """
        if not forecast_data or len(forecast_data) < window:
            return {"trend": "stable", "avg_temp": 28, "avg_rain": 5}
        
        temps = [d.get("temp_mean", 28) for d in forecast_data[:window]]
        rains = [d.get("rainfall", 0) for d in forecast_data[:window]]
        
        avg_temp = sum(temps) / len(temps)
        avg_rain = sum(rains) / len(rains)
        
        # Trend detection
        if len(temps) >= 2:
            if temps[-1] > temps[0] + 1:
                trend = "warming"
            elif temps[-1] < temps[0] - 1:
                trend = "cooling"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "avg_temp": round(avg_temp, 1),
            "avg_rain": round(avg_rain, 1),
            "window_days": window
        }
    
    @staticmethod
    def exponential_smoothing(forecast_data, alpha=0.3):
        """
        Simple Exponential Smoothing (SES)
        - Gives more weight to recent observations
        - Alpha controls smoothing (0.1 = slow, 0.9 = fast)
        """
        if not forecast_data:
            return {"smoothed_temp": 28, "smoothed_rain": 5}
        
        temps = [d.get("temp_mean", 28) for d in forecast_data]
        rains = [d.get("rainfall", 0) for d in forecast_data]
        
        # Exponential smoothing
        smoothed_temp = temps[0]
        smoothed_rain = rains[0]
        
        for i in range(1, len(temps)):
            smoothed_temp = alpha * temps[i] + (1 - alpha) * smoothed_temp
            smoothed_rain = alpha * rains[i] + (1 - alpha) * smoothed_rain
        
        return {
            "smoothed_temp": round(smoothed_temp, 1),
            "smoothed_rain": round(smoothed_rain, 1),
            "alpha": alpha
        }
    
    @staticmethod
    def climatology_model(month=None):
        """
        Climatology Model
        - Uses historical averages for the region/month
        - Palakkad climatology data
        """
        if month is None:
            month = datetime.now().month
        
        # Palakkad monthly climatology (historical averages)
        climatology = {
            1: {"temp": 27.5, "rain": 8, "humidity": 65, "season": "Winter"},
            2: {"temp": 29.0, "rain": 12, "humidity": 62, "season": "Winter"},
            3: {"temp": 31.5, "rain": 25, "humidity": 60, "season": "Pre-Monsoon"},
            4: {"temp": 32.5, "rain": 65, "humidity": 68, "season": "Pre-Monsoon"},
            5: {"temp": 31.0, "rain": 120, "humidity": 75, "season": "Pre-Monsoon"},
            6: {"temp": 28.5, "rain": 450, "humidity": 88, "season": "SW Monsoon"},
            7: {"temp": 27.0, "rain": 680, "humidity": 92, "season": "SW Monsoon"},
            8: {"temp": 27.5, "rain": 380, "humidity": 90, "season": "SW Monsoon"},
            9: {"temp": 28.0, "rain": 220, "humidity": 85, "season": "SW Monsoon"},
            10: {"temp": 28.5, "rain": 280, "humidity": 83, "season": "NE Monsoon"},
            11: {"temp": 28.0, "rain": 150, "humidity": 78, "season": "NE Monsoon"},
            12: {"temp": 27.0, "rain": 35, "humidity": 70, "season": "Winter"}
        }
        
        return climatology.get(month, climatology[6])
    
    @staticmethod
    def anomaly_detection(current_climate, forecast_data):
        """
        Weather Anomaly Detector
        - Compares current conditions to forecast
        - Flags unusual deviations
        """
        anomalies = []
        
        # Current values
        current_temp = current_climate.get("t2m_C", 28)
        current_rain = current_climate.get("tp_mm", 0)
        
        # Get climatology for comparison
        clim = SmallWeatherModels.climatology_model()
        
        # Temperature anomaly
        temp_deviation = current_temp - clim["temp"]
        if abs(temp_deviation) > 3:
            anomalies.append({
                "type": "temperature",
                "severity": "high" if abs(temp_deviation) > 5 else "moderate",
                "deviation": round(temp_deviation, 1),
                "message": f"Temperature {'above' if temp_deviation > 0 else 'below'} normal by {abs(temp_deviation):.1f}°C"
            })
        
        # Rainfall anomaly (compare to daily average for month)
        daily_avg_rain = clim["rain"] / 30  # Monthly to daily
        if current_rain > daily_avg_rain * 3:
            anomalies.append({
                "type": "rainfall",
                "severity": "high",
                "deviation": round(current_rain - daily_avg_rain, 1),
                "message": f"Rainfall significantly above normal ({current_rain:.1f}mm vs {daily_avg_rain:.1f}mm avg)"
            })
        elif current_rain == 0 and clim["season"] in ["SW Monsoon", "NE Monsoon"]:
            anomalies.append({
                "type": "rainfall",
                "severity": "moderate",
                "deviation": 0,
                "message": "No rainfall during monsoon - drought risk"
            })
        
        # Forecast-based anomalies
        if forecast_data and len(forecast_data) >= 3:
            future_temps = [d.get("temp_mean", 28) for d in forecast_data[:3]]
            if max(future_temps) > 38:
                anomalies.append({
                    "type": "heatwave",
                    "severity": "critical",
                    "deviation": max(future_temps) - 38,
                    "message": f"Heatwave risk - forecasted {max(future_temps):.0f}°C"
                })
            
            future_rains = [d.get("rainfall", 0) for d in forecast_data[:3]]
            if sum(future_rains) > 100:
                anomalies.append({
                    "type": "heavy_rain",
                    "severity": "high",
                    "deviation": sum(future_rains) - 100,
                    "message": f"Heavy rainfall expected - {sum(future_rains):.0f}mm in 3 days"
                })
        
        return {
            "anomaly_count": len(anomalies),
            "anomalies": anomalies,
            "risk_level": "Critical" if any(a["severity"] == "critical" for a in anomalies) 
                         else "High" if any(a["severity"] == "high" for a in anomalies)
                         else "Moderate" if anomalies else "Normal",
            "climatology": clim
        }
    
    @staticmethod
    def linear_trend_forecast(forecast_data, days_ahead=3):
        """
        Simple Linear Trend Model
        - Fits a linear trend to recent data
        - Extrapolates forward
        """
        if not forecast_data or len(forecast_data) < 2:
            return {"trend_slope": 0, "forecast": []}
        
        temps = [d.get("temp_mean", 28) for d in forecast_data]
        
        # Simple linear regression (y = mx + b)
        n = len(temps)
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(temps) / n
        
        numerator = sum((x[i] - x_mean) * (temps[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        intercept = y_mean - slope * x_mean
        
        # Forecast
        forecasts = []
        for i in range(days_ahead):
            predicted_temp = intercept + slope * (n + i)
            forecasts.append({
                "day": n + i + 1,
                "predicted_temp": round(predicted_temp, 1),
                "confidence": max(0.5, 0.85 - i * 0.1)
            })
        
        return {
            "trend_slope": round(slope, 3),
            "trend_direction": "warming" if slope > 0.1 else "cooling" if slope < -0.1 else "stable",
            "forecast": forecasts
        }


# Initialize small weather models
small_weather_models = SmallWeatherModels()


# -----------------------------
# PALAKKAD TALUK DATA
# -----------------------------
TALUKS = {
    "Palakkad": {"lat": 10.7867, "lng": 76.6548, "soil": "Laterite/Clay", "dominant_crops": ["Rice", "Coconut", "Sugarcane"]},
    "Chittur": {"lat": 10.6979, "lng": 76.7472, "soil": "Red loam", "dominant_crops": ["Rice", "Coconut", "Banana"]},
    "Alathur": {"lat": 10.5667, "lng": 76.5500, "soil": "Sandy loam", "dominant_crops": ["Rice", "Groundnut", "Cotton"]},
    "Ottapalam": {"lat": 10.7719, "lng": 76.3778, "soil": "Alluvial", "dominant_crops": ["Rice", "Coconut", "Banana"]},
    "Mannarkkad": {"lat": 10.9881, "lng": 76.4744, "soil": "Forest soil", "dominant_crops": ["Coffee", "Arecanut", "Cardamom"]},
    "Kollengode": {"lat": 10.5931, "lng": 76.6942, "soil": "Laterite", "dominant_crops": ["Rice", "Coconut", "Vegetables"]},
    "Pattambi": {"lat": 10.8089, "lng": 76.1878, "soil": "Alluvial", "dominant_crops": ["Rice", "Coconut", "Banana"]},
    "Thrithala": {"lat": 10.9500, "lng": 76.3350, "soil": "Riverine", "dominant_crops": ["Rice", "Coconut", "Rubber"]},
}

# -----------------------------
# CROP STRESS THRESHOLDS (Tightened for realistic stress detection)
# -----------------------------
CROP_THRESHOLDS = {
    "Rice": {
        "temp_optimal": (24, 30), "temp_critical": (18, 36),  # Narrower: ideal is 24-30°C
        "soil_moisture_optimal": (0.32, 0.42), "soil_moisture_critical": (0.22, 0.52),
        "rainfall_optimal": (5, 15), "rainfall_critical": (0, 50),  # Need some rain daily
        "wind_critical": 20, "humidity_optimal": (65, 80)
    },
    "Wheat": {
        "temp_optimal": (18, 23), "temp_critical": (12, 30),  # Wheat prefers cooler
        "soil_moisture_optimal": (0.28, 0.38), "soil_moisture_critical": (0.18, 0.48),
        "rainfall_optimal": (3, 12), "rainfall_critical": (0, 40),
        "wind_critical": 25, "humidity_optimal": (55, 70)
    },
    "Coconut": {
        "temp_optimal": (25, 32), "temp_critical": (18, 38),
        "soil_moisture_optimal": (0.28, 0.38), "soil_moisture_critical": (0.18, 0.48),
        "rainfall_optimal": (5, 15), "rainfall_critical": (0, 50),
        "wind_critical": 35, "humidity_optimal": (65, 85)
    },
    "Sugarcane": {
        "temp_optimal": (27, 33), "temp_critical": (18, 40),
        "soil_moisture_optimal": (0.35, 0.48), "soil_moisture_critical": (0.25, 0.55),
        "rainfall_optimal": (8, 25), "rainfall_critical": (0, 80),
        "wind_critical": 30, "humidity_optimal": (60, 80)
    },
    "Maize": {
        "temp_optimal": (22, 30), "temp_critical": (15, 36),
        "soil_moisture_optimal": (0.28, 0.38), "soil_moisture_critical": (0.18, 0.48),
        "rainfall_optimal": (5, 15), "rainfall_critical": (0, 50),
        "wind_critical": 20, "humidity_optimal": (55, 75)
    },
    "Cotton": {
        "temp_optimal": (25, 32), "temp_critical": (18, 38),
        "soil_moisture_optimal": (0.22, 0.32), "soil_moisture_critical": (0.15, 0.42),
        "rainfall_optimal": (3, 12), "rainfall_critical": (0, 40),
        "wind_critical": 25, "humidity_optimal": (50, 65)
    },
    "Groundnut": {
        "temp_optimal": (26, 30), "temp_critical": (20, 36),
        "soil_moisture_optimal": (0.28, 0.38), "soil_moisture_critical": (0.18, 0.48),
        "rainfall_optimal": (4, 14), "rainfall_critical": (0, 45),
        "wind_critical": 20, "humidity_optimal": (55, 70)
    }
}

# Default thresholds for unknown crops (tightened)
DEFAULT_THRESHOLDS = {
    "temp_optimal": (23, 30), "temp_critical": (15, 38),
    "soil_moisture_optimal": (0.28, 0.38), "soil_moisture_critical": (0.18, 0.50),
    "rainfall_optimal": (5, 15), "rainfall_critical": (0, 60),
    "wind_critical": 25, "humidity_optimal": (55, 75)
}

# -----------------------------
# GROWTH STAGES WITH DETAILED INFO
# -----------------------------
CROP_STAGES = {
    "Rice": [
        {"range": (0, 7), "name": "Germination", "water_need": "High", "fertilizer": "None", "pest_risk": "Low"},
        {"range": (8, 20), "name": "Seedling", "water_need": "High", "fertilizer": "Nitrogen basal", "pest_risk": "Moderate"},
        {"range": (21, 55), "name": "Tillering", "water_need": "High", "fertilizer": "Top dressing N", "pest_risk": "High"},
        {"range": (56, 80), "name": "Panicle Initiation", "water_need": "Medium-High", "fertilizer": "K application", "pest_risk": "High"},
        {"range": (81, 100), "name": "Flowering", "water_need": "Medium", "fertilizer": "Foliar spray", "pest_risk": "High"},
        {"range": (101, 125), "name": "Grain Filling", "water_need": "Medium", "fertilizer": "None", "pest_risk": "Moderate"},
        {"range": (126, 145), "name": "Maturity", "water_need": "Low", "fertilizer": "None", "pest_risk": "Low"}
    ],
    "Wheat": [
        {"range": (0, 10), "name": "Germination", "water_need": "Medium", "fertilizer": "Basal NPK", "pest_risk": "Low"},
        {"range": (11, 25), "name": "Seedling", "water_need": "Medium", "fertilizer": "None", "pest_risk": "Low"},
        {"range": (26, 55), "name": "Tillering", "water_need": "Medium-High", "fertilizer": "Top dressing N", "pest_risk": "Moderate"},
        {"range": (56, 80), "name": "Jointing", "water_need": "High", "fertilizer": "Micronutrients", "pest_risk": "Moderate"},
        {"range": (81, 100), "name": "Heading", "water_need": "High", "fertilizer": "Foliar K", "pest_risk": "High"},
        {"range": (101, 125), "name": "Grain Filling", "water_need": "Medium", "fertilizer": "None", "pest_risk": "Moderate"},
        {"range": (126, 140), "name": "Maturity", "water_need": "Low", "fertilizer": "None", "pest_risk": "Low"}
    ],
    "Coconut": [
        {"range": (0, 30), "name": "Establishment", "water_need": "High", "fertilizer": "Organic manure", "pest_risk": "Low"},
        {"range": (31, 180), "name": "Vegetative Growth", "water_need": "Medium", "fertilizer": "NPK split", "pest_risk": "Moderate"},
        {"range": (181, 365), "name": "Pre-bearing", "water_need": "Medium", "fertilizer": "K emphasis", "pest_risk": "Moderate"},
        {"range": (366, 730), "name": "Early Bearing", "water_need": "Medium", "fertilizer": "Full dose NPK", "pest_risk": "Moderate"},
        {"range": (731, 9999), "name": "Full Production", "water_need": "Medium", "fertilizer": "Annual NPK", "pest_risk": "Moderate"}
    ],
    "Sugarcane": [
        {"range": (0, 20), "name": "Germination", "water_need": "High", "fertilizer": "Basal FYM", "pest_risk": "Low"},
        {"range": (21, 60), "name": "Early Growth", "water_need": "High", "fertilizer": "N application", "pest_risk": "Moderate"},
        {"range": (61, 120), "name": "Active Tillering", "water_need": "Very High", "fertilizer": "Top dressing N", "pest_risk": "High"},
        {"range": (121, 210), "name": "Grand Growth", "water_need": "High", "fertilizer": "K application", "pest_risk": "High"},
        {"range": (211, 300), "name": "Maturation", "water_need": "Medium", "fertilizer": "None", "pest_risk": "Moderate"},
        {"range": (301, 365), "name": "Harvest Ready", "water_need": "Low", "fertilizer": "None", "pest_risk": "Low"}
    ],
    "Maize": [
        {"range": (0, 10), "name": "Emergence", "water_need": "Medium", "fertilizer": "Basal NPK", "pest_risk": "Low"},
        {"range": (11, 40), "name": "Vegetative", "water_need": "Medium-High", "fertilizer": "N top dress", "pest_risk": "Moderate"},
        {"range": (41, 65), "name": "Tasseling", "water_need": "High", "fertilizer": "Foliar spray", "pest_risk": "High"},
        {"range": (66, 80), "name": "Silking", "water_need": "High", "fertilizer": "K application", "pest_risk": "High"},
        {"range": (81, 115), "name": "Grain Fill", "water_need": "Medium", "fertilizer": "None", "pest_risk": "Moderate"},
        {"range": (116, 130), "name": "Maturity", "water_need": "Low", "fertilizer": "None", "pest_risk": "Low"}
    ],
    "Cotton": [
        {"range": (0, 25), "name": "Emergence", "water_need": "Medium", "fertilizer": "Basal NPK", "pest_risk": "Low"},
        {"range": (26, 60), "name": "Vegetative", "water_need": "Medium", "fertilizer": "N top dress", "pest_risk": "Moderate"},
        {"range": (61, 100), "name": "Flowering", "water_need": "Medium-High", "fertilizer": "K application", "pest_risk": "High"},
        {"range": (101, 150), "name": "Boll Development", "water_need": "Medium", "fertilizer": "Foliar micronutrients", "pest_risk": "Very High"},
        {"range": (151, 180), "name": "Boll Opening", "water_need": "Low", "fertilizer": "None", "pest_risk": "Moderate"},
        {"range": (181, 210), "name": "Harvest Ready", "water_need": "None", "fertilizer": "None", "pest_risk": "Low"}
    ],
    "Groundnut": [
        {"range": (0, 15), "name": "Emergence", "water_need": "Medium", "fertilizer": "Basal gypsum", "pest_risk": "Low"},
        {"range": (16, 40), "name": "Vegetative", "water_need": "Medium", "fertilizer": "Light N", "pest_risk": "Moderate"},
        {"range": (41, 70), "name": "Flowering", "water_need": "Medium-High", "fertilizer": "Calcium", "pest_risk": "Moderate"},
        {"range": (71, 110), "name": "Pod Development", "water_need": "Medium", "fertilizer": "Gypsum application", "pest_risk": "High"},
        {"range": (111, 130), "name": "Maturity", "water_need": "Low", "fertilizer": "None", "pest_risk": "Low"},
        {"range": (131, 150), "name": "Harvest Ready", "water_need": "None", "fertilizer": "None", "pest_risk": "Low"}
    ]
}

# -----------------------------
# PEST/DISEASE RISK DATABASE
# -----------------------------
PEST_DATABASE = {
    "Rice": {
        "high_humidity_high_temp": ["Bacterial Leaf Blight", "Sheath Blight", "Brown Planthopper"],
        "high_humidity_low_temp": ["Blast Disease", "False Smut"],
        "dry_conditions": ["Stem Borer", "Leaf Folder"],
        "monsoon": ["Rice Bug", "Grain Discoloration"],
        "general": ["Leaf Roller", "Yellow Stem Borer"]
    },
    "Coconut": {
        "high_humidity_high_temp": ["Bud Rot", "Leaf Blight"],
        "dry_conditions": ["Eriophyid Mite", "Red Palm Weevil"],
        "monsoon": ["Root Wilt", "Stem Bleeding"],
        "general": ["Rhinoceros Beetle", "Coconut Mite"]
    },
    "Sugarcane": {
        "high_humidity_high_temp": ["Red Rot", "Smut", "Top Borer"],
        "dry_conditions": ["Scale Insect", "Pyrilla"],
        "monsoon": ["Pineapple Disease", "Root Borer"],
        "general": ["Early Shoot Borer", "Internode Borer"]
    },
    "Cotton": {
        "high_humidity_high_temp": ["Bacterial Blight", "Pink Bollworm"],
        "dry_conditions": ["Aphids", "Jassids", "Whitefly"],
        "monsoon": ["Alternaria Leaf Spot", "Root Rot"],
        "general": ["American Bollworm", "Spotted Bollworm"]
    },
    "Maize": {
        "high_humidity_high_temp": ["Turcicum Leaf Blight", "Maydis Leaf Blight"],
        "dry_conditions": ["Stem Borer", "Aphids"],
        "monsoon": ["Downy Mildew", "Post-flowering Stalk Rot"],
        "general": ["Fall Armyworm", "Pink Borer"]
    },
    "Groundnut": {
        "high_humidity_high_temp": ["Tikka Disease", "Collar Rot"],
        "dry_conditions": ["Thrips", "Jassids"],
        "monsoon": ["Root Rot", "Stem Rot"],
        "general": ["Leaf Miner", "Red Hairy Caterpillar"]
    }
}

# -----------------------------
# FETCH EXTENDED WEATHER (7-day)
# -----------------------------
def fetch_weather(location="Palakkad"):
    """Fetch current weather and 7-day forecast from Open-Meteo API
    
    IMPORTANT: Uses CURRENT real-time conditions for stress calculation,
    not daily averages. This is critical for accurate stress assessment
    during peak heat hours in Palakkad (typically 11am-4pm).
    """
    
    # Get coordinates based on location/taluk
    taluk_info = TALUKS.get(location, TALUKS["Palakkad"])
    lat = taluk_info["lat"]
    lng = taluk_info["lng"]
    
    try:
        # Fetch BOTH current conditions AND daily forecasts
        # IMPORTANT: Include soil_moisture_0_to_1cm in current for accurate stress assessment
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lng}"
            "&current=temperature_2m,relative_humidity_2m,precipitation,"
            "wind_speed_10m,wind_gusts_10m,surface_pressure,soil_moisture_0_to_1cm"
            "&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,"
            "precipitation_sum,windspeed_10m_mean,windgusts_10m_max,"
            "relative_humidity_2m_mean,et0_fao_evapotranspiration,uv_index_max,"
            "precipitation_probability_max"
            "&hourly=soil_moisture_0_to_7cm"
            "&timezone=auto&forecast_days=7"
        )
        
        data = requests.get(url, timeout=10).json()
        
        # Get CURRENT real-time conditions (critical for stress!)
        current_data = data.get('current', {})
        current_temp = current_data.get('temperature_2m')  # Real-time temp
        current_humidity = current_data.get('relative_humidity_2m')  # Real-time humidity
        current_wind = current_data.get('wind_speed_10m')
        current_precip = current_data.get('precipitation', 0)
        current_soil_moisture = current_data.get('soil_moisture_0_to_1cm')  # CURRENT soil moisture!
        
        # Get soil moisture - PREFER current value over hourly (which may be None)
        soil_moisture_hourly = data.get('hourly', {}).get('soil_moisture_0_to_7cm', [])
        # Filter out None values
        valid_moisture = [m for m in soil_moisture_hourly[:24] if m is not None]
        
        # PRIORITIZE current soil moisture (most accurate real-time value)
        if current_soil_moisture is not None:
            # USE CURRENT - this is the actual real-time value!
            stress_soil_moisture = current_soil_moisture
            avg_soil_moisture = current_soil_moisture  # For display, use current
            min_soil_moisture = current_soil_moisture
            print(f"✅ Using CURRENT soil moisture: {current_soil_moisture*100:.1f}%")
        elif valid_moisture:
            # Fallback to hourly data if current not available
            min_soil_moisture = min(valid_moisture)
            avg_soil_moisture = sum(valid_moisture) / len(valid_moisture)
            stress_soil_moisture = min_soil_moisture
            print(f"⚠️ Using hourly soil moisture - min: {min_soil_moisture*100:.1f}%")
        else:
            # Last resort default
            min_soil_moisture = 0.30
            avg_soil_moisture = 0.30
            stress_soil_moisture = 0.30
            print("⚠️ Using default soil moisture: 30%")
        
        daily = data.get('daily', {})
        
        # BALANCED APPROACH: Blend current (60%) and daily mean (40%)
        # Use ACTUAL CURRENT values for accurate real-time reporting
        # Previous blending (60/40) was causing display inaccuracies
        # Farmers need to see REAL conditions right now
        daily_temp_mean = daily.get('temperature_2m_mean', [28])[0] or 28
        daily_humidity_mean = daily.get('relative_humidity_2m_mean', [70])[0] or 70
        
        # Use current real-time values directly
        if current_temp is not None:
            temp_for_stress = current_temp  # Use actual current temp
        else:
            temp_for_stress = daily_temp_mean
            
        if current_humidity is not None:
            humidity_for_stress = current_humidity  # Use actual current humidity
        else:
            humidity_for_stress = daily_humidity_mean
        
        # Get current precipitation from real-time data (not daily sum)
        current_precip = current_data.get('precipitation', 0) or 0
        daily_precip_sum = daily.get('precipitation_sum', [0])[0] or 0
        
        current = {
            "t2m_C": round(temp_for_stress, 1),  # Actual current temp
            "t2m_current": current_temp,  # Store for reference
            "t2m_daily_mean": daily_temp_mean,  # Daily mean for context
            "t_max": daily.get('temperature_2m_max', [32])[0] or 32,
            "t_min": daily.get('temperature_2m_min', [24])[0] or 24,
            "tp_mm": daily_precip_sum,  # Daily sum for total
            "tp_current": current_precip,  # Current precipitation rate
            "wind_speed": current_wind if current_wind is not None else (daily.get('windspeed_10m_mean', [5])[0] or 5),
            "wind_gust": daily.get('windgusts_10m_max', [10])[0] or 10,
            "humidity": round(humidity_for_stress, 1),  # Actual current humidity
            "humidity_current": current_humidity,  # Store actual current
            "humidity_daily_mean": daily_humidity_mean,
            "et0": daily.get('et0_fao_evapotranspiration', [4])[0] or 4,
            "uv_index": daily.get('uv_index_max', [6])[0] or 6,
            "precip_prob": daily.get('precipitation_probability_max', [20])[0] or 20,
            "sp_hpa": current_data.get('surface_pressure', 1010) or 1010,
            # Use MINIMUM soil moisture (worst case) for AI stress prediction
            "swvl1": stress_soil_moisture,
            "swvl1_avg": avg_soil_moisture,  # Keep average for reference
            "swvl1_min": min_soil_moisture   # Store min for debugging
        }
        
        # Build 7-day forecast
        forecast_7day = []
        for i in range(min(7, len(daily.get('time', [])))):
            forecast_7day.append({
                "date": daily.get('time', [])[i] if i < len(daily.get('time', [])) else "",
                "temp_mean": daily.get('temperature_2m_mean', [28]*7)[i] or 28,
                "temp_max": daily.get('temperature_2m_max', [32]*7)[i] or 32,
                "temp_min": daily.get('temperature_2m_min', [24]*7)[i] or 24,
                "rainfall": daily.get('precipitation_sum', [0]*7)[i] or 0,
                "wind": daily.get('windspeed_10m_mean', [5]*7)[i] or 5,
                "humidity": daily.get('relative_humidity_2m_mean', [70]*7)[i] or 70,
                "precip_prob": daily.get('precipitation_probability_max', [20]*7)[i] or 20,
                "et0": daily.get('et0_fao_evapotranspiration', [4]*7)[i] or 4
            })
        
        return current, forecast_7day
        
    except Exception as e:
        print(f"Weather API error: {e}")
        # Return default values on API failure
        current = {
            "t2m_C": 28, "t_max": 32, "t_min": 24, "tp_mm": 0,
            "wind_speed": 5, "wind_gust": 10, "humidity": 70,
            "et0": 4, "uv_index": 6, "precip_prob": 20,
            "sp_hpa": 1010, "swvl1": 0.30
        }
        return current, []


# -----------------------------
# GROWTH STAGE CALCULATOR
# -----------------------------
def get_growth_stage_info(crop, days):
    """Get detailed growth stage information"""
    stages = CROP_STAGES.get(crop, CROP_STAGES["Rice"])
    
    for stage in stages:
        start, end = stage["range"]
        if start <= days <= end:
            progress = (days - start) / (end - start) * 100 if end > start else 100
            return {
                "name": stage["name"],
                "water_need": stage["water_need"],
                "fertilizer": stage["fertilizer"],
                "pest_risk": stage["pest_risk"],
                "progress": min(100, round(progress)),
                "days_in_stage": days - start,
                "days_remaining": end - days
            }
    
    # Past all stages
    last_stage = stages[-1]
    return {
        "name": "Post-harvest",
        "water_need": "None",
        "fertilizer": "None",
        "pest_risk": "Low",
        "progress": 100,
        "days_in_stage": 0,
        "days_remaining": 0
    }


# -----------------------------
# STRESS CALCULATION ENGINE
# -----------------------------
def calculate_comprehensive_stress(crop, climate, growth_stage_info):
    """Calculate multi-dimensional stress scores with realistic sensitivity
    
    Enhanced version with:
    - Higher baseline stress (realistic field conditions are never "perfect")
    - Environmental variability factor (daily fluctuations)
    - Cumulative stress considerations (consecutive suboptimal days)
    - Stage-specific sensitivity multipliers
    """
    
    thresholds = CROP_THRESHOLDS.get(crop, DEFAULT_THRESHOLDS)
    
    # Base environmental variability stress (5-15% - nothing is ever perfect in fields)
    # Base environmental variability stress (3-10% - accounts for natural variation)
    base_variability = 5 + np.random.uniform(-2, 5)  # 3-10% baseline
    
    # Temperature stress (sensitive calculation)
    temp = climate["t2m_C"]
    t_opt_min, t_opt_max = thresholds["temp_optimal"]
    t_crit_min, t_crit_max = thresholds["temp_critical"]
    t_ideal = (t_opt_min + t_opt_max) / 2  # Ideal midpoint
    temp_range = (t_opt_max - t_opt_min) / 2
    
    if t_opt_min <= temp <= t_opt_max:
        # Within optimal: minimal stress, increases near edges
        deviation = abs(temp - t_ideal) / temp_range
        # Low base stress with gradual increase at edges
        temp_stress = 2 + (deviation ** 1.5) * 18  # 2-20% in optimal range
    elif temp < t_crit_min or temp > t_crit_max:
        temp_stress = 100
    elif temp < t_opt_min:
        # Below optimal: linear increase with distance
        temp_stress = 30 + ((t_opt_min - temp) / (t_opt_min - t_crit_min)) * 70
    else:
        # Above optimal: heat stress is more damaging
        temp_stress = 30 + ((temp - t_opt_max) / (t_crit_max - t_opt_max)) * 70
    
    # Add diurnal temperature range stress (large swings = stress)
    t_max = climate.get("t_max", temp + 4)
    t_min = climate.get("t_min", temp - 4)
    diurnal_range = t_max - t_min
    if diurnal_range > 15:
        temp_stress += min(20, (diurnal_range - 15) * 3)  # Extra stress for large swings
    
    # Soil moisture stress (sensitive)
    soil = climate["swvl1"]
    sm_opt_min, sm_opt_max = thresholds["soil_moisture_optimal"]
    sm_crit_min, sm_crit_max = thresholds["soil_moisture_critical"]
    sm_ideal = (sm_opt_min + sm_opt_max) / 2
    sm_range = (sm_opt_max - sm_opt_min) / 2
    
    if sm_opt_min <= soil <= sm_opt_max:
        deviation = abs(soil - sm_ideal) / sm_range
        moisture_stress = 2 + (deviation ** 1.5) * 18  # 2-20% in optimal
    elif soil < sm_crit_min:
        moisture_stress = 100  # Severe drought
    elif soil > sm_crit_max:
        moisture_stress = 85  # Waterlogged
    elif soil < sm_opt_min:
        # Dry stress - critical for crops
        moisture_stress = 30 + ((sm_opt_min - soil) / (sm_opt_min - sm_crit_min)) * 70
    else:
        # Too wet
        moisture_stress = 25 + ((soil - sm_opt_max) / (sm_crit_max - sm_opt_max)) * 60
    
    # Rainfall stress (drought or excess) - nuanced
    rain = climate["tp_mm"]
    r_opt_min, r_opt_max = thresholds["rainfall_optimal"]
    _, r_crit_max = thresholds["rainfall_critical"]
    
    if rain > r_crit_max:
        rain_stress = 95 + min(5, (rain - r_crit_max) / 10)  # Flood risk
    elif r_opt_min <= rain <= r_opt_max:
        r_ideal = (r_opt_min + r_opt_max) / 2
        deviation = abs(rain - r_ideal) / ((r_opt_max - r_opt_min) / 2)
        rain_stress = 3 + deviation * 12  # 3-15% in optimal
    elif rain > r_opt_max:
        # Too much rain - but not necessarily bad unless critical
        rain_stress = 20 + ((rain - r_opt_max) / (r_crit_max - r_opt_max)) * 60
    elif rain < r_opt_min:
        # Insufficient rain - deficit stress
        if rain == 0:
            rain_stress = 30  # No rain is moderate stress (can be irrigated)
        elif rain < r_opt_min * 0.3:
            rain_stress = 25  # Very low rain
        else:
            rain_stress = 15 + ((r_opt_min - rain) / r_opt_min) * 15
    else:
        rain_stress = 10
    
    # Wind stress (more gradual impact)
    wind = climate["wind_speed"]
    wind_crit = thresholds["wind_critical"]
    if wind > wind_crit:
        wind_stress = min(100, 35 + (wind - wind_crit) * 5)
    elif wind > wind_crit * 0.7:
        wind_stress = 20 + ((wind - wind_crit * 0.7) / (wind_crit * 0.3)) * 15
    elif wind > wind_crit * 0.4:
        wind_stress = 10 + ((wind - wind_crit * 0.4) / (wind_crit * 0.3)) * 10
    elif wind > 5:
        wind_stress = 5  # Light wind, minimal stress
    else:
        wind_stress = 2  # Very calm, minor evaporation benefit
    
    # Humidity stress (if available) - affects transpiration in Palakkad
    # Summer can drop to 40-50% humidity which creates moderate stress
    humidity = climate.get("humidity", 70)
    humidity_opt_min, humidity_opt_max = thresholds.get("humidity_optimal", (65, 80))
    
    if humidity_opt_min <= humidity <= humidity_opt_max:
        humidity_stress = 0
    elif humidity < humidity_opt_min:
        # Low humidity increases transpiration demand
        humidity_deficit = humidity_opt_min - humidity
        if humidity < 35:
            # Very low humidity - significant stress
            humidity_stress = 35 + min(25, (35 - humidity) * 2)  # 35-60%
        elif humidity < 50:
            humidity_stress = 20 + (50 - humidity) * 1.0  # 20-35%
        else:
            humidity_stress = min(20, humidity_deficit * 1.2)  # Up to 20%
    else:
        # High humidity = disease risk
        humidity_stress = min(40, (humidity - humidity_opt_max) * 2)
    
    # Heat-Dryness interaction - moderate effect for Palakkad summer
    # Only applies when BOTH conditions are suboptimal
    heat_dryness_stress = 0
    if temp > 31 and humidity < 45:
        # Calculate heat-dryness interaction stress
        heat_factor = min(1.0, (temp - 31) / 5)  # 0 at 31°C, 1 at 36°C
        dry_factor = min(1.0, (45 - humidity) / 15)  # 0 at 45%, 1 at 30%
        # Combined stress: moderate effect
        heat_dryness_stress = min(25, heat_factor * dry_factor * 35)
    
    # Rainfall benefit: Recent rain reduces overall stress
    rain = climate["tp_mm"]
    rainfall_benefit = 0
    if rain >= 5:
        # Good rainfall today reduces stress impact
        rainfall_benefit = min(15, rain * 0.8)  # Up to 15% reduction
    
    # Calculate overall stress with stage-weighted factors
    stage_weights = {
        "Germination": {"temp": 0.30, "moisture": 0.40, "rain": 0.15, "wind": 0.05, "humidity": 0.10},
        "Seedling": {"temp": 0.25, "moisture": 0.35, "rain": 0.20, "wind": 0.10, "humidity": 0.10},
        "Tillering": {"temp": 0.22, "moisture": 0.35, "rain": 0.25, "wind": 0.08, "humidity": 0.10},
        "Flowering": {"temp": 0.35, "moisture": 0.28, "rain": 0.15, "wind": 0.10, "humidity": 0.12},
        "Grain Filling": {"temp": 0.28, "moisture": 0.32, "rain": 0.22, "wind": 0.08, "humidity": 0.10},
        "Maturity": {"temp": 0.18, "moisture": 0.18, "rain": 0.35, "wind": 0.18, "humidity": 0.11},
        "Panicle Initiation": {"temp": 0.32, "moisture": 0.30, "rain": 0.18, "wind": 0.08, "humidity": 0.12},
        "Vegetative": {"temp": 0.25, "moisture": 0.35, "rain": 0.22, "wind": 0.08, "humidity": 0.10},
    }
    
    # Stage-specific sensitivity multipliers (some stages are more vulnerable)
    stage_sensitivity = {
        "Germination": 1.3,      # Very sensitive
        "Seedling": 1.2,         # Sensitive
        "Flowering": 1.4,        # Most critical stage
        "Grain Filling": 1.15,
        "Panicle Initiation": 1.25,
        "Maturity": 0.9,         # More resilient
        "Tillering": 1.0,
        "Vegetative": 1.0,
    }
    
    stage_name = growth_stage_info.get("name", "Vegetative")
    weights = stage_weights.get(stage_name, {"temp": 0.25, "moisture": 0.32, "rain": 0.23, "wind": 0.10, "humidity": 0.10})
    sensitivity = stage_sensitivity.get(stage_name, 1.0)
    
    # Weighted stress calculation
    weighted_stress = (
        temp_stress * weights["temp"] +
        moisture_stress * weights["moisture"] +
        rain_stress * weights["rain"] +
        wind_stress * weights["wind"] +
        humidity_stress * weights.get("humidity", 0)
    )
    
    # Apply stage sensitivity and base variability
    overall_stress = (weighted_stress * sensitivity) + base_variability
    
    # Add heat-dryness interaction (critical for Palakkad summer)
    overall_stress += heat_dryness_stress
    
    # Add interaction effects (moderate compounding)
    if temp_stress > 50 and moisture_stress > 50:
        overall_stress += 8  # Heat + drought interaction
    if rain_stress > 60 and humidity_stress > 30:
        overall_stress += 6   # Wet conditions + high humidity = disease risk
    if wind_stress > 30 and moisture_stress > 40:
        overall_stress += 5  # Wind + low moisture = desiccation
    if humidity_stress > 35 and temp_stress > 40:
        overall_stress += 8  # Low humidity + high temp = wilting risk
    
    # Apply rainfall benefit (reduces stress if good rain occurred)
    overall_stress -= rainfall_benefit
    
    return {
        "overall": round(min(100, max(0, overall_stress))),
        "temperature": round(min(100, temp_stress)),
        "moisture": round(min(100, moisture_stress)),
        "rainfall": round(min(100, rain_stress)),
        "wind": round(min(100, wind_stress)),
        "humidity": round(min(100, humidity_stress)),
        "heat_dryness": round(min(100, heat_dryness_stress)),  # Palakkad summer stress
        "rainfall_benefit": round(rainfall_benefit),  # Stress reduction from rain
        "level": "Critical" if overall_stress >= 65 else "High" if overall_stress >= 45 else "Moderate" if overall_stress >= 22 else "Low",
        "sensitivity_factor": round(sensitivity, 2)
    }


# -----------------------------
# PEST RISK ASSESSMENT
# -----------------------------
def assess_pest_risk(crop, climate, growth_stage_info):
    """Assess pest and disease risk based on conditions"""
    
    pest_info = PEST_DATABASE.get(crop, PEST_DATABASE.get("Rice"))
    temp = climate["t2m_C"]
    humidity = climate.get("humidity", 70)
    rain = climate["tp_mm"]
    
    risks = []
    conditions = []
    
    # Determine weather condition type
    if humidity > 80 and temp > 28:
        conditions.append("high_humidity_high_temp")
    if humidity > 80 and temp < 22:
        conditions.append("high_humidity_low_temp")
    if humidity < 50 and rain < 2:
        conditions.append("dry_conditions")
    if rain > 15:
        conditions.append("monsoon")
    
    # Collect relevant pests
    for condition in conditions:
        pests = pest_info.get(condition, [])
        for pest in pests:
            if pest not in [r["name"] for r in risks]:
                severity = "High" if growth_stage_info["pest_risk"] in ["High", "Very High"] else "Moderate"
                risks.append({"name": pest, "severity": severity, "condition": condition})
    
    # Always include general pests at lower priority
    for pest in pest_info.get("general", []):
        if pest not in [r["name"] for r in risks]:
            risks.append({"name": pest, "severity": "Monitor", "condition": "general"})
    
    return risks[:6]  # Return top 6 risks


# -----------------------------
# IRRIGATION SCHEDULER
# -----------------------------
def calculate_irrigation(crop, climate, growth_stage_info, forecast):
    """Calculate irrigation schedule and requirements"""
    
    thresholds = CROP_THRESHOLDS.get(crop, DEFAULT_THRESHOLDS)
    soil = climate["swvl1"]
    sm_opt_min, sm_opt_max = thresholds["soil_moisture_optimal"]
    et0 = climate.get("et0", 4)  # Reference evapotranspiration
    
    # Crop coefficient based on stage
    kc_map = {
        "Germination": 0.3, "Seedling": 0.4, "Emergence": 0.4,
        "Vegetative": 0.8, "Tillering": 0.9, "Vegetative Growth": 0.7,
        "Flowering": 1.15, "Tasseling": 1.1, "Silking": 1.15,
        "Grain Filling": 1.0, "Pod Development": 0.9, "Boll Development": 0.9,
        "Maturity": 0.6, "Harvest Ready": 0.3
    }
    
    stage = growth_stage_info["name"]
    kc = kc_map.get(stage, 0.8)
    
    # Daily crop water requirement (ETc)
    etc = et0 * kc
    
    # Check soil moisture deficit
    deficit = max(0, sm_opt_min - soil)
    
    # Consider rainfall forecast
    expected_rain = sum(day.get("rainfall", 0) for day in forecast[:3]) if forecast else 0
    
    # Irrigation recommendation
    if soil < sm_opt_min * 0.8:
        urgency = "Immediate"
        recommendation = f"Irrigate immediately. Soil moisture critically low at {soil*100:.0f}%."
    elif soil < sm_opt_min:
        urgency = "Within 24 hours"
        recommendation = f"Schedule irrigation within 24 hours. Current: {soil*100:.0f}%, Target: {sm_opt_min*100:.0f}%."
    elif expected_rain > 10:
        urgency = "Postpone"
        recommendation = f"Expected rainfall {expected_rain:.0f}mm in next 3 days. Delay irrigation."
    else:
        urgency = "Monitor"
        recommendation = f"Soil moisture adequate at {soil*100:.0f}%. Next check in 2-3 days."
    
    return {
        "urgency": urgency,
        "recommendation": recommendation,
        "water_requirement_mm": round(etc, 1),
        "soil_moisture_current": round(soil * 100),
        "soil_moisture_target": round(sm_opt_max * 100),
        "deficit_mm": round(deficit * 100, 1),
        "crop_coefficient": kc,
        "et0": round(et0, 1)
    }


# -----------------------------
# FERTILIZER RECOMMENDATIONS
# -----------------------------
def get_fertilizer_recommendations(crop, growth_stage_info, days_since_sowing):
    """Get stage-specific fertilizer recommendations"""
    
    fertilizer_schedule = {
        "Rice": {
            "Germination": [],
            "Seedling": [{"type": "NPK 20:20:20", "amount": "50 kg/ha", "method": "Basal application"}],
            "Tillering": [
                {"type": "Urea", "amount": "40 kg/ha", "method": "Top dressing"},
                {"type": "MOP", "amount": "25 kg/ha", "method": "Broadcasting"}
            ],
            "Panicle Initiation": [{"type": "Urea", "amount": "30 kg/ha", "method": "Top dressing"}],
            "Flowering": [{"type": "Foliar KNO3", "amount": "5 kg in 500L water/ha", "method": "Foliar spray"}],
            "Grain Filling": [],
            "Maturity": []
        },
        "Coconut": {
            "Establishment": [{"type": "Organic manure", "amount": "25 kg/palm", "method": "Pit application"}],
            "Vegetative Growth": [{"type": "NPK 6:6:18", "amount": "1.3 kg/palm", "method": "Ring application"}],
            "Pre-bearing": [{"type": "NPK 6:6:18", "amount": "1.5 kg/palm", "method": "Ring application"}],
            "Full Production": [
                {"type": "Urea", "amount": "1 kg/palm", "method": "Split application"},
                {"type": "Muriate of Potash", "amount": "2 kg/palm", "method": "Basin application"}
            ]
        },
        "Sugarcane": {
            "Germination": [{"type": "FYM", "amount": "25 t/ha", "method": "Field preparation"}],
            "Early Growth": [{"type": "Urea", "amount": "75 kg/ha", "method": "Top dressing"}],
            "Active Tillering": [{"type": "Urea", "amount": "75 kg/ha", "method": "Earthing up"}],
            "Grand Growth": [{"type": "MOP", "amount": "100 kg/ha", "method": "Broadcasting"}]
        }
    }
    
    stage = growth_stage_info["name"]
    recommendations = fertilizer_schedule.get(crop, {}).get(stage, [])
    
    if not recommendations:
        recommendations = [{"type": "No fertilizer needed", "amount": "-", "method": "Continue monitoring"}]
    
    return recommendations


# -----------------------------
# AI MODEL PREDICTION (ENSEMBLE)
# LSTM + Random Forest + Gradient Boosting + MLP
# -----------------------------
def softmax(x):
    """Apply softmax to convert raw outputs to probabilities"""
    exp_x = np.exp(x - np.max(x))  # Subtract max for numerical stability
    return exp_x / exp_x.sum()

def run_lstm_prediction(X_scaled):
    """Run LSTM prediction"""
    try:
        X_reshaped = X_scaled.reshape(1, 1, len(features))
        raw_pred = model.predict(X_reshaped, verbose=0)[0]
        pred = softmax(raw_pred)
        return pred, np.argmax(pred), float(pred[np.argmax(pred)])
    except Exception as e:
        print(f"LSTM error: {e}")
        return None, None, 0

def run_rf_prediction(X_scaled):
    """Run Random Forest prediction"""
    try:
        pred_proba = rf_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"RF error: {e}")
        return None, None, 0

def run_gb_prediction(X_scaled):
    """Run Gradient Boosting prediction"""
    try:
        pred_proba = gb_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"GB error: {e}")
        return None, None, 0

def run_mlp_prediction(X_scaled):
    """Run MLP Neural Network prediction"""
    try:
        pred_proba = mlp_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"MLP error: {e}")
        return None, None, 0

def run_et_prediction(X_scaled):
    """Run Extra Trees prediction"""
    try:
        pred_proba = et_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"Extra Trees error: {e}")
        return None, None, 0

def run_ada_prediction(X_scaled):
    """Run AdaBoost prediction"""
    try:
        pred_proba = ada_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"AdaBoost error: {e}")
        return None, None, 0

def run_svm_prediction(X_scaled):
    """Run SVM prediction"""
    try:
        pred_proba = svm_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"SVM error: {e}")
        return None, None, 0

def run_xgb_prediction(X_scaled):
    """Run XGBoost prediction"""
    try:
        if xgb_model is None:
            return None, None, 0
        pred_proba = xgb_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"XGBoost error: {e}")
        return None, None, 0

def run_nb_prediction(X_scaled):
    """Run Naive Bayes prediction (fast probabilistic classifier)"""
    try:
        if nb_model is None:
            return None, None, 0
        pred_proba = nb_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"Naive Bayes error: {e}")
        return None, None, 0

def run_knn_prediction(X_scaled):
    """Run K-Nearest Neighbors prediction (instance-based learning)"""
    try:
        if knn_model is None:
            return None, None, 0
        pred_proba = knn_model.predict_proba(X_scaled)[0]
        pred_class = np.argmax(pred_proba)
        return pred_proba, pred_class, float(pred_proba[pred_class])
    except Exception as e:
        print(f"KNN error: {e}")
        return None, None, 0

def run_small_weather_prediction(climate, forecast_data=None):
    """Run small weather model ensemble (Persistence, SMA, ETS, Anomaly)"""
    try:
        # Run all small weather models
        persistence = small_weather_models.persistence_model(climate)
        sma = small_weather_models.simple_moving_average(forecast_data or [])
        ets = small_weather_models.exponential_smoothing(forecast_data or [])
        climatology = small_weather_models.climatology_model()
        anomalies = small_weather_models.anomaly_detection(climate, forecast_data or [])
        linear_trend = small_weather_models.linear_trend_forecast(forecast_data or [])
        
        # Aggregate stress prediction from small models
        stress_indicators = 0
        
        # Anomaly-based stress
        if anomalies["risk_level"] == "Critical":
            stress_indicators += 50
        elif anomalies["risk_level"] == "High":
            stress_indicators += 30
        elif anomalies["risk_level"] == "Moderate":
            stress_indicators += 15
        
        # Trend-based stress (warming trends are concerning)
        if linear_trend.get("trend_direction") == "warming":
            stress_indicators += 10
        
        # Convert to class probabilities
        if stress_indicators >= 40:
            pred_class = 2  # High Stress
            proba = [0.15, 0.25, 0.60]
        elif stress_indicators >= 20:
            pred_class = 1  # Low Stress
            proba = [0.25, 0.55, 0.20]
        else:
            pred_class = 0  # Normal
            proba = [0.65, 0.25, 0.10]
        
        details = {
            "persistence_forecast": persistence[:2] if persistence else [],
            "moving_average": sma,
            "exponential_smoothing": ets,
            "climatology": climatology,
            "anomaly_analysis": anomalies,
            "linear_trend": linear_trend
        }
        
        return np.array(proba), pred_class, float(proba[pred_class]), details
    except Exception as e:
        print(f"Small weather models error: {e}")
        return None, None, 0, {}

def run_physics_prediction(climate, crop="Rice"):
    """Run Physics-based NWP-style prediction (GDD, ET0, WSI)"""
    try:
        result = weather_physics.predict_stress_physics(climate, crop)
        return result["probabilities"], result["class"], result["confidence"], result["details"]
    except Exception as e:
        print(f"Physics model error: {e}")
        return None, None, 0, {}

def run_rule_based_prediction(climate):
    """Rule-based fallback prediction using agricultural knowledge
    
    Enhanced with more granular rules and realistic probability distributions
    """
    temp = climate['t2m_C']
    rain = climate['tp_mm']
    soil = climate['swvl1']
    wind = climate['wind_speed']
    humidity = climate.get('humidity', 70)
    
    stress_score = 0
    stress_factors = []
    
    # Temperature rules (more sensitive)
    if temp < 15 or temp > 40:
        stress_score += 45
        stress_factors.append("extreme_temp")
    elif temp < 18 or temp > 36:
        stress_score += 28
        stress_factors.append("severe_temp")
    elif temp < 22 or temp > 32:
        stress_score += 15
        stress_factors.append("suboptimal_temp")
    elif temp < 24 or temp > 30:
        stress_score += 5  # Slight deviation
    
    # Rainfall rules (more nuanced)
    if rain > 80:
        stress_score += 40  # Flood risk
        stress_factors.append("flooding")
    elif rain > 50:
        stress_score += 25
        stress_factors.append("heavy_rain")
    elif rain > 25:
        stress_score += 12
    elif rain == 0:
        stress_score += 18  # No rain is also a concern
        stress_factors.append("drought")
    elif rain < 3:
        stress_score += 10
    
    # Soil moisture rules (key indicator)
    if soil < 0.15 or soil > 0.58:
        stress_score += 40
        stress_factors.append("critical_moisture")
    elif soil < 0.22 or soil > 0.50:
        stress_score += 25
        stress_factors.append("poor_moisture")
    elif soil < 0.28 or soil > 0.45:
        stress_score += 12
    elif soil < 0.32 or soil > 0.42:
        stress_score += 5  # Slight
    
    # Wind rules (crop damage)
    if wind > 50:
        stress_score += 35
        stress_factors.append("storm")
    elif wind > 35:
        stress_score += 22
        stress_factors.append("strong_wind")
    elif wind > 25:
        stress_score += 12
    elif wind > 18:
        stress_score += 5
    
    # Humidity rules (disease risk)
    if humidity > 90:
        stress_score += 15
        stress_factors.append("high_humidity")
    elif humidity < 40:
        stress_score += 12
        stress_factors.append("low_humidity")
    
    # Interaction effects
    if "drought" in stress_factors and ("suboptimal_temp" in stress_factors or "severe_temp" in stress_factors):
        stress_score += 12  # Heat + drought
    if "flooding" in stress_factors and "high_humidity" in stress_factors:
        stress_score += 10  # Disease risk
    
    # Convert to class with more realistic probability distributions
    if stress_score >= 55:
        pred_class = 2  # High Stress
        # Higher confidence for extreme stress
        high_conf = min(0.85, 0.55 + stress_score / 200)
        proba = [0.08, 0.92 - high_conf, high_conf]
    elif stress_score >= 35:
        pred_class = 2  # Moderate-High Stress
        proba = [0.15, 0.35, 0.50]
    elif stress_score >= 22:
        pred_class = 1  # Low-Moderate Stress
        proba = [0.25, 0.50, 0.25]
    elif stress_score >= 12:
        pred_class = 1  # Low Stress
        proba = [0.35, 0.45, 0.20]
    elif stress_score >= 5:
        pred_class = 0  # Near-Normal
        proba = [0.55, 0.35, 0.10]
    else:
        pred_class = 0  # Normal
        proba = [0.65, 0.25, 0.10]
    
    return np.array(proba), pred_class, proba[pred_class]

def run_ai_prediction(climate, crop="Rice"):
    """Run ensemble AI prediction with multiple models for reliability
    
    Models included (13 total):
    - Deep Learning: LSTM (h5 file), MLP
    - Tree-based: RandomForest, GradientBoosting, XGBoost, ExtraTrees, AdaBoost
    - Other ML: SVM, NaiveBayes, KNN
    - Physics/NWP: WeatherPhysics (GDD, ET0, WSI)
    - Small Weather: Persistence, SMA, Exponential Smoothing, Anomaly Detection
    - Rule-based: Agricultural knowledge fallback
    """
    stress_map = {0: "Normal", 1: "Low Stress", 2: "High Stress"}
    
    try:
        X = np.array([[climate[f] for f in features]])
        X_scaled = scaler.transform(X)
        
        # Collect predictions from all models
        model_results = {}
        ensemble_probs = []
        ensemble_classes = []
        physics_details = {}
        small_weather_analysis = {}
        
        # ========================================
        # DEEP LEARNING MODELS
        # ========================================
        
        # 1. LSTM Model (Primary - h5 file)
        lstm_proba, lstm_class, lstm_conf = run_lstm_prediction(X_scaled)
        if lstm_proba is not None:
            model_results["LSTM"] = {
                "prediction": stress_map[lstm_class],
                "confidence": round(lstm_conf, 3),
                "category": "Deep Learning",
                "probabilities": {
                    "Normal": round(float(lstm_proba[0]), 3),
                    "Low Stress": round(float(lstm_proba[1]), 3),
                    "High Stress": round(float(lstm_proba[2]), 3)
                }
            }
            ensemble_probs.append(lstm_proba)
            ensemble_classes.append(lstm_class)
        
        # 2. MLP Neural Network
        if ENSEMBLE_AVAILABLE and mlp_model:
            mlp_proba, mlp_class, mlp_conf = run_mlp_prediction(X_scaled)
            if mlp_proba is not None:
                model_results["MLP"] = {
                    "prediction": stress_map[mlp_class],
                    "confidence": round(mlp_conf, 3),
                    "category": "Deep Learning",
                    "probabilities": {
                        "Normal": round(float(mlp_proba[0]), 3),
                        "Low Stress": round(float(mlp_proba[1]), 3),
                        "High Stress": round(float(mlp_proba[2]), 3)
                    }
                }
                ensemble_probs.append(mlp_proba)
                ensemble_classes.append(mlp_class)
        
        # ========================================
        # TREE-BASED MODELS
        # ========================================
        
        # 3. Random Forest Model
        if ENSEMBLE_AVAILABLE and rf_model:
            rf_proba, rf_class, rf_conf = run_rf_prediction(X_scaled)
            if rf_proba is not None:
                model_results["RandomForest"] = {
                    "prediction": stress_map[rf_class],
                    "confidence": round(rf_conf, 3),
                    "category": "Tree Ensemble",
                    "probabilities": {
                        "Normal": round(float(rf_proba[0]), 3),
                        "Low Stress": round(float(rf_proba[1]), 3),
                        "High Stress": round(float(rf_proba[2]), 3)
                    }
                }
                ensemble_probs.append(rf_proba)
                ensemble_classes.append(rf_class)
        
        # 4. Gradient Boosting Model
        if ENSEMBLE_AVAILABLE and gb_model:
            gb_proba, gb_class, gb_conf = run_gb_prediction(X_scaled)
            if gb_proba is not None:
                model_results["GradientBoosting"] = {
                    "prediction": stress_map[gb_class],
                    "confidence": round(gb_conf, 3),
                    "category": "Tree Ensemble",
                    "probabilities": {
                        "Normal": round(float(gb_proba[0]), 3),
                        "Low Stress": round(float(gb_proba[1]), 3),
                        "High Stress": round(float(gb_proba[2]), 3)
                    }
                }
                ensemble_probs.append(gb_proba)
                ensemble_classes.append(gb_class)
        
        # 5. XGBoost (if available)
        if ENSEMBLE_AVAILABLE and xgb_model and XGBOOST_AVAILABLE:
            xgb_proba, xgb_class, xgb_conf = run_xgb_prediction(X_scaled)
            if xgb_proba is not None:
                model_results["XGBoost"] = {
                    "prediction": stress_map[xgb_class],
                    "confidence": round(xgb_conf, 3),
                    "category": "Tree Ensemble",
                    "probabilities": {
                        "Normal": round(float(xgb_proba[0]), 3),
                        "Low Stress": round(float(xgb_proba[1]), 3),
                        "High Stress": round(float(xgb_proba[2]), 3)
                    }
                }
                ensemble_probs.append(xgb_proba)
                ensemble_classes.append(xgb_class)
        
        # 6. Extra Trees
        if ENSEMBLE_AVAILABLE and et_model:
            et_proba, et_class, et_conf = run_et_prediction(X_scaled)
            if et_proba is not None:
                model_results["ExtraTrees"] = {
                    "prediction": stress_map[et_class],
                    "confidence": round(et_conf, 3),
                    "category": "Tree Ensemble",
                    "probabilities": {
                        "Normal": round(float(et_proba[0]), 3),
                        "Low Stress": round(float(et_proba[1]), 3),
                        "High Stress": round(float(et_proba[2]), 3)
                    }
                }
                ensemble_probs.append(et_proba)
                ensemble_classes.append(et_class)
        
        # 7. AdaBoost
        if ENSEMBLE_AVAILABLE and ada_model:
            ada_proba, ada_class, ada_conf = run_ada_prediction(X_scaled)
            if ada_proba is not None:
                model_results["AdaBoost"] = {
                    "prediction": stress_map[ada_class],
                    "confidence": round(ada_conf, 3),
                    "category": "Boosting",
                    "probabilities": {
                        "Normal": round(float(ada_proba[0]), 3),
                        "Low Stress": round(float(ada_proba[1]), 3),
                        "High Stress": round(float(ada_proba[2]), 3)
                    }
                }
                ensemble_probs.append(ada_proba)
                ensemble_classes.append(ada_class)
        
        # ========================================
        # OTHER ML MODELS
        # ========================================
        
        # 8. SVM
        if ENSEMBLE_AVAILABLE and svm_model:
            svm_proba, svm_class, svm_conf = run_svm_prediction(X_scaled)
            if svm_proba is not None:
                model_results["SVM"] = {
                    "prediction": stress_map[svm_class],
                    "confidence": round(svm_conf, 3),
                    "category": "Support Vector",
                    "probabilities": {
                        "Normal": round(float(svm_proba[0]), 3),
                        "Low Stress": round(float(svm_proba[1]), 3),
                        "High Stress": round(float(svm_proba[2]), 3)
                    }
                }
                ensemble_probs.append(svm_proba)
                ensemble_classes.append(svm_class)
        
        # 9. Naive Bayes
        if ENSEMBLE_AVAILABLE and nb_model:
            nb_proba, nb_class, nb_conf = run_nb_prediction(X_scaled)
            if nb_proba is not None:
                model_results["NaiveBayes"] = {
                    "prediction": stress_map[nb_class],
                    "confidence": round(nb_conf, 3),
                    "category": "Probabilistic",
                    "probabilities": {
                        "Normal": round(float(nb_proba[0]), 3),
                        "Low Stress": round(float(nb_proba[1]), 3),
                        "High Stress": round(float(nb_proba[2]), 3)
                    }
                }
                ensemble_probs.append(nb_proba)
                ensemble_classes.append(nb_class)
        
        # 10. K-Nearest Neighbors
        if ENSEMBLE_AVAILABLE and knn_model:
            knn_proba, knn_class, knn_conf = run_knn_prediction(X_scaled)
            if knn_proba is not None:
                model_results["KNN"] = {
                    "prediction": stress_map[knn_class],
                    "confidence": round(knn_conf, 3),
                    "category": "Instance-Based",
                    "probabilities": {
                        "Normal": round(float(knn_proba[0]), 3),
                        "Low Stress": round(float(knn_proba[1]), 3),
                        "High Stress": round(float(knn_proba[2]), 3)
                    }
                }
                ensemble_probs.append(knn_proba)
                ensemble_classes.append(knn_class)
        
        # ========================================
        # PHYSICS/NWP-BASED MODELS
        # ========================================
        
        # 11. Physics-based Weather Model (GDD, ET0, WSI)
        phys_proba, phys_class, phys_conf, phys_details = run_physics_prediction(climate, crop)
        if phys_proba is not None:
            model_results["WeatherPhysics"] = {
                "prediction": stress_map[phys_class],
                "confidence": round(phys_conf, 3),
                "category": "NWP/Physics",
                "probabilities": {
                    "Normal": round(float(phys_proba[0]), 3),
                    "Low Stress": round(float(phys_proba[1]), 3),
                    "High Stress": round(float(phys_proba[2]), 3)
                }
            }
            physics_details = phys_details
            ensemble_probs.append(phys_proba)
            ensemble_classes.append(phys_class)
        
        # ========================================
        # SMALL WEATHER FORECAST MODELS
        # ========================================
        
        # 12. Small Weather Models (Persistence, SMA, ETS, Anomaly)
        sw_proba, sw_class, sw_conf, sw_details = run_small_weather_prediction(climate, None)
        small_weather_analysis = sw_details  # Store for output
        if sw_proba is not None:
            model_results["SmallWeather"] = {
                "prediction": stress_map[sw_class],
                "confidence": round(sw_conf, 3),
                "category": "Forecast/Anomaly",
                "probabilities": {
                    "Normal": round(float(sw_proba[0]), 3),
                    "Low Stress": round(float(sw_proba[1]), 3),
                    "High Stress": round(float(sw_proba[2]), 3)
                }
            }
            ensemble_probs.append(sw_proba)
            ensemble_classes.append(sw_class)
        
        # ========================================
        # RULE-BASED FALLBACK
        # ========================================
        
        # 13. Rule-Based (Always available)
        rule_proba, rule_class, rule_conf = run_rule_based_prediction(climate)
        model_results["RuleBased"] = {
            "prediction": stress_map[rule_class],
            "confidence": round(rule_conf, 3),
            "category": "Expert Rules",
            "probabilities": {
                "Normal": round(float(rule_proba[0]), 3),
                "Low Stress": round(float(rule_proba[1]), 3),
                "High Stress": round(float(rule_proba[2]), 3)
            }
        }
        
        # ========================================
        # ENSEMBLE COMBINATION
        # ========================================
        
        if ensemble_probs:
            # Dynamic weights based on model reliability
            # Priority: LSTM > XGBoost > GB > RF > ET > MLP > KNN > SVM > AdaBoost > NB > Physics > SmallWeather
            base_weights = {
                "LSTM": 0.15,
                "XGBoost": 0.12,
                "GradientBoosting": 0.10,
                "RandomForest": 0.10,
                "ExtraTrees": 0.08,
                "MLP": 0.08,
                "KNN": 0.07,
                "SVM": 0.06,
                "AdaBoost": 0.06,
                "NaiveBayes": 0.05,
                "WeatherPhysics": 0.07,
                "SmallWeather": 0.06
            }
            
            # Build weights array in order of ensemble_probs
            model_names = [k for k in model_results.keys() if k != "RuleBased"][:len(ensemble_probs)]
            weights = [base_weights.get(name, 0.05) for name in model_names]
            weights = np.array(weights) / sum(weights)  # Normalize
            
            avg_proba = np.average(ensemble_probs, axis=0, weights=weights)
            ensemble_class = np.argmax(avg_proba)
            ensemble_conf = float(avg_proba[ensemble_class])
            
            # Voting: Check agreement
            vote_counts = {0: 0, 1: 0, 2: 0}
            for c in ensemble_classes:
                vote_counts[c] += 1
            majority_class = max(vote_counts, key=vote_counts.get)
            agreement = vote_counts[majority_class] / len(ensemble_classes)
            
            # Category summary
            category_votes = {}
            for name, result in model_results.items():
                if name == "RuleBased":
                    continue
                cat = result.get("category", "Other")
                pred = result["prediction"]
                if cat not in category_votes:
                    category_votes[cat] = {}
                category_votes[cat][pred] = category_votes[cat].get(pred, 0) + 1
        else:
            # Fallback to rule-based
            avg_proba = rule_proba
            ensemble_class = rule_class
            ensemble_conf = rule_conf
            agreement = 1.0
            category_votes = {}
        
        return {
            # Main ensemble prediction
            "prediction": stress_map[ensemble_class],
            "confidence": round(ensemble_conf, 3),
            "probabilities": {
                "Normal": round(float(avg_proba[0]), 3),
                "Low Stress": round(float(avg_proba[1]), 3),
                "High Stress": round(float(avg_proba[2]), 3)
            },
            
            # Ensemble metadata
            "ensemble": {
                "method": "Weighted Average + Majority Voting",
                "models_used": len(model_results),
                "ml_models": len([m for m in model_results if model_results[m].get("category") != "Expert Rules"]),
                "agreement": round(agreement, 2),
                "reliability": "High" if agreement >= 0.7 else "Medium" if agreement >= 0.5 else "Low",
                "category_consensus": category_votes
            },
            
            # Physics/NWP model details
            "weather_analysis": physics_details if physics_details else {
                "weather_severity_index": 0,
                "evapotranspiration_mm": 0,
                "daily_gdd": 0
            },
            
            # Small weather models analysis
            "small_weather": small_weather_analysis if 'small_weather_analysis' in dir() and small_weather_analysis else {
                "climatology": {},
                "anomaly_analysis": {"anomaly_count": 0, "risk_level": "Normal"},
                "linear_trend": {}
            },
            
            # Individual model predictions
            "individual_models": model_results
        }
        
    except Exception as e:
        print(f"AI Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "prediction": "Unknown",
            "confidence": 0.333,
            "probabilities": {"Normal": 0.333, "Low Stress": 0.333, "High Stress": 0.333},
            "ensemble": {"method": "Error", "models_used": 0, "agreement": 0, "reliability": "Error"},
            "weather_analysis": {},
            "small_weather": {},
            "individual_models": {}
        }


# -----------------------------
# CALIBRATE AI PREDICTION WITH STRESS
# Ensures AI prediction aligns with calculated stress levels
# -----------------------------
def calibrate_ai_with_stress(ai_prediction, stress):
    """
    Validate AI prediction with stress calculation (minimal adjustment).
    
    AI MODELS ARE PRIMARY AND TRUSTED!
    This function only adds validation metadata and applies very minor
    adjustment in case of extreme mismatch (e.g., AI says Normal but 
    stress is Critical).
    
    With properly trained Palakkad-specific models, AI should be accurate.
    """
    if not ai_prediction or not stress:
        return ai_prediction
    
    stress_overall = stress.get("overall", 0)
    stress_level = stress.get("level", "Low")
    
    # Get original AI probabilities
    orig_probs = ai_prediction.get("probabilities", {})
    orig_normal = orig_probs.get("Normal", 0.33)
    orig_low = orig_probs.get("Low Stress", 0.33)
    orig_high = orig_probs.get("High Stress", 0.33)
    orig_prediction = ai_prediction.get("prediction", "Normal")
    
    # Determine if there's an EXTREME mismatch (rarely happens with good training)
    # Only apply adjustment for severe contradictions
    ai_predicts_normal = orig_prediction == "Normal" and orig_normal > 0.55
    stress_is_critical = stress_overall >= 70  # Very high threshold
    
    if ai_predicts_normal and stress_is_critical:
        # Extreme mismatch: AI says Normal but stress is Critical
        # Apply small adjustment (AI still 75% weight)
        mismatch = "extreme_mismatch"
        ai_weight = 0.75
        stress_weight = 0.25
    else:
        # No mismatch - Trust AI completely (100%)
        # Just return with validation metadata
        calibrated_prediction = ai_prediction.copy()
        calibrated_prediction["calibration"] = {
            "method": "AI-Driven (No Adjustment)",
            "ai_weight": "100%",
            "stress_weight": "0%",
            "mismatch_type": "none",
            "stress_level": stress_level,
            "stress_overall": stress_overall,
            "original_prediction": orig_prediction,
            "original_confidence": ai_prediction.get("confidence"),
            "calibration_applied": False,
            "note": f"AI prediction trusted. Stress validation: {stress_level} ({stress_overall}%)"
        }
        if "ensemble" in calibrated_prediction:
            calibrated_prediction["ensemble"]["ai_driven"] = True
            calibrated_prediction["ensemble"]["stress_adjusted"] = False
            calibrated_prediction["ensemble"]["validation_note"] = f"Validated by stress analysis ({stress_overall}% {stress_level})"
        return calibrated_prediction
    
    # Calculate stress-based target probabilities (only for extreme cases)
    if stress_overall >= 70:
        target_normal = 0.10
        target_low = 0.25
        target_high = 0.65
    elif stress_overall >= 55:
        target_normal = 0.15
        target_low = 0.40
        target_high = 0.45
    else:
        target_normal = 0.30
        target_low = 0.45
        target_high = 0.25
    
    # Blend: AI still primary even in mismatch
    calibrated_normal = orig_normal * ai_weight + target_normal * stress_weight
    calibrated_low = orig_low * ai_weight + target_low * stress_weight
    calibrated_high = orig_high * ai_weight + target_high * stress_weight
    
    # Normalize to ensure sum = 1.0
    total = calibrated_normal + calibrated_low + calibrated_high
    calibrated_normal /= total
    calibrated_low /= total
    calibrated_high /= total
    
    # Determine new prediction class
    new_probs = {"Normal": calibrated_normal, "Low Stress": calibrated_low, "High Stress": calibrated_high}
    new_prediction = max(new_probs, key=new_probs.get)
    new_confidence = new_probs[new_prediction]
    
    # Update the AI prediction with calibrated values
    calibrated_prediction = ai_prediction.copy()
    calibrated_prediction["prediction"] = new_prediction
    calibrated_prediction["confidence"] = round(new_confidence, 3)
    calibrated_prediction["probabilities"] = {
        "Normal": round(calibrated_normal, 3),
        "Low Stress": round(calibrated_low, 3),
        "High Stress": round(calibrated_high, 3)
    }
    
    # Add calibration metadata
    adjustment_applied = new_prediction != orig_prediction
    calibrated_prediction["calibration"] = {
        "method": "AI-Primary with Stress Validation",
        "ai_weight": f"{int(ai_weight*100)}%",
        "stress_weight": f"{int(stress_weight*100)}%",
        "mismatch_type": mismatch,
        "stress_level": stress_level,
        "stress_overall": stress_overall,
        "original_prediction": orig_prediction,
        "original_confidence": ai_prediction.get("confidence"),
        "calibration_applied": adjustment_applied,
        "note": f"AI models drive prediction ({int(ai_weight*100)}%). Stress provides validation ({int(stress_weight*100)}%)." if mismatch == "none" else f"Adjusted due to {mismatch.replace('_', ' ')} - AI {int(ai_weight*100)}% + Stress {int(stress_weight*100)}%"
    }
    
    # Also update the ensemble info to show calibration was applied
    if "ensemble" in calibrated_prediction:
        calibrated_prediction["ensemble"]["ai_driven"] = True
        if adjustment_applied:
            calibrated_prediction["ensemble"]["stress_adjusted"] = True
            calibrated_prediction["ensemble"]["calibration_note"] = f"AI: {orig_prediction} → Validated: {new_prediction} (stress: {stress_overall}%)"
        else:
            calibrated_prediction["ensemble"]["stress_adjusted"] = False
            calibrated_prediction["ensemble"]["calibration_note"] = f"AI prediction confirmed by stress analysis ({stress_overall}%)"
    
    return calibrated_prediction


# -----------------------------
# GENERATE COMPREHENSIVE ADVISORIES
# -----------------------------
def generate_advisories(crop, climate, stress, growth_info, pest_risks, irrigation, ai_pred):
    """Generate prioritized actionable advisories"""
    
    advisories = []
    
    # Critical alerts first
    if stress["overall"] >= 70:
        advisories.append({
            "priority": "CRITICAL",
            "icon": "🚨",
            "message": f"CROP STRESS CRITICAL ({stress['overall']}%): Immediate intervention required",
            "action": "Assess field conditions immediately and implement stress mitigation measures"
        })
    
    if ai_pred["prediction"] == "High Stress" and ai_pred["confidence"] > 70:
        advisories.append({
            "priority": "HIGH",
            "icon": "🤖",
            "message": f"AI Model predicts High Stress ({ai_pred['confidence']:.0f}% confidence)",
            "action": "Review all weather parameters and optimize irrigation"
        })
    
    # Temperature advisories
    temp = climate["t2m_C"]
    if temp > 35:
        advisories.append({
            "priority": "HIGH",
            "icon": "🌡️",
            "message": f"Extreme heat: {temp:.1f}°C - Heat stress risk",
            "action": "Increase irrigation frequency, apply mulch, avoid field operations 11am-3pm"
        })
    elif temp > 32:
        advisories.append({
            "priority": "MODERATE",
            "icon": "⚠️",
            "message": f"High temperature: {temp:.1f}°C",
            "action": "Monitor crop for wilting, ensure adequate soil moisture"
        })
    elif temp < 15:
        advisories.append({
            "priority": "MODERATE",
            "icon": "❄️",
            "message": f"Low temperature: {temp:.1f}°C - Cold stress risk",
            "action": "Delay sowing/transplanting if applicable, protect young plants"
        })
    
    # Irrigation advisories
    if irrigation["urgency"] == "Immediate":
        advisories.append({
            "priority": "HIGH",
            "icon": "💧",
            "message": irrigation["recommendation"],
            "action": f"Apply {irrigation['water_requirement_mm']}mm irrigation immediately"
        })
    elif irrigation["urgency"] == "Within 24 hours":
        advisories.append({
            "priority": "MODERATE",
            "icon": "💧",
            "message": irrigation["recommendation"],
            "action": "Schedule irrigation for early morning or late evening"
        })
    
    # Rainfall advisories
    rain = climate["tp_mm"]
    if rain > 40:
        advisories.append({
            "priority": "HIGH",
            "icon": "🌧️",
            "message": f"Heavy rainfall: {rain:.0f}mm - Waterlogging risk",
            "action": "Check drainage, avoid field entry for 48 hours, watch for fungal diseases"
        })
    elif rain > 20:
        advisories.append({
            "priority": "MODERATE",
            "icon": "🌧️",
            "message": f"Significant rainfall: {rain:.0f}mm",
            "action": "Delay fertilizer/pesticide application, check field drainage"
        })
    
    # Wind advisories
    wind = climate["wind_speed"]
    if wind > 25:
        advisories.append({
            "priority": "HIGH",
            "icon": "💨",
            "message": f"Strong winds: {wind:.0f} km/h - Crop damage risk",
            "action": "Avoid spraying operations, check crop support structures"
        })
    elif wind > 15:
        advisories.append({
            "priority": "MODERATE",
            "icon": "💨",
            "message": f"Moderate winds: {wind:.0f} km/h",
            "action": "Spray only if absolutely necessary, use drift-reducing nozzles"
        })
    
    # Pest alerts
    high_pest_risks = [p for p in pest_risks if p["severity"] == "High"]
    if high_pest_risks:
        pest_names = ", ".join([p["name"] for p in high_pest_risks[:3]])
        advisories.append({
            "priority": "HIGH",
            "icon": "🐛",
            "message": f"High pest/disease risk: {pest_names}",
            "action": "Scout fields regularly, prepare appropriate control measures"
        })
    
    # Stage-specific advisory
    if growth_info["fertilizer"] != "None":
        advisories.append({
            "priority": "INFO",
            "icon": "🌱",
            "message": f"{growth_info['name']} stage: {growth_info['fertilizer']} recommended",
            "action": f"Apply fertilizer if not done. Stage progress: {growth_info['progress']}%"
        })
    
    # Normal conditions message
    if not advisories:
        advisories.append({
            "priority": "INFO",
            "icon": "✅",
            "message": "Conditions favorable for crop growth",
            "action": "Continue routine field monitoring and maintenance"
        })
    
    return advisories


# -----------------------------
# 7-DAY STRESS FORECAST ENGINE
# Applies ML ensemble to each forecast day's weather
# -----------------------------
def generate_daily_recommendations(day, date, crop, climate, stress_label, stress_scores, growth_info):
    """Generate detailed, actionable recommendations for a specific forecast day."""
    recs = []
    temp = climate["t2m_C"]
    t_max = climate.get("t_max", temp + 4)
    rain = climate["tp_mm"]
    soil = climate["swvl1"]
    wind = climate["wind_speed"]
    precip_prob = climate.get("precip_prob", 20)
    thresholds = CROP_THRESHOLDS.get(crop, DEFAULT_THRESHOLDS)
    sm_opt_min, sm_opt_max = thresholds["soil_moisture_optimal"]
    stage = growth_info.get("name", "Vegetative")
    day_label = f"Day {day}" + (f" ({date})" if date else "")

    # --- Irrigation ---
    if soil < sm_opt_min * 0.8:
        mm_needed = round((sm_opt_min - soil) * 1000, 0)
        recs.append({
            "category": "Irrigation", "priority": "Critical", "icon": "💧",
            "title": f"{day_label}: Emergency Irrigation Required",
            "detail": (f"Soil moisture critically low at {soil*100:.0f}% (target: "
                       f"{sm_opt_min*100:.0f}–{sm_opt_max*100:.0f}%). Apply ≈{mm_needed:.0f}mm water."),
            "action": (f"Irrigate early morning (5–7 AM). "
                       f"Rain probability: {precip_prob}% — do not wait if <30%.")
        })
    elif soil < sm_opt_min:
        recs.append({
            "category": "Irrigation", "priority": "High", "icon": "💧",
            "title": f"{day_label}: Schedule Irrigation",
            "detail": (f"Soil moisture {soil*100:.0f}% is below optimal "
                       f"({sm_opt_min*100:.0f}–{sm_opt_max*100:.0f}%). Crop water deficit building."),
            "action": (f"2-hour irrigation early morning. Skip if rain probability >50% "
                       f"(currently {precip_prob}%).")
        })
    elif rain >= 5:
        recs.append({
            "category": "Irrigation", "priority": "Info", "icon": "🌧️",
            "title": f"{day_label}: Rain Expected – Skip Irrigation",
            "detail": f"{rain:.0f}mm forecast. Soil moisture: {soil*100:.0f}%.",
            "action": "Clear drainage channels before rain. Monitor soil post-rain to avoid waterlogging."
        })

    # --- Temperature stress ---
    if t_max > 38:
        recs.append({
            "category": "Heat Management", "priority": "Critical", "icon": "🌡️",
            "title": f"{day_label}: Extreme Heat Alert (max {t_max:.0f}°C)",
            "detail": (f"Temperatures above 38°C cause pollen sterility in {stage} stage. "
                       f"Yield loss can exceed 20% per day of exposure."),
            "action": ("Irrigate twice — dawn and dusk. Apply kaolin clay foliar spray (5%) "
                       "to reduce leaf temperature. Avoid all field operations 10AM–4PM.")
        })
    elif temp > 35:
        recs.append({
            "category": "Heat Management", "priority": "High", "icon": "🌡️",
            "title": f"{day_label}: High Temperature ({temp:.0f}°C)",
            "detail": (f"{stage} stage is under heat stress. Transpiration demand exceeds "
                       f"uptake capacity at this temperature."),
            "action": ("Irrigate in early morning. Apply foliar potassium (KNO₃ 5g/L) "
                       "to improve stress tolerance. Avoid urea top-dressing today.")
        })
    elif temp > 32 and stress_label != "Normal":
        recs.append({
            "category": "Heat Management", "priority": "Moderate", "icon": "⚠️",
            "title": f"{day_label}: Warm Conditions ({temp:.0f}°C)",
            "detail": f"Combined with low moisture, warm temp accelerates stress in {stage} stage.",
            "action": "Maintain soil moisture. Monitor for leaf rolling (first drought sign)."
        })

    # --- Rainfall / waterlogging ---
    if rain > 60:
        recs.append({
            "category": "Flood/Drainage", "priority": "Critical", "icon": "🌊",
            "title": f"{day_label}: Heavy Rain Warning ({rain:.0f}mm)",
            "detail": (f"Waterlogging > 24h causes anaerobic stress and root damage in {stage} stage. "
                       f"Disease pressure will spike 24–48h after heavy rain."),
            "action": ("Open all drainage channels NOW. After rain: scout for blast, sheath blight. "
                       "Do NOT apply fertilizer for 72h. Delay all pesticide sprays.")
        })
    elif rain > 30:
        recs.append({
            "category": "Drainage", "priority": "High", "icon": "🌧️",
            "title": f"{day_label}: Significant Rainfall ({rain:.0f}mm)",
            "detail": f"Excess water risk. {stage} stage susceptible to soil compaction and fungal diseases.",
            "action": ("Check field bunds and drainage. Delay any fertilizer application by 48h. "
                       "Scout for fungal symptoms 2 days after rain.")
        })

    # --- Wind damage ---
    if wind > 30:
        recs.append({
            "category": "Wind Protection", "priority": "High", "icon": "💨",
            "title": f"{day_label}: Strong Wind Warning ({wind:.0f} km/h)",
            "detail": (f"Wind above 30 km/h causes lodging in tall-standing crops at {stage} stage. "
                       f"Spray drift risk is also high."),
            "action": ("Cancel all spraying operations. Install wind barriers if available. "
                       "Check crop support structures. Assess lodging risk after wind event.")
        })
    elif wind > 20:
        recs.append({
            "category": "Wind", "priority": "Moderate", "icon": "💨",
            "title": f"{day_label}: Moderate Wind ({wind:.0f} km/h)",
            "detail": "Spray drift possible. Moderate desiccation risk if soil is already dry.",
            "action": "Use drift-reducing nozzles if spraying essential. Spray early morning only."
        })

    # --- Growth-stage critical advisories ---
    critical_stages = {
        "Flowering": {
            "priority": "Critical",
            "title": f"{day_label}: CRITICAL – Flowering Stage",
            "detail": (f"Flowering is the most stress-sensitive stage. Any temperature >35°C, "
                       f"wind >20 km/h, or water stress causes irreversible spikelet sterility."),
            "action": ("Maintain soil moisture at field capacity. NO spraying during anthesis "
                       "(10AM–2PM). If temp >35°C today, prioritise evening irrigation.")
        },
        "Panicle Initiation": {
            "priority": "High",
            "title": f"{day_label}: Panicle Initiation — Yield-Determining Stage",
            "detail": ("Panicle initiation determines spikelet number. Stress now directly "
                       "reduces potential yield. Apply K fertiliser if not done."),
            "action": ("Apply MOP 25 kg/ha if not applied. Ensure soil moisture. "
                       "Scout for stem borer (check for dead hearts).")
        },
        "Grain Filling": {
            "priority": "Moderate",
            "title": f"{day_label}: Grain Filling – Maintain Nutrition",
            "detail": ("Adequate N and K during grain filling improves grain weight and quality. "
                       "Water deficit now reduces 1000-grain weight."),
            "action": ("Apply foliar KNO₃ (5g/L) if temperature stress. "
                       "Maintain moderate irrigation. Do not allow soil to dry out.")
        }
    }
    if stage in critical_stages and stress_label in ("Low Stress", "High Stress"):
        cfg = critical_stages[stage]
        recs.append({
            "category": "Growth Stage", "icon": "🌾",
            **cfg
        })

    # --- Pest/disease risk triggered by weather ---
    if climate.get("humidity", 70) > 85 and temp > 26:
        recs.append({
            "category": "Disease Alert", "priority": "High", "icon": "🦠",
            "title": f"{day_label}: High Disease Risk (Humidity {climate.get('humidity',70):.0f}%)",
            "detail": ("Warm + humid conditions favour Blast, Sheath Blight, and Brown Leaf Spot. "
                       "Disease cycle is fastest 24–48h after wet weather."),
            "action": ("Scout fields for lesions. If >5% leaf area affected, apply fungicide "
                       "(Tricyclazole 18 g/acre for Blast; Hexaconazole for Sheath Blight). "
                       "Do NOT spray during wind or rain.")
        })

    # --- Normal / good-day advisory ---
    if stress_label == "Normal" and not recs:
        recs.append({
            "category": "Monitoring", "priority": "Info", "icon": "✅",
            "title": f"{day_label}: Favorable Growing Conditions",
            "detail": (f"Temperature {temp:.0f}°C, Rainfall {rain:.0f}mm — within optimal range "
                       f"for {crop} at {stage} stage."),
            "action": ("Routine scouting (check for pests, disease). "
                       "Confirm irrigation schedule for the week. Record field observations.")
        })

    return recs


def calculate_7day_stress_predictions(forecast_7day, crop, days_since_sowing, current_soil=0.30):
    """
    Apply ML ensemble to each of the 7 forecast days.

    Uses a simple water-balance model to evolve soil moisture day-by-day
    from current measured value, then runs RF+GB+ET+rules ensemble for each day.
    Returns list of per-day dicts with stress prediction and detailed recommendations.
    """
    predictions = []
    soil = float(current_soil)
    thresholds = CROP_THRESHOLDS.get(crop, DEFAULT_THRESHOLDS)
    sm_opt_min, _ = thresholds["soil_moisture_optimal"]

    for i, day_wx in enumerate(forecast_7day[:7]):
        rainfall = float(day_wx.get("rainfall", 0) or 0)
        et0 = float(day_wx.get("et0", 4) or 4)

        # Simple daily water balance
        rain_gain = min(0.06, rainfall / 150.0)   # 150mm rain ≈ +6% soil moisture
        et_loss   = min(0.025, et0 / 200.0)        # ET0 4mm/day ≈ -2% loss
        soil = max(0.04, min(0.65, soil + rain_gain - et_loss))

        day_climate = {
            "t2m_C":      float(day_wx.get("temp_mean", 28) or 28),
            "t_max":      float(day_wx.get("temp_max",  32) or 32),
            "t_min":      float(day_wx.get("temp_min",  24) or 24),
            "tp_mm":      rainfall,
            "wind_speed": float(day_wx.get("wind", 5) or 5),
            "humidity":   float(day_wx.get("humidity", 70) or 70),
            "et0":        et0,
            "sp_hpa":     1013.0,
            "swvl1":      round(soil, 3),
            "precip_prob": int(day_wx.get("precip_prob", 20) or 20),
        }

        future_days = days_since_sowing + i + 1
        growth_info = get_growth_stage_info(crop, future_days)

        # Run fast ML ensemble (RF + GB + ET + rules)
        try:
            X = np.array([[day_climate[f] for f in features]])
            X_scaled = scaler.transform(X)

            proba_accum = np.zeros(3)
            total_weight = 0.0

            model_weights = [
                (rf_model,  "rf",  0.35),
                (gb_model,  "gb",  0.30),
                (et_model,  "et",  0.25),
            ]
            for mdl, name, w in model_weights:
                if mdl is not None:
                    try:
                        p = mdl.predict_proba(X_scaled)[0]
                        proba_accum += p * w
                        total_weight += w
                    except Exception:
                        pass

            # Rule-based always contributes
            rule_proba, _, _ = run_rule_based_prediction(day_climate)
            rule_w = max(0.10, 1.0 - total_weight)
            proba_accum += rule_proba * rule_w
            total_weight += rule_w

            avg_proba = proba_accum / total_weight
            stress_class = int(np.argmax(avg_proba))
            stress_conf  = float(avg_proba[stress_class])

        except Exception:
            rule_proba, stress_class, stress_conf = run_rule_based_prediction(day_climate)
            avg_proba = rule_proba

        stress_map   = {0: "Normal", 1: "Low Stress", 2: "High Stress"}
        stress_label = stress_map[stress_class]

        # Lightweight stress scores for this day
        stress_scores = calculate_comprehensive_stress(crop, day_climate, growth_info)

        # Detailed per-day recommendations
        daily_recs = generate_daily_recommendations(
            day=i + 1,
            date=str(day_wx.get("date", "")),
            crop=crop,
            climate=day_climate,
            stress_label=stress_label,
            stress_scores=stress_scores,
            growth_info=growth_info,
        )

        predictions.append({
            "day":              i + 1,
            "date":             str(day_wx.get("date", "")),
            "weather": {
                "temp_mean":    round(day_climate["t2m_C"], 1),
                "temp_max":     round(day_climate["t_max"], 1),
                "temp_min":     round(day_climate["t_min"], 1),
                "rainfall":     round(rainfall, 1),
                "wind":         round(day_climate["wind_speed"], 1),
                "humidity":     round(day_climate["humidity"]),
                "precip_prob":  day_climate["precip_prob"],
                "et0":          round(et0, 1),
            },
            "soil_moisture_pct":   round(soil * 100, 1),
            "stress_prediction":   stress_label,
            "stress_class":        stress_class,
            "stress_probability":  round(stress_conf, 3),
            "stress_probabilities": {
                "Normal":     round(float(avg_proba[0]), 3),
                "Low Stress": round(float(avg_proba[1]), 3),
                "High Stress":round(float(avg_proba[2]), 3),
            },
            "stress_scores":     stress_scores,
            "growth_stage":      growth_info.get("name", "Vegetative"),
            "recommendations":   daily_recs,
        })

    return predictions


# -----------------------------
# RESEARCH AI INTEGRATION
# -----------------------------
def get_research_ai_insights(climate, crop, stress):
    """
    Get advanced Research AI insights to enhance DSS predictions.
    
    Integrates:
    1. TFT Multi-horizon forecasts (1, 3, 7 days)
    2. Bayesian uncertainty quantification
    3. Counterfactual explanations ("what to change")
    4. Knowledge Graph recommendations
    
    Returns enhanced analysis or fallback if Research AI unavailable.
    """
    if not RESEARCH_AI_AVAILABLE:
        return {
            "available": False,
            "message": "Research AI module not loaded"
        }
    
    try:
        # Prepare features for Research AI [temp, precip, soil, wind, pressure]
        features = [
            climate.get('t2m_C', 30),
            climate.get('tp_mm', 5),
            climate.get('swvl1', 0.35),
            climate.get('wind_speed', 10),
            climate.get('sp_hpa', 1013)
        ]
        
        conditions = {
            "temperature": climate.get('t2m_C', 30),
            "humidity": climate.get('humidity', 70),
            "precipitation": climate.get('tp_mm', 5),
            "stress_level": stress.get('overall', 30)
        }
        
        # Run full research analysis
        result = research_ai.full_research_analysis(
            features=features,
            crop=crop.lower(),
            conditions=conditions
        )
        
        # Extract key insights for DSS integration
        insights = {
            "available": True,
            
            # Multi-horizon forecasts from TFT
            "forecasts": _extract_tft_forecasts(result.get("tft_forecast", {})),
            
            # Confidence from Bayesian analysis
            "confidence": _extract_confidence(result.get("uncertainty", {})),
            
            # Actionable advice from Counterfactual
            "actionable_insights": _extract_counterfactuals(result.get("counterfactuals", {})),
            
            # Knowledge-based recommendations
            "knowledge_recommendations": _extract_knowledge(result.get("knowledge_graph", {})),
            
            # Summary for quick display
            "summary": _generate_research_summary(result, stress)
        }
        
        return insights
        
    except Exception as e:
        return {
            "available": False,
            "error": str(e),
            "message": "Research AI analysis failed"
        }


def _extract_tft_forecasts(tft_result):
    """Extract TFT multi-horizon forecasts"""
    if not tft_result or "error" in tft_result:
        return None
    
    forecasts = tft_result.get("forecasts", {})
    return {
        "day_1": forecasts.get("day_1", {}),
        "day_3": forecasts.get("day_3", {}),
        "day_7": forecasts.get("day_7", {}),
        "attention_interpretation": tft_result.get("attention_weights", {}).get("interpretation", ""),
        "most_important_features": tft_result.get("variable_importance", {})
    }


def _extract_confidence(uncertainty_result):
    """Extract Bayesian uncertainty as confidence score"""
    if not uncertainty_result or "error" in uncertainty_result:
        return {"score": 75, "level": "Medium"}
    
    reliability = uncertainty_result.get("reliability_score", 0.75)
    confidence_pct = int(reliability * 100)
    
    if confidence_pct >= 80:
        level = "High"
    elif confidence_pct >= 60:
        level = "Medium"
    else:
        level = "Low"
    
    return {
        "score": confidence_pct,
        "level": level,
        "epistemic": uncertainty_result.get("epistemic_uncertainty", 0),
        "aleatoric": uncertainty_result.get("aleatoric_uncertainty", 0),
        "explanation": uncertainty_result.get("explanations", {}).get("reliability", "")
    }


def _extract_counterfactuals(cf_result):
    """Extract actionable insights from counterfactual analysis"""
    if not cf_result or "error" in cf_result:
        return []
    
    scenarios = cf_result.get("scenarios", [])
    insights = []
    
    for scenario in scenarios[:3]:  # Top 3 scenarios
        if scenario.get("changes_required"):
            changes = scenario["changes_required"]
            for feature, (old_val, new_val) in changes.items():
                direction = "increase" if new_val > old_val else "decrease"
                diff = abs(new_val - old_val)
                
                insights.append({
                    "action": f"{direction.capitalize()} {feature}",
                    "from": round(old_val, 2),
                    "to": round(new_val, 2),
                    "change": round(diff, 2),
                    "result": scenario.get("counterfactual_prediction", "NORMAL"),
                    "feasibility": scenario.get("feasibility_score", 0.5)
                })
    
    return insights


def _extract_knowledge(kg_result):
    """Extract knowledge graph recommendations"""
    if not kg_result or "error" in kg_result:
        return []
    
    recommendations = kg_result.get("recommendations", [])
    knowledge = kg_result.get("knowledge", {})
    
    return {
        "recommendations": recommendations[:5],  # Top 5
        "related_entities": knowledge.get("related_entities", []),
        "risk_factors": knowledge.get("risk_factors", [])
    }


def _generate_research_summary(result, stress):
    """Generate a human-readable summary of research insights"""
    summary_parts = []
    
    # TFT forecast summary
    tft = result.get("tft_forecast", {})
    if tft and "forecasts" in tft:
        day7 = tft["forecasts"].get("day_7", {})
        if day7:
            trend = "worsening" if day7.get("stress_probability", 0) > 0.5 else "stable"
            summary_parts.append(f"7-day outlook: {trend}")
    
    # Uncertainty summary
    uncertainty = result.get("uncertainty", {})
    if uncertainty and "reliability_score" in uncertainty:
        rel = uncertainty["reliability_score"]
        conf_text = "high" if rel > 0.8 else "medium" if rel > 0.5 else "low"
        summary_parts.append(f"Prediction confidence: {conf_text}")
    
    # Counterfactual summary
    cf = result.get("counterfactuals", {})
    if cf and "scenarios" in cf:
        scenarios = cf["scenarios"]
        if scenarios:
            best = scenarios[0]
            if best.get("actionable_advice"):
                summary_parts.append(best["actionable_advice"])
    
    return " | ".join(summary_parts) if summary_parts else "Analysis complete"


# -----------------------------
# MAIN DSS ENGINE
# -----------------------------
def run_dss(request_data=None, classifier_data=None):
    """
    Main DSS entry point.
    
    Args:
        request_data: Dict with location, crop, sowing_date, check_date
        classifier_data: Optional dict from image classifier with health, growth_stage
    
    Returns:
        Complete DSS analysis with recommendations
    """
    
    # Extract request parameters
    location = request_data.get("location", "Palakkad") if request_data else "Palakkad"
    crop = request_data.get("crop", "Rice") if request_data else "Rice"
    sowing_date = request_data.get("sowing_date", "") if request_data else ""
    check_date = request_data.get("check_date", "") if request_data else ""
    
    # Calculate days since sowing
    try:
        sow = datetime.strptime(sowing_date, "%Y-%m-%d")
        check = datetime.strptime(check_date, "%Y-%m-%d")
        days_since_sowing = (check - sow).days
    except:
        days_since_sowing = 45  # Default mid-season
    
    # Fetch weather data
    climate, forecast_7day = fetch_weather(location)
    
    # Get growth stage info
    growth_info = get_growth_stage_info(crop, days_since_sowing)
    
    # Override with classifier data if available
    if classifier_data:
        if classifier_data.get("growthStage"):
            growth_info["classifier_stage"] = classifier_data["growthStage"]
        if classifier_data.get("health"):
            growth_info["classifier_health"] = classifier_data["health"]
    
    # Run AI prediction (passing crop for physics models)
    ai_prediction = run_ai_prediction(climate, crop)
    
    # Calculate comprehensive stress
    stress = calculate_comprehensive_stress(crop, climate, growth_info)
    
    # Calibrate AI prediction with stress calculation for consistency
    ai_prediction = calibrate_ai_with_stress(ai_prediction, stress)
    
    # Assess pest risks
    pest_risks = assess_pest_risk(crop, climate, growth_info)
    
    # Calculate irrigation needs
    irrigation = calculate_irrigation(crop, climate, growth_info, forecast_7day)
    
    # Get fertilizer recommendations
    fertilizer = get_fertilizer_recommendations(crop, growth_info, days_since_sowing)
    
    # Generate advisories
    advisories = generate_advisories(crop, climate, stress, growth_info, pest_risks, irrigation, ai_prediction)
    
    # Get taluk info
    taluk_info = TALUKS.get(location, TALUKS["Palakkad"])
    
    # Seasonal progress
    typical_duration = {"Rice": 145, "Wheat": 140, "Maize": 130, "Sugarcane": 365, "Coconut": 365*4, "Cotton": 210, "Groundnut": 150}
    duration = typical_duration.get(crop, 150)
    seasonal_progress = min(100, (days_since_sowing / duration) * 100)
    
    # Risk level determination
    overall_risk = "Critical" if stress["overall"] >= 70 else "High" if stress["overall"] >= 50 else "Moderate" if stress["overall"] >= 25 else "Low"
    
    return {
        "current": {
            # Basic info
            "location": location,
            "crop": crop,
            "days_since_sowing": days_since_sowing,
            "seasonal_progress": round(seasonal_progress, 1),
            
            # Growth stage
            "growth_stage": growth_info["name"],
            "growth_stage_progress": growth_info["progress"],
            "water_need": growth_info["water_need"],
            "days_in_stage": growth_info.get("days_in_stage", 0),
            "days_remaining": growth_info.get("days_remaining", 0),
            
            # Weather
            "temperature": f"{climate['t2m_C']:.1f}°C",
            "temp_max": f"{climate['t_max']:.1f}°C",
            "temp_min": f"{climate['t_min']:.1f}°C",
            "rainfall": f"{climate['tp_mm']:.1f}mm",
            "wind_speed": f"{climate['wind_speed']:.1f}km/h",
            "humidity": f"{climate.get('humidity', 70):.0f}%",
            "soil_moisture": f"{climate['swvl1']*100:.0f}%",
            "uv_index": climate.get("uv_index", 6),
            
            # Stress analysis
            "stress": stress,
            "climate_stress": stress["level"],
            "water_stress": stress["moisture"],
            "crop_risk": overall_risk,
            
            # AI analysis
            "ai_prediction": ai_prediction,
            
            # Advisories
            "farmer_advisory": " | ".join([a["message"] for a in advisories[:3]])
        },
        
        # Detailed sections
        "growth_stage_info": growth_info,
        "stress_analysis": stress,
        "ai_model": ai_prediction,
        "irrigation": irrigation,
        "fertilizer_recommendations": fertilizer,
        "pest_disease_risks": pest_risks,
        "advisories": advisories,
        
        # Forecast
        "forecast": forecast_7day[:3],  # 3-day summary
        "forecast_7day": forecast_7day,
        
        # Nutrient status with ACTUAL soil moisture
        "nutrient_status": {
            "nitrogen": 72,  # Default estimates
            "phosphorus": 58,
            "potassium": 85,
            "moisture": int(climate['swvl1'] * 100)  # ACTUAL soil moisture!
        },
        
        # Region info
        "region": {
            "taluk": location,
            "soil_type": taluk_info.get("soil", "Laterite"),
            "dominant_crops": taluk_info.get("dominant_crops", ["Rice"]),
            "coordinates": {"lat": taluk_info["lat"], "lng": taluk_info["lng"]}
        },
        
        # Classifier integration
        "classifier_enhanced": classifier_data is not None,
        "classifier_data": classifier_data,
        
        # Research AI Enhanced Analysis
        "research_ai": get_research_ai_insights(
            climate=climate,
            crop=crop,
            stress=stress
        )
    }


# -----------------------------
# ENHANCED DSS WITH CLASSIFIER
# -----------------------------
def run_dss_with_classifier(request_data, classifier_data):
    """
    Run DSS with integrated image classifier results.
    Provides enhanced recommendations based on visual crop analysis.
    """
    return run_dss(request_data, classifier_data)


def get_weather_for_location(location: str = "Palakkad") -> dict:
    """
    Get current weather data for a location for Advisor AI context.
    Returns realistic weather conditions to be used with the AI Agent.
    """
    try:
        # Fetch weather from fetch_weather function
        weather = fetch_weather(location)
        
        return {
            "temperature": weather.get("t2m_C", 30),
            "soil_moisture": weather.get("swvl1", 0.35),
            "rainfall": weather.get("tp_mm", 5),
            "humidity": weather.get("humidity", 70),
            "wind_speed": weather.get("wind_speed", 5),
            "pressure": weather.get("pressure", 1013),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        # Return default conditions
        return {
            "temperature": 30,
            "soil_moisture": 0.35,
            "rainfall": 5,
            "humidity": 70,
            "wind_speed": 5,
            "pressure": 1013,
            "timestamp": datetime.now().isoformat()
        }


# Test function
if __name__ == "__main__":
    test_request = {
        "location": "Palakkad",
        "crop": "Rice",
        "sowing_date": "2026-01-01",
        "check_date": "2026-02-20"
    }
    
    result = run_dss(test_request)
    print("=" * 60)
    print("PALAKKAD DSS - ENHANCED ENGINE TEST")
    print("=" * 60)
    print(f"Location: {result['current']['location']}")
    print(f"Crop: {result['current']['crop']}")
    print(f"Growth Stage: {result['current']['growth_stage']}")
    print(f"Days Since Sowing: {result['current']['days_since_sowing']}")
    print(f"Risk Level: {result['current']['crop_risk']}")
    print(f"AI Prediction: {result['ai_model']['prediction']} ({result['ai_model']['confidence']}%)")
    print(f"\nAdvisories:")
    for adv in result['advisories'][:3]:
        print(f"  {adv['icon']} [{adv['priority']}] {adv['message']}")
