# Application Screenshots for Journal Paper

## Required Screenshots to Capture

Capture the following screenshots from the running application and save them as PNG files in this folder:

### 1. Main Dashboard (`dashboard_main.png`)
- Show the Welcome tab with feature cards
- Language selector visible
- All navigation tabs visible

### 2. DSS Analysis Input (`dss_input.png`)
- Show the form with location, crop, dates filled
- Before clicking "Run Analysis"

### 3. DSS Analysis Results (`dss_results.png`)
- Show stress gauge with current value
- Weather conditions panel
- Advisory section visible
- 7-day forecast chart

### 4. Crop Image Classifier (`crop_classifier.png`)
- Show an uploaded crop image
- Classification results
- Health analysis bars

### 5. Research Dashboard - Model Comparison (`research_models.png`)
- Show the 8-model comparison chart
- Accuracy bars clearly visible

### 6. Research Dashboard - SHAP Analysis (`research_shap.png`)
- SHAP feature importance panel
- Top 5 features visible

### 7. Research Dashboard - Climate Projections (`research_climate.png`)
- Climate trend visualization
- RCP scenarios if available

### 8. Research Dashboard - Taluk Heatmap (`research_heatmap.png`)
- Stress heatmap by taluk
- Color legend visible

### 9. Multilingual Demo (`multilingual.png`)
- Show interface in Malayalam or Tamil
- Language selector buttons visible

### 10. Chatbot Interface (`chatbot.png`)
- Show conversation with agricultural query
- Response with advice

## How to Capture Screenshots

1. Start the application:
   ```bash
   cd frontend && npm run dev
   cd backend && python app.py
   ```

2. Open browser to `http://localhost:5173`

3. Use Windows Snipping Tool (Win+Shift+S) or browser DevTools

4. For best results, use browser zoom of 100% and window size 1920x1080

5. Save as PNG with names exactly as listed above

## Existing Research Figures

These are already in `research_analysis/figures/`:
- `fig1_model_comparison.png` - ML model accuracy comparison
- `explainability_analysis.png` - SHAP analysis visualization
- `climate_change_projections.png` - Future climate trends
- `palakkad_stress_risk_map.png` - Spatial vulnerability map
- `era5_vs_nasa_power_validation.png` - Data validation results
- `publication_graphical_abstract.png` - Paper graphical abstract
- `publication_ml_results.png` - Detailed ML results
- `standard_vs_physics_comparison.png` - Feature engineering impact
