# Application Screenshot Capture Script
# Run this script to capture all required screenshots for the journal paper

param(
    [string]$OutputDir = ".\screenshots",
    [switch]$OpenBrowser
)

Write-Host "="*60 -ForegroundColor Cyan
Write-Host " AgriDSS Screenshot Capture Guide" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Cyan

# Create screenshots directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created screenshots directory: $OutputDir" -ForegroundColor Yellow
}

Write-Host "`n📸 REQUIRED SCREENSHOTS FOR JOURNAL PAPER`n" -ForegroundColor White

$screenshots = @(
    @{Name="01_dashboard_main"; Description="Main dashboard showing Welcome screen and navigation tabs"},
    @{Name="02_dashboard_features"; Description="Feature cards showing DSS, Classifier, Research, Chat capabilities"},
    @{Name="03_dss_input"; Description="DSS Input form with taluk selector, crop dropdown, date pickers"},
    @{Name="04_dss_output"; Description="DSS Results showing stress gauge, weather panel, advisory"},
    @{Name="05_dss_forecast"; Description="7-day forecast chart with confidence intervals"},
    @{Name="06_classifier_upload"; Description="Crop classifier showing image upload interface"},
    @{Name="07_classifier_result"; Description="Classifier result with health score and color analysis"},
    @{Name="08_research_models"; Description="Research dashboard with 8-model comparison chart"},
    @{Name="09_research_shap"; Description="SHAP explanation panel showing feature contributions"},
    @{Name="10_research_climate"; Description="Climate projections graph (RCP 4.5/8.5)"},
    @{Name="11_taluk_heatmap"; Description="Taluk-level vulnerability heatmap"},
    @{Name="12_chatbot"; Description="Agricultural chatbot interface with sample conversation"},
    @{Name="13_multilingual"; Description="Language selector showing EN/ML/TA/HI options"},
    @{Name="14_mobile_view"; Description="Mobile responsive view (use DevTools)"}
)

foreach ($ss in $screenshots) {
    Write-Host ("  {0,-25} → {1}" -f $ss.Name, $ss.Description) -ForegroundColor Gray
}

Write-Host "`n📋 CAPTURE INSTRUCTIONS`n" -ForegroundColor Yellow

$instructions = @"
1. Start the application:
   cd frontend
   npm run dev

2. Open http://localhost:5173 in Chrome/Edge

3. Use browser DevTools (F12) → More Tools → "Capture full size screenshot"
   OR use Snipping Tool (Win+Shift+S)

4. Save each screenshot with the exact filename shown above

5. Recommended settings:
   - Browser width: 1280px
   - Use incognito mode for clean UI
   - Set language to English for main screenshots
   - Hide browser bookmarks toolbar

6. For mobile view:
   - Press F12 → Toggle device toolbar (Ctrl+Shift+M)
   - Select "iPhone 12 Pro" or similar

"@

Write-Host $instructions -ForegroundColor White

Write-Host "`n📁 EXISTING RESEARCH FIGURES`n" -ForegroundColor Yellow

$figuresPath = ".\research_analysis\figures"
if (Test-Path $figuresPath) {
    $figures = Get-ChildItem -Path $figuresPath -Filter "*.png"
    $figures | ForEach-Object {
        Write-Host ("  ✓ {0}" -f $_.Name) -ForegroundColor Green
    }
    Write-Host ("`n  Total: {0} research figures available" -f $figures.Count) -ForegroundColor Cyan
} else {
    Write-Host "  ! Figures directory not found at $figuresPath" -ForegroundColor Red
}

if ($OpenBrowser) {
    Write-Host "`nStarting frontend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev"
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:5173"
}

Write-Host "`n"
Write-Host "="*60 -ForegroundColor Cyan
Write-Host " After capturing, run: python generate_paper_figures.py" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Cyan
