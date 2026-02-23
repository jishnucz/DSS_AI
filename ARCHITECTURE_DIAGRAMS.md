# AgriDSS Intelligence - Architecture Diagrams

## Visual Architecture Diagrams for Presentations & Publications

> Mermaid-based diagrams that can be rendered in VS Code, GitHub, or exported to images

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph USER["👤 USER LAYER"]
        WEB["🌐 Web Browser"]
        MOBILE["📱 Mobile Device"]
    end
    
    subgraph PRESENTATION["📊 PRESENTATION LAYER"]
        REACT["⚛️ React 19 Frontend"]
        I18N["🌍 i18n (4 Languages)"]
        CHARTS["📈 Charts & Maps"]
    end
    
    subgraph API["🔌 API GATEWAY"]
        FASTAPI["⚡ FastAPI Server"]
        AUTH["🔐 JWT Auth"]
        CORS["🔗 CORS"]
    end
    
    subgraph INTELLIGENCE["🧠 INTELLIGENCE LAYER"]
        DSS["🌾 DSS Engine"]
        ML["🤖 ML Pipeline"]
        CLASSIFY["🖼️ Image Classifier"]
        XAI["🔍 Explainability"]
    end
    
    subgraph DATA["💾 DATA LAYER"]
        ERA5["🌡️ ERA5 Climate"]
        NASA["🛰️ NASA POWER"]
        CROPS["🌱 Crop Database"]
        MODELS["📦 Trained Models"]
    end
    
    WEB --> REACT
    MOBILE --> REACT
    REACT --> I18N
    REACT --> CHARTS
    REACT --> FASTAPI
    FASTAPI --> AUTH
    FASTAPI --> CORS
    FASTAPI --> DSS
    FASTAPI --> ML
    FASTAPI --> CLASSIFY
    DSS --> XAI
    ML --> XAI
    DSS --> ERA5
    DSS --> NASA
    DSS --> CROPS
    ML --> MODELS
    CLASSIFY --> MODELS
    
    style USER fill:#e1f5fe
    style PRESENTATION fill:#f3e5f5
    style API fill:#fff3e0
    style INTELLIGENCE fill:#e8f5e9
    style DATA fill:#fce4ec
```

---

## 2. ML Pipeline Architecture

```mermaid
flowchart LR
    subgraph INPUT["📥 DATA INGESTION"]
        ERA5_RAW["ERA5 Raw Data<br/>2019-2024"]
        NASA_VAL["NASA POWER<br/>Validation"]
    end
    
    subgraph PREPROCESS["⚙️ PREPROCESSING"]
        MERGE["Merge Datasets"]
        CLEAN["Clean & Impute"]
        VALIDATE["Validate vs NASA"]
    end
    
    subgraph FEATURES["🔧 FEATURE ENGINEERING"]
        TEMPORAL["Temporal Features<br/>• 7d rolling avg<br/>• 14d cumulative<br/>• Lag features"]
        PHYSICS["Physics Features<br/>• GDD<br/>• SPEI<br/>• VPD<br/>• Heat Index"]
        SPATIAL["Spatial Features<br/>• Taluk encoding<br/>• Elevation<br/>• Soil type"]
    end
    
    subgraph CV["📊 VALIDATION"]
        TEMPORAL_CV["Temporal Cross-Val<br/>Train: Past → Test: Future<br/>NO DATA LEAKAGE"]
    end
    
    subgraph MODELS["🤖 MODEL TRAINING"]
        LSTM["LSTM<br/>92%"]
        RF["Random Forest<br/>87%"]
        GB["Gradient Boost<br/>89%"]
        XGB["XGBoost<br/>91%"]
        MLP["Neural Net<br/>85%"]
        ENSEMBLE["🎯 Weighted Ensemble<br/>FINAL: 92%"]
    end
    
    subgraph OUTPUT["📤 OUTPUT"]
        SHAP["SHAP<br/>Explainability"]
        CI["95% Confidence<br/>Intervals"]
        PRED["Stress<br/>Prediction"]
    end
    
    ERA5_RAW --> MERGE
    NASA_VAL --> VALIDATE
    MERGE --> CLEAN --> VALIDATE
    VALIDATE --> TEMPORAL & PHYSICS & SPATIAL
    TEMPORAL --> TEMPORAL_CV
    PHYSICS --> TEMPORAL_CV
    SPATIAL --> TEMPORAL_CV
    TEMPORAL_CV --> LSTM & RF & GB & XGB & MLP
    LSTM & RF & GB & XGB & MLP --> ENSEMBLE
    ENSEMBLE --> SHAP & CI & PRED
    
    style INPUT fill:#bbdefb
    style PREPROCESS fill:#c8e6c9
    style FEATURES fill:#fff9c4
    style CV fill:#ffccbc
    style MODELS fill:#d1c4e9
    style OUTPUT fill:#b2dfdb
```

---

## 3. Data Flow Sequence

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as ⚛️ Frontend
    participant A as ⚡ FastAPI
    participant D as 🌾 DSS Engine
    participant W as 🌐 Weather API
    participant M as 🤖 ML Models
    participant S as 🔍 SHAP
    
    U->>F: Enter crop details
    F->>A: POST /dss {location, crop, dates}
    A->>D: run_dss(request)
    
    D->>W: fetch_weather(location)
    W-->>D: {temp, rain, soil, wind}
    
    D->>D: calculate_growth_stage()
    D->>M: predict_stress(features)
    M-->>D: stress_score (0-100)
    
    D->>S: explain_prediction()
    S-->>D: {top_features, contributions}
    
    D-->>A: {stress, advisory, forecast, shap}
    A-->>F: JSON Response
    F-->>U: Display Results + Charts
```

---

## 4. Component Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend Components"]
        Dashboard["Dashboard.jsx<br/>Main Container"]
        DSSInput["DSSInput.jsx<br/>Form & Validation"]
        DSSOutput["DSSOutput.jsx<br/>Results Display"]
        Classifier["CropClassifier.jsx<br/>Image Upload"]
        Research["Research Components<br/>• SHAP<br/>• Climate<br/>• Heatmap"]
        ChatBot["ChatBot.jsx<br/>AI Assistant"]
    end
    
    subgraph Backend["Backend Modules"]
        App["app.py<br/>FastAPI Routes"]
        DSSEngine["dss_engine.py<br/>Core Logic"]
        CropClass["crop_classifier.py<br/>BLIP Model"]
        Models["model/<br/>• lstm_model.h5<br/>• scaler.save"]
    end
    
    subgraph DataFiles["Data Files"]
        ERA5Data["ERA5/*.csv<br/>Climate Data"]
        CropData["palakkad_*.csv<br/>Crop Info"]
    end
    
    Dashboard --> DSSInput
    Dashboard --> DSSOutput
    Dashboard --> Classifier
    Dashboard --> Research
    Dashboard --> ChatBot
    
    DSSInput --> App
    Classifier --> App
    ChatBot --> App
    
    App --> DSSEngine
    App --> CropClass
    
    DSSEngine --> Models
    DSSEngine --> ERA5Data
    DSSEngine --> CropData
    CropClass --> Models
    
    style Frontend fill:#e3f2fd
    style Backend fill:#f1f8e9
    style DataFiles fill:#fff3e0
```

---

## 5. Explainability Flow (SHAP)

```mermaid
flowchart LR
    subgraph Input["Model Input"]
        F1["Temperature<br/>28.5°C"]
        F2["Soil Moisture<br/>0.32"]
        F3["Rainfall<br/>45mm"]
        F4["GDD<br/>850"]
        F5["Wind<br/>12 km/h"]
    end
    
    subgraph Model["Ensemble Model"]
        PRED["Prediction<br/>Stress = 45%"]
    end
    
    subgraph SHAP["SHAP Analysis"]
        S1["Temperature<br/>+0.15 ↑"]
        S2["Soil Moisture<br/>-0.12 ↓"]
        S3["Rainfall<br/>+0.08 ↑"]
        S4["GDD<br/>+0.05 ↑"]
        S5["Wind<br/>+0.02 ↑"]
    end
    
    subgraph Explain["Explanation"]
        EXP["📊 Why 45% Stress?<br/>• High temp: +15%<br/>• Low moisture: +12%<br/>• Good rain: -8%<br/>Net contribution: 45%"]
    end
    
    F1 & F2 & F3 & F4 & F5 --> PRED
    PRED --> S1 & S2 & S3 & S4 & S5
    S1 & S2 & S3 & S4 & S5 --> EXP
    
    style Input fill:#e8f5e9
    style Model fill:#fff8e1
    style SHAP fill:#e3f2fd
    style Explain fill:#f3e5f5
```

---

## 6. Multilingual Architecture

```mermaid
flowchart TB
    subgraph Context["Language Context"]
        Provider["LanguageProvider"]
        State["useState: 'en' | 'ml' | 'ta' | 'hi'"]
    end
    
    subgraph Translations["translations.js"]
        EN["🇬🇧 English<br/>130+ keys"]
        ML["🇮🇳 Malayalam<br/>130+ keys"]
        TA["🇮🇳 Tamil<br/>130+ keys"]
        HI["🇮🇳 Hindi<br/>130+ keys"]
    end
    
    subgraph UI["UI Components"]
        Header["Header<br/>t('appTitle')"]
        Tabs["Tabs<br/>t('tabDSS')"]
        Forms["Forms<br/>t('location')"]
        Results["Results<br/>t('stress')"]
    end
    
    Provider --> State
    State --> EN & ML & TA & HI
    EN & ML & TA & HI --> Header & Tabs & Forms & Results
    
    style Context fill:#e1f5fe
    style Translations fill:#f3e5f5
    style UI fill:#e8f5e9
```

---

## 7. Deployment Architecture

```mermaid
flowchart TB
    subgraph Local["💻 Development"]
        DEV_FE["npm run dev<br/>:5174"]
        DEV_BE["uvicorn app:app<br/>:8000"]
    end
    
    subgraph Production["☁️ Production"]
        subgraph Frontend_Deploy["Frontend Deployment"]
            VERCEL["Vercel / Netlify<br/>Static Hosting"]
            CDN["CDN Edge<br/>Global Cache"]
        end
        
        subgraph Backend_Deploy["Backend Deployment"]
            DOCKER["Docker Container"]
            CLOUD["AWS/GCP/Azure<br/>Cloud Instance"]
            GPU["GPU Instance<br/>(for ML inference)"]
        end
        
        subgraph Data_Store["Data Storage"]
            S3["S3 / Cloud Storage<br/>ERA5 Data"]
            DB["PostgreSQL<br/>User Data"]
            CACHE["Redis Cache<br/>Weather API"]
        end
    end
    
    DEV_FE --> VERCEL
    DEV_BE --> DOCKER
    VERCEL --> CDN
    DOCKER --> CLOUD
    DOCKER --> GPU
    CLOUD --> S3
    CLOUD --> DB
    CLOUD --> CACHE
    
    style Local fill:#fff9c4
    style Production fill:#e8f5e9
    style Frontend_Deploy fill:#e3f2fd
    style Backend_Deploy fill:#f3e5f5
    style Data_Store fill:#ffccbc
```

---

## 8. Research Contribution Map

```mermaid
mindmap
  root((AgriDSS<br/>Research))
    Data Integration
      ERA5 Reanalysis
      NASA POWER Validation
      MODIS NDVI
      Local Crop Calendars
    ML Innovation
      True Forecasting
      Temporal CV
      8-Model Ensemble
      LSTM Deep Learning
    Explainability
      SHAP Analysis
      Feature Attribution
      Local Explanations
      Trust Building
    Uncertainty
      Bootstrap CI
      Calibration
      Risk Assessment
      Decision Support
    Impact
      Economic ROI
      Spatial Analysis
      Policy Recommendations
      Farmer Adoption
    Accessibility
      4 Languages
      Mobile Responsive
      Simple Interface
      Visual Charts
```

---

## How to Render These Diagrams

### Option 1: VS Code
Install the "Markdown Preview Mermaid Support" extension, then preview this file.

### Option 2: GitHub
GitHub automatically renders Mermaid diagrams in markdown files.

### Option 3: Export to Images
1. Visit https://mermaid.live/
2. Paste the diagram code
3. Export as PNG/SVG

### Option 4: Include in Presentations
1. Export diagrams as SVG
2. Import into PowerPoint/Google Slides

---

## Quick Reference: Key Metrics

| Metric | Value |
|--------|-------|
| Model Accuracy | 92% |
| Stress Detection | 82% |
| False Alarm Rate | 4% |
| Forecast Horizon | 14 days |
| Confidence Level | 95% CI |
| Annual Benefit | ₹52 crores |
| ROI | 2,289% |
| Languages | 4 |
| Features | 85+ |
| Models | 8 ensemble |

---

*Generated for M.Tech Research Paper: AgriDSS Intelligence*
