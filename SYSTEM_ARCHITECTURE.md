# System Architecture - Palakkad Agriculture DSS

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Browser)                │
│                 http://localhost:5174                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    HTTP/JSON/REST
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
    ┌────────────────┐            ┌────────────────┐
    │ DSS Analysis   │            │  Crop Image    │
    │  Form Request  │            │ Classification │
    │   POST /dss    │            │POST /classify  │
    └────────┬───────┘            └────────┬───────┘
             │                             │
             └──────────────┬──────────────┘
                            │
              FastAPI Server (Port 8000)
              http://127.0.0.1:8000
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌─────────┐      ┌──────────┐      ┌──────────────┐
    │   DSS   │      │  Crop    │      │   Response   │
    │ Engine  │      │Classifier│      │ Processing   │
    └────┬────┘      └────┬─────┘      └──────┬───────┘
         │                │                    │
         ├────────────────┼────────────────────┤
         │                │                    │
         ▼                ▼                    ▼
    ┌─────────────┐  ┌──────────┐      ┌──────────────┐
    │Open-Meteo   │  │  BLIP    │      │Return JSON   │
    │Weather API  │  │  Model   │      │  Response    │
    │ (Cloud)     │  │(HuggingFace)     │              │
    └─────────────┘  └──────────┘      └──────┬───────┘
                                              │
                                   ▼ HTTP Response
                            ┌─────────────────────┐
                            │  Browser/React App  │
                            │  Update UI with      │
                            │  Results & Charts    │
                            └─────────────────────┘
```

## Component Architecture

### Frontend Layer
```
Dashboard (Main Page)
    │
    ├── Header Component
    │   └── Title & Tagline
    │
    ├── DSSInput Component
    │   ├── Location Input
    │   ├── Crop Selection
    │   ├── Sowing Date Picker
    │   ├── Check Date Picker
    │   ├── Form Validation
    │   └── Submit Button → POST /dss
    │
    ├── DSSOutput Component (if result)
    │   ├── Climate Stress Card (Red/Yellow/Green)
    │   ├── Growth Stage Card
    │   ├── Crop Risk Card
    │   ├── Weather Parameters (4-cell grid)
    │   │   ├── Temperature
    │   │   ├── Rainfall
    │   │   ├── Wind Speed
    │   │   └── Soil Moisture
    │   └── Advisory Box (Color-coded)
    │
    ├── ForecastTable Component (if result)
    │   └── 3-Day Forecast Cards
    │       ├── Date
    │       └── Forecast Text
    │
    └── CropClassification Component (NEW)
        ├── Image Upload Section
        │   ├── Drop Zone
        │   ├── File Input
        │   └── Preview Display
        │
        ├── Classification Results (if success)
        │   ├── Crop Name Display
        │   ├── Confidence Score
        │   ├── Image Caption
        │   └── Farming Recommendations
        │
        └── Error Handling
            └── Error Messages
```

### Backend Layer
```
FastAPI Application (app.py)
    │
    ├── CORS Middleware
    │   └── Allow all origins for frontend access
    │
    ├── GET /
    │   └── Health check endpoint
    │
    ├── POST /dss
    │   └── request: DSSRequest
    │       │
    │       ├── Call: run_dss(request)
    │       │
    │       └── return: {
    │           "success": bool,
    │           "current": {...},
    │           "forecast": [...]
    │       }
    │
    ├── POST /classify-crop
    │   └── file: UploadFile
    │       │
    │       ├── Read: file_content = await file.read()
    │       │
    │       ├── Call: crop_classifier.classify_crop_from_image(file_content)
    │       │
    │       └── return: {
    │           "success": bool,
    │           "crop": str,
    │           "confidence": int,
    │           "caption": str,
    │           "recommendations": [...]
    │       }
    │
    └── @app.on_event("startup")
        └── Call: crop_classifier.initialize()
            └── Load BLIP model from Hugging Face
```

### DSS Engine Module (dss_engine.py)
```
run_dss(request)
    │
    ├─ Step 1: Parse Request
    │   └── Extract: location, crop, sowing_date, check_date
    │
    ├─ Step 2: Fetch Weather
    │   └── open_meteo_api.fetch_weather(location)
    │       │
    │       └── Return: {
    │           "temperature": float,
    │           "rainfall": float,
    │           "wind_speed": float,
    │           "soil_moisture": float
    │       }
    │
    ├─ Step 3: Calculate Growth Stage
    │   └── calculate_growth_stage(sowing_date, check_date)
    │       │
    │       ├── days_elapsed = (check_date - sowing_date).days
    │       │
    │       └── Match to stage:
    │           ├── 0-20 days     → "Germination"
    │           ├── 20-40 days    → "Vegetative"
    │           ├── 40-70 days    → "Panicle Formation"
    │           ├── 70-100 days   → "Flowering"
    │           └── 100+ days     → "Maturity"
    │
    ├─ Step 4: Load & Run LSTM Model
    │   └── lstm_model.predict(normalized_weather)
    │       │
    │       └── Output: climate_stress (0-100 score)
    │
    ├─ Step 5: Generate Advisory
    │   └── generate_advisory(weather, stress, stage, crop)
    │       │
    │       └── Consider:
    │           ├── Temperature > 35°C → Alert
    │           ├── Wind Speed > 15 km/h → Alert
    │           ├── Rainfall anomalies → Advisory
    │           ├── Growth stage requirements
    │           └── Crop-specific vulnerabilities
    │
    ├─ Step 6: Generate Forecast
    │   └── generate_forecast(location, days=3)
    │       │
    │       └── Generate mock 3-day forecast
    │
    └─ Step 7: Return Results
        └── {
            "success": true,
            "current": {...},
            "forecast": [...]
        }
```

### Crop Classifier Module (crop_classifier.py)
```
initialize()
    │
    └─ load_blip_model()
        │
        └── Load from Hugging Face:
            "Salesforce/blip-image-captioning-base"
            │
            ├─ processor = BlipProcessor
            └─ blip_model = BlipForConditionalGeneration


classify_crop_from_image(image_bytes)
    │
    ├─ Step 1: Load Image
    │   └── image = Image.open(BytesIO(image_bytes))
    │
    ├─ Step 2: Convert to RGB
    │   └── if image.mode != 'RGB': image = image.convert('RGB')
    │
    ├─ Step 3: Generate Caption
    │   └── inputs = processor(images=image)
    │       caption = blip_model.generate(**inputs)
    │
    ├─ Step 4: Match Keywords
    │   └── Compare caption against crop keywords:
    │       ├── "rice" → ["rice", "paddy", "flooded field", ...]
    │       ├── "wheat" → ["wheat", "grain field", ...]
    │       ├── ... (10 total crop types)
    │
    ├─ Step 5: Calculate Confidence
    │   └── confidence = keyword_match_quality * 100
    │
    ├─ Step 6: Get Recommendations
    │   └── get_crop_recommendations(detected_crop)
    │
    └─ Step 7: Return Results
        └── {
            "success": true,
            "crop": "rice",
            "confidence": 85,
            "caption": "...",
            "recommendations": [...]
        }
```

## Data Flow Diagrams

### DSS Analysis Flow
```
User Input
  │
  ├─ Location: "Palakkad"
  ├─ Crop: "rice"
  ├─ Sowing: "2024-06-15"
  └─ Check: "2024-07-15"
           │
           ▼ POST /dss
      FastAPI Server
           │
      ┌────┴────┐
      │ validate │
      └────┬────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Fetch       Calculate
  Weather     Growth Stage
    │             │
    └──────┬──────┘
           │
      ┌────▼─────┐
      │ Normalize │
      │  Weather  │
      └────┬─────┘
           │
      ┌────▼──────┐
      │ Run LSTM   │
      │  Model     │
      └────┬──────┘
           │
    ┌──────▼──────┐
    │  Generate   │
    │  Advisory   │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Generate   │
    │  Forecast   │
    └──────┬──────┘
           │
    Response JSON
           │
           ▼
      Browser UI
      Display Results
```

### Crop Classification Flow
```
User Uploads Image
    │
    ▼ File (PNG/JPG/GIF)
  POST /classify-crop
    │
    ▼ Read file bytes
  Validate Image
    │
    ├─ Check format
    ├─ Check size < 10MB
    └─ Check valid image
       │
       ▼ Load Image
    Convert to RGB
       │
       ▼ Apply BLIP Processor
    Generate Caption
       │
       ▼ Parse Caption
    Match Keywords
    Against 10 Crops
       │
       ├─ Calculate match score
       ├─ Confidence = match%
       └─ Get Recommendations
           │
           ▼
    Response JSON
    {crop, confidence, recommendations}
           │
           ▼
      Browser UI
    Display Results
```

## Technology Stack

### Frontend
```
React 19.2.0
  ├── Components (JSX)
  ├── State Management (useState)
  ├── HTTP Client (Axios)
  └── Styling (CSS Objects)
       │
       ├── CSS Variables
       ├── Flexbox Layout
       ├── CSS Grid
       ├── Media Queries
       └── Animations (slideUp, fadeIn)

Vite 7.3.1 (Build Tool)
  └── Hot Module Replacement (HMR)

Node Package Manager
  └── Dependencies: react, axios, vite
```

### Backend
```
FastAPI (Web Framework)
  ├── Routing (@app.post, @app.get)
  ├── CORS Middleware
  ├── File Upload Handling
  ├── Async Support (async/await)
  └── OpenAPI Documentation

Uvicorn (ASGI Server)
  ├── Python 3.12 Support
  ├── Reload on Code Changes
  └── Production Ready

Python Libraries:
  ├── TensorFlow/Keras
  │   └── Load LSTM model (.h5)
  │
  ├── scikit-learn
  │   └── Load MinMaxScaler (.save)
  │
  ├── transformers (Hugging Face)
  │   ├── BlipProcessor
  │   └── BlipForConditionalGeneration
  │
  ├── Pillow (PIL)
  │   └── Image Processing
  │
  ├── NumPy
  │   └── Array Operations
  │
  ├── requests
  │   └── HTTP Calls to Open-Meteo API
  │
  └── Python Standard Library
      ├── io (BytesIO)
      ├── json (JSON Serialization)
      └── datetime (Date Handling)
```

### External Services
```
Open-Meteo API (Free, No Auth)
  ├── Endpoint: https://api.open-meteo.com/v1/forecast
  ├── Latitude: 10.78 (Palakkad)
  ├── Longitude: 76.65 (Palakkad)
  └── Data: Weather, Forecast, Hourly

Hugging Face Model Hub
  ├── Model: Salesforce/blip-image-captioning-base
  ├── Size: ~1GB
  ├── Auto-downloads on first use
  └── Cached locally after download
```

## File Organization

```
project_root/
│
├── backend/
│   ├── app.py (FastAPI server)
│   │   ├── CORS setup
│   │   ├── POST /dss endpoint
│   │   ├── POST /classify-crop endpoint
│   │   └── Startup initialization
│   │
│   ├── dss_engine.py (DSS Logic)
│   │   ├── run_dss()
│   │   ├── calculate_growth_stage()
│   │   ├── generate_advisory()
│   │   ├── generate_forecast()
│   │   └── fetch_weather()
│   │
│   ├── crop_classifier.py (Crop Classification)
│   │   ├── initialize()
│   │   ├── load_blip_model()
│   │   ├── classify_crop_from_image()
│   │   └── get_crop_recommendations()
│   │
│   ├── test_classifier.py (Testing)
│   │   └── Verify all imports and initialization
│   │
│   ├── model/
│   │   ├── lstm_model.h5 (Neural Network)
│   │   └── scaler.save (Data Normalizer)
│   │
│   ├── data/ (Weather cache)
│   │   └── (Auto-created on first weather fetch)
│   │
│   └── __pycache__/ (Python cache)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │       ├── Import DSSInput
│   │   │       ├── Import DSSOutput
│   │   │       ├── Import ForecastTable
│   │   │       ├── Import CropClassification (NEW)
│   │   │       └── Main layout component
│   │   │
│   │   ├── components/
│   │   │   ├── DSSInput.jsx
│   │   │   │   └── Form to collect user input
│   │   │   │
│   │   │   ├── DSSOutput.jsx
│   │   │   │   └── Display DSS results
│   │   │   │
│   │   │   ├── ForecastTable.jsx
│   │   │   │   └── 3-day forecast cards
│   │   │   │
│   │   │   └── CropClassification.jsx (NEW)
│   │   │       ├── Image upload
│   │   │       ├── Preview
│   │   │       └── Result display
│   │   │
│   │   ├── App.jsx (Root component)
│   │   ├── main.jsx (Entry point)
│   │   ├── index.css (Global styles)
│   │   ├── App.css (App-specific styles)
│   │   └── assets/
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── QUICK_START.md
├── INTEGRATION_GUIDE.md
└── CROP_CLASSIFICATION_INTEGRATION.md
```

## API Response Structure

### DSS Response
```json
{
  "success": true,
  "current": {
    "climate_stress": 45,
    "growth_stage": "Vegetative",
    "crop_risk": "Moderate",
    "temperature": 32.5,
    "rainfall": 2.3,
    "wind_speed": 12.5,
    "soil_moisture": 68,
    "advisory": "Monitor for pest activity during this stage"
  },
  "forecast": [
    {
      "date": "2024-12-21",
      "forecast": "Partly cloudy with moderate temperature"
    },
    {
      "date": "2024-12-22",
      "forecast": "Scattered thunderstorms expected"
    },
    {
      "date": "2024-12-23",
      "forecast": "Clear skies and cool weather"
    }
  ]
}
```

### Crop Classification Response
```json
{
  "success": true,
  "crop": "rice",
  "confidence": 85,
  "caption": "rice paddy field with green plants",
  "recommendations": [
    "Maintain water level at 5-10cm during growth",
    "Apply nitrogen fertilizer at 4-6 weeks",
    "Monitor for stem borer and leaf folder",
    "Ensure proper drainage during heavy rainfall"
  ]
}
```

## Deployment Architecture

### Development
```
Local Machine
├── Backend (Terminal 1)
│   └── http://127.0.0.1:8000
├── Frontend (Terminal 2)
│   └── http://localhost:5174
└── Models (Downloaded on first use)
    └── ~/.cache/huggingface/
```

### Production (Containerized)
```
Docker Container
├── FastAPI Server (Port 8000)
├── All Python Dependencies
├── BLIP Model (Pre-downloaded)
├── LSTM Model (.h5 file)
└── Scaler (.save file)

Separate Container
├── React Frontend (Port 80/443)
├── Static Files
└── Nginx Reverse Proxy
```

### Cloud Deployment
```
Cloud Platform (AWS/Azure/GCP)
├── Backend Service
│   └── Serverless (Lambda/Functions)
│       or Container (ECS/AKS/Cloud Run)
├── Frontend Service
│   └── Static Hosting (S3/Blob/Cloud Storage)
└── External APIs
    └── Open-Meteo (Already Cloud-based)
```

---

This architecture provides a scalable, modular system for agricultural decision support with integrated crop classification capabilities.
