# Quick Start Guide - Palakkad DSS with Crop Classification

## Prerequisites
- Python 3.12+ installed
- Node.js 18+ installed
- 2GB free disk space
- 4GB RAM minimum

## Setup Steps

### 1. Backend Setup (First Time Only)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install fastapi uvicorn tensorflow scikit-learn numpy requests transformers torch pillow

# Verify installation
python test_classifier.py
```

**Expected Output:**
```
✓ transformers imported
✓ torch imported
✓ PIL imported
✓ crop_classifier imported
✓ Crop classifier initialized
All tests passed! The system is ready for crop classification.
```

### 2. Frontend Setup (First Time Only)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Verify installation
npm list react axios vite
```

## Running the System

### Terminal 1: Start Backend
```bash
cd backend
python -m uvicorn app:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✓ Backend ready at: http://127.0.0.1:8000

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v7.3.1  ready in XXX ms
➜  Local:   http://localhost:5174/
```

✓ Frontend ready at: http://localhost:5174

### Terminal 3: Monitor (Optional)
In the backend terminal, you'll see API requests as you use the system.

## First-Time Model Download

When you first use the crop classification feature:
1. BLIP model downloads (~1GB) from Hugging Face
2. This takes 5-10 minutes on first run
3. Subsequent uses are fast (cached locally)
4. Check backend terminal for progress

## Using the System

### 1. Run DSS Analysis
1. Open http://localhost:5174 in browser
2. Fill in the form:
   - **Location:** Palakkad (or your location)
   - **Crop:** rice (or your crop)
   - **Sowing Date:** When you planted
   - **Check Date:** Today's date
3. Click "Run DSS Analysis"
4. View results: Climate stress, growth stage, weather, and advice

### 2. Classify Crop from Image
1. Scroll down to "Crop Image Classification" section
2. Click the upload area or drag an image
3. Supported formats: PNG, JPG, GIF
4. Maximum size: 10MB
5. Click "Classify Crop" button
6. Wait 3-5 seconds for results
7. View: Crop name, confidence, description, and care tips

### 3. Supported Crops
- Rice
- Wheat
- Maize
- Tomato
- Potato
- Onion
- Coconut
- Soybean
- Sugarcane
- Cotton

## Troubleshooting

### Issue: "Backend not running" error
**Solution:**
```bash
# Terminal 1: Kill any existing process on port 8000
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -i :8000

# Then restart:
cd backend
python -m uvicorn app:app --reload --port 8000
```

### Issue: "Cannot find module transformers"
**Solution:**
```bash
pip install transformers torch --upgrade
python backend/test_classifier.py
```

### Issue: Image upload not working
**Solution:**
1. Check file size (<10MB)
2. Check file format (PNG, JPG, GIF)
3. Check backend is running
4. Check browser console (F12) for errors

### Issue: BLIP model downloading forever
**Solution:**
1. This is normal on first run (1-2GB download)
2. Wait for completion (5-10 minutes typical)
3. Check internet connection
4. On subsequent runs, model loads instantly

### Issue: Port 5174 already in use
**Solution:**
```bash
# Frontend automatically tries next port
# Check console output for actual port
# Usually: http://localhost:5173, 5174, 5175, etc.
```

### Issue: CORS errors in browser
**Solution:**
1. Ensure backend is running on http://127.0.0.1:8000
2. Not http://localhost:8000 (important!)
3. Check backend app.py has CORS middleware enabled

## File Structure

```
palakkad_dss/
├── backend/
│   ├── app.py                    # FastAPI server
│   ├── dss_engine.py             # DSS logic
│   ├── crop_classifier.py        # Crop classification
│   ├── test_classifier.py        # Test script
│   ├── model/
│   │   ├── lstm_model.h5         # Neural network model
│   │   └── scaler.save           # Data scaler
│   └── data/                     # Weather data cache
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx     # Main page
│   │   ├── components/
│   │   │   ├── DSSInput.jsx      # Form input
│   │   │   ├── DSSOutput.jsx     # Results display
│   │   │   ├── ForecastTable.jsx # Weather forecast
│   │   │   └── CropClassification.jsx # Image upload (NEW)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── INTEGRATION_GUIDE.md           # Complete system documentation
├── CROP_CLASSIFICATION_INTEGRATION.md # Integration details
└── README.md                      # (if exists)
```

## Key Endpoints

### DSS Analysis
- **URL:** http://127.0.0.1:8000/dss
- **Method:** POST
- **Test with curl:**
```bash
curl -X POST http://127.0.0.1:8000/dss \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Palakkad",
    "crop": "rice",
    "sowing_date": "2024-06-15",
    "check_date": "2024-07-15"
  }'
```

### Crop Classification
- **URL:** http://127.0.0.1:8000/classify-crop
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Parameter:** file (image file)

### Health Check
- **URL:** http://127.0.0.1:8000/
- **Method:** GET
- **Response:** `{"message": "Palakkad DSS Running"}`

## Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| DSS Analysis | 2-3 sec | Includes weather API call |
| Model Loading (First) | 5-10 min | One-time download |
| Crop Classification | 3-5 sec | After model loaded |
| Weather Forecast | 1 sec | Cached after first run |

## Tips for Best Results

### For DSS Analysis
1. Use accurate sowing date (critical for growth stage)
2. Check date should be recent (last 30 days)
3. Palakkad coordinates are pre-set (10.78°N, 76.65°E)
4. Works best with registered crops

### For Crop Classification
1. Use clear, well-lit images
2. Include full plant in frame
3. Use supported crop types
4. Images between 1-5MB work best
5. PNG/JPG preferred over GIF

## Next Steps

1. **Explore the System:**
   - Run a DSS analysis for your crop
   - Upload a crop image to test classification

2. **Customize:**
   - Change location coordinates in dss_engine.py
   - Modify CSS in index.css for branding
   - Add more crops in crop_classifier.py

3. **Deploy:**
   - Use Docker for containerization
   - Deploy on cloud (AWS, Azure, GCP)
   - Create mobile app wrapper

4. **Extend:**
   - Add soil testing integration
   - Connect market price API
   - Add SMS/email notifications
   - Create farmer profile system

## Getting Help

1. **Check backend logs:**
   - Look at Terminal 1 for error messages
   - Enable debug mode in app.py

2. **Check frontend logs:**
   - Open browser Developer Tools (F12)
   - Check Console and Network tabs

3. **Run test script:**
   ```bash
   cd backend
   python test_classifier.py
   ```

4. **Verify files exist:**
   ```bash
   # Check model files
   ls backend/model/
   
   # Should show:
   # lstm_model.h5
   # scaler.save
   ```

## System Capabilities

✓ Real-time weather data from Open-Meteo API
✓ LSTM neural network for climate stress prediction
✓ BLIP AI model for crop image classification
✓ Automated growth stage calculation
✓ Multi-level farmer advisories
✓ 3-day weather forecast
✓ Responsive web interface
✓ Mobile-friendly design
✓ RESTful API architecture

## Support Files

- `INTEGRATION_GUIDE.md` - Complete technical documentation
- `CROP_CLASSIFICATION_INTEGRATION.md` - Crop classification details
- `backend/test_classifier.py` - Automated testing script

---

**Ready to start?** Open Terminal 1 and run: `cd backend && python -m uvicorn app:app --reload --port 8000`
