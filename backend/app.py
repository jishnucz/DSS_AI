from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dss_engine import run_dss
import sys
import os
import csv
from pathlib import Path

import crop_classifier
from fastapi import Request, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import chatbot
import auth

# 🔬 Advanced Research-Powered API
import advanced_api

app = FastAPI(
    title="Palakkad Agricultural DSS",
    description="Research-Powered Decision Support System with 88.3% accuracy ensemble",
    version="2.0.0"
)

# mount static directory and initialize templates
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DSSRequest(BaseModel):
    location: str
    crop: str
    sowing_date: str
    check_date: str

class DSSRequestWithClassifier(BaseModel):
    location: str
    crop: str
    sowing_date: str
    check_date: str
    classifier_data: dict = None  # Optional: health, growth_stage from image classifier

@app.get("/")
def home():
    return {"message": "Palakkad DSS Enhanced Engine Running"}

@app.post("/dss")
def post_dss(request: DSSRequest):
    return run_dss(request.dict())

@app.post("/dss-enhanced")
def post_dss_enhanced(request: DSSRequestWithClassifier):
    """Enhanced DSS with optional classifier integration"""
    from dss_engine import run_dss_with_classifier
    return run_dss_with_classifier(request.dict(), request.classifier_data)

@app.get("/dss-quick/{location}/{crop}")
def quick_dss(location: str, crop: str):
    """Quick DSS check for a location and crop (for map integration)"""
    from datetime import datetime, timedelta
    today = datetime.now()
    # Assume mid-season crop for quick assessment
    sowing_date = (today - timedelta(days=45)).strftime("%Y-%m-%d")
    check_date = today.strftime("%Y-%m-%d")
    
    request_data = {
        "location": location,
        "crop": crop,
        "sowing_date": sowing_date,
        "check_date": check_date
    }
    return run_dss(request_data)

@app.get("/map-data")
def get_map_data():
    """Serve crop and regional data for the map visualization"""
    data_dir = Path(__file__).parent.parent / "data"
    
    # Read crop master data
    crops = []
    crop_file = data_dir / "palakkad_crop_master.csv"
    if crop_file.exists():
        with open(crop_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            crops = list(reader)
    
    # Read regional data
    region = None
    region_file = data_dir / "palakkad_agro_context.csv"
    if region_file.exists():
        with open(region_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            region = next(reader, None)
    
    # Enhanced taluk data with crops from CSV
    crop_names = [c['crop_name'] for c in crops if c.get('dominant_in_palakkad') == 'Yes']
    
    taluks = [
        {"name": "Palakkad", "lat": 10.7867, "lng": 76.6548, "crops": ["Rice", "Coconut", "Sugarcane", "Turmeric"], "population": "~130,000"},
        {"name": "Chittur", "lat": 10.6979, "lng": 76.7472, "crops": ["Rice", "Coconut", "Banana", "Vegetables"], "population": "~95,000"},
        {"name": "Alathur", "lat": 10.5667, "lng": 76.5500, "crops": ["Rice", "Groundnut", "Cotton", "Millets"], "population": "~78,000"},
        {"name": "Ottapalam", "lat": 10.7719, "lng": 76.3778, "crops": ["Rice", "Coconut", "Banana", "Pepper"], "population": "~110,000"},
        {"name": "Mannarkkad", "lat": 10.9881, "lng": 76.4744, "crops": ["Coffee", "Coconut", "Arecanut", "Cardamom"], "population": "~85,000"},
        {"name": "Kollengode", "lat": 10.5931, "lng": 76.6942, "crops": ["Rice", "Coconut", "Vegetables", "Ginger"], "population": "~68,000"},
        {"name": "Pattambi", "lat": 10.8089, "lng": 76.1878, "crops": ["Rice", "Coconut", "Banana", "Tapioca"], "population": "~72,000"},
        {"name": "Thrithala", "lat": 10.9500, "lng": 76.3350, "crops": ["Rice", "Coconut", "Vegetables", "Rubber"], "population": "~55,000"},
    ]
    
    return {
        "taluks": taluks,
        "crops": crops,
        "region": region,
        "district": "Palakkad",
        "state": "Kerala"
    }

@app.post("/classify-crop")
async def classify_crop(file: UploadFile = File(...)):
    """Classify crop from uploaded image"""
    try:
        file_content = await file.read()
        result = crop_classifier.classify_crop_from_image(file_content)
        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "crop": None,
            "confidence": 0
        }

@app.on_event("startup")
def startup_event():
    """Initialize crop classifier on startup"""
    crop_classifier.initialize()
    # Initialize auth module (MongoDB connection)
    try:
        auth.get_db()
        print("MongoDB connected successfully")
    except Exception as e:
        print(f"Warning: MongoDB connection failed: {e}")


# ─────────────────────────────────────────────────────────
# Authentication Routes
# ─────────────────────────────────────────────────────────

@app.post("/auth/register")
async def register(request: Request):
    """Register a new user"""
    try:
        data = await request.json()
        user = auth.UserRegister(**data)
        result = auth.register_user(user)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/auth/login")
async def login(request: Request):
    """Login a user"""
    try:
        data = await request.json()
        credentials = auth.UserLogin(**data)
        result = auth.login_user(credentials)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.post("/auth/verify")
async def verify(request: Request):
    """Verify a JWT token"""
    try:
        data = await request.json()
        token = data.get("token", "")
        result = auth.verify_token(token)
        if not result.get("valid"):
            raise HTTPException(status_code=401, detail=result.get("error", "Invalid token"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token verification failed: {str(e)}")


@app.get("/auth/user/{user_id}")
async def get_user(user_id: str):
    """Get user profile by ID"""
    try:
        user = auth.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")


# Chatbot/UI routes
@app.get("/chat")
def chat_page(request: Request):
    """Render the chat interface"""
    return templates.TemplateResponse("chat.html", {"request": request})

@app.post("/chat")
async def chat_api(request: Request):
    data = await request.json()
    message = data.get("message", "")
    return chatbot.get_answer(message)

@app.get("/upload")
def upload_page(request: Request):
    return templates.TemplateResponse("upload.html", {"request": request})

@app.post("/upload")
async def upload_view(request: Request, image: UploadFile = File(None), document: UploadFile = File(None)):
    if image and image.filename:
        result = chatbot.process_image(image_file=image)
        image_url = None
    elif document and document.filename:
        result = chatbot.process_document(document)
        image_url = None
    else:
        result = "No image or document uploaded."
        image_url = None
    return templates.TemplateResponse("result.html", {"request": request, "result": result, "image_url": image_url})


# ─────────────────────────────────────────────────────────
# 🔬 ADVANCED RESEARCH-POWERED API ENDPOINTS
# From AI_ML_Analysis_Enhanced_v2_FIXED.ipynb research
# ─────────────────────────────────────────────────────────

@app.get("/api/models/compare")
def compare_all_models(
    temp: float = Query(32.0, description="Temperature in °C"),
    precip: float = Query(5.0, description="Precipitation in mm"),
    soil: float = Query(0.20, description="Soil moisture (0-1 or 0-100%)"),
    wind: float = Query(10.0, description="Wind speed in km/h"),
    pressure: float = Query(1013.0, description="Pressure in hPa")
):
    """
    🔬 Compare predictions from ALL 8 research-validated ML models.
    
    Shows consensus and individual model predictions with confidence.
    Research validation: Cell 23 of AI_ML_Analysis_Enhanced_v2_FIXED.ipynb
    """
    return advanced_api.get_all_models_prediction(temp, precip, soil, wind, pressure)


@app.get("/api/explain/shap")
def get_shap_explanation(
    temp: float = Query(32.0, description="Temperature in °C"),
    precip: float = Query(5.0, description="Precipitation in mm"),
    soil: float = Query(0.20, description="Soil moisture (0-1)"),
    wind: float = Query(10.0, description="Wind speed in km/h"),
    pressure: float = Query(1013.0, description="Pressure in hPa")
):
    """
    📊 Get SHAP-based feature importance explanation.
    
    Shows WHY the model predicts a certain stress level.
    Research validation: Cell 40 of AI_ML_Analysis_Enhanced_v2_FIXED.ipynb
    """
    return advanced_api.get_shap_explanation(temp, precip, soil, wind, pressure)


@app.get("/api/uncertainty")
def get_uncertainty_analysis(
    temp: float = Query(32.0, description="Temperature in °C"),
    precip: float = Query(5.0, description="Precipitation in mm"),
    soil: float = Query(0.20, description="Soil moisture (0-1)"),
    wind: float = Query(10.0, description="Wind speed in km/h"),
    pressure: float = Query(1013.0, description="Pressure in hPa"),
    n_bootstrap: int = Query(50, description="Number of bootstrap iterations")
):
    """
    📈 Bootstrap uncertainty quantification.
    
    Returns confidence intervals and prediction distribution.
    Research validation: Cell 37 of AI_ML_Analysis_Enhanced_v2_FIXED.ipynb
    """
    return advanced_api.get_uncertainty_analysis(temp, precip, soil, wind, pressure, n_bootstrap)


@app.get("/api/climate/projections")
def get_climate_projections(
    taluk: str = Query("Palakkad", description="Taluk name"),
    year: int = Query(2030, description="Projection year (2025-2050)")
):
    """
    🌍 Climate projection scenario planner.
    
    Shows projected climate conditions and crop suitability for future years.
    Based on IPCC moderate scenario (RCP 4.5).
    """
    return advanced_api.get_climate_projections(taluk, year)


@app.get("/api/map/stress-overview")
def get_stress_overview():
    """
    🗺️ Get current stress levels for all 13 Palakkad taluks.
    
    Returns data for 3D heatmap visualization.
    Includes GPS coordinates, elevation, and stress metrics.
    """
    return advanced_api.get_taluk_stress_overview()


@app.get("/api/research/summary")
def get_research_summary():
    """
    📚 Research summary and methodology.
    
    Shows key metrics, model accuracies, and unique features.
    For panel presentation and documentation.
    """
    return advanced_api.get_research_summary()


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "features": [
            "8-model ensemble prediction",
            "SHAP explainability",
            "Bootstrap uncertainty",
            "Climate projections",
            "3D stress mapping"
        ]
    }

