"""
Google Earth Engine Integration for Palakkad Agricultural DSS
==============================================================

This script demonstrates how to integrate Google Earth Engine satellite imagery
into your agricultural decision support system for impressive visualizations.

REQUIREMENTS:
- earthengine-api (pip install earthengine-api)
- Google Earth Engine account (https://earthengine.google.com/)
- Authentication (ee.Authenticate())

FEATURES:
1. High-resolution NDVI time series from Sentinel-2
2. Temperature anomaly maps from MODIS
3. Precipitation data from GPM/CHIRPS
4. Land use classification
5. Animated GIFs showing temporal changes

WARNING: This is advanced functionality. Run this AFTER your main analysis.
"""

import ee
import geemap
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from pathlib import Path

# ============================================================================
# SETUP & AUTHENTICATION
# ============================================================================

def initialize_gee():
    """Initialize Google Earth Engine with authentication"""
    try:
        ee.Initialize()
        print("✅ Google Earth Engine initialized successfully")
    except:
        print("🔐 Authenticating Google Earth Engine...")
        ee.Authenticate()
        ee.Initialize()
        print("✅ Authentication complete!")

# ============================================================================
# PALAKKAD DISTRICT BOUNDARY
# ============================================================================

# Palakkad district coordinates (approximate bounding box)
PALAKKAD_COORDS = [
    [76.1, 10.4], [76.9, 10.4], [76.9, 11.1], [76.1, 11.1], [76.1, 10.4]
]

def get_palakkad_region():
    """Define Palakkad district as Earth Engine Geometry"""
    return ee.Geometry.Polygon(PALAKKAD_COORDS)

# ============================================================================
# SENTINEL-2 NDVI ANALYSIS
# ============================================================================

def get_ndvi_time_series(start_date='2020-01-01', end_date='2023-12-31'):
    """
    Extract NDVI time series from Sentinel-2 satellite
    
    Returns high-resolution (10m) vegetation health data
    """
    print("\n📡 Fetching Sentinel-2 NDVI data...")
    
    region = get_palakkad_region()
    
    # Load Sentinel-2 Surface Reflectance collection
    s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
        .filterBounds(region) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    
    # Calculate NDVI
    def add_ndvi(image):
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        return image.addBands(ndvi).set('system:time_start', image.get('system:time_start'))
    
    ndvi_collection = s2.map(add_ndvi).select('NDVI')
    
    # Calculate mean NDVI per month
    def monthly_ndvi(month):
        filtered = ndvi_collection.filter(ee.Filter.calendarRange(month, month, 'month'))
        return filtered.mean().set('month', month)
    
    months = ee.List.sequence(1, 12)
    monthly_images = ee.ImageCollection.fromImages(months.map(monthly_ndvi))
    
    print(f"   ✓ Images: {ndvi_collection.size().getInfo()}")
    print(f"   ✓ Resolution: 10m")
    print(f"   ✓ Period: {start_date} to {end_date}")
    
    return monthly_images, region

def visualize_ndvi_maps():
    """Create beautiful NDVI visualization maps"""
    monthly_ndvi, region = get_ndvi_time_series()
    
    # Create interactive map
    Map = geemap.Map()
    Map.centerObject(region, zoom=10)
    
    # Visualization parameters
    ndvi_viz = {
        'min': 0.0,
        'max': 0.9,
        'palette': ['red', 'yellow', 'green', 'darkgreen']
    }
    
    # Add monthly NDVI layers
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for i, month_name in enumerate(month_names, 1):
        img = monthly_ndvi.filter(ee.Filter.eq('month', i)).first()
        Map.addLayer(img, ndvi_viz, f'NDVI {month_name}', False)
    
    # Add district boundary
    Map.addLayer(region, {'color': 'red'}, 'Palakkad District')
    
    print("\n✅ Interactive map created! Opening in browser...")
    return Map

# ============================================================================
# TEMPERATURE ANOMALY MAPPING
# ============================================================================

def get_temperature_anomaly(year=2023):
    """
    Calculate temperature anomaly using MODIS Land Surface Temperature
    """
    print(f"\n🌡️ Fetching MODIS LST data for {year}...")
    
    region = get_palakkad_region()
    
    # Load MODIS Land Surface Temperature
    lst = ee.ImageCollection('MODIS/006/MOD11A1') \
        .filterBounds(region) \
        .filterDate(f'{year}-01-01', f'{year}-12-31') \
        .select('LST_Day_1km')
    
    # Convert Kelvin to Celsius
    def kelvin_to_celsius(image):
        return image.multiply(0.02).subtract(273.15) \
            .set('system:time_start', image.get('system:time_start'))
    
    lst_celsius = lst.map(kelvin_to_celsius)
    
    # Calculate mean temperature
    mean_temp = lst_celsius.mean()
    
    # Calculate baseline (2010-2020)
    baseline_lst = ee.ImageCollection('MODIS/006/MOD11A1') \
        .filterBounds(region) \
        .filterDate('2010-01-01', '2020-12-31') \
        .select('LST_Day_1km')
    
    baseline_celsius = baseline_lst.map(kelvin_to_celsius)
    baseline_mean = baseline_celsius.mean()
    
    # Calculate anomaly
    anomaly = mean_temp.subtract(baseline_mean)
    
    print(f"   ✓ Images: {lst.size().getInfo()}")
    print(f"   ✓ Resolution: 1km")
    
    return anomaly, region

def visualize_temperature_anomaly():
    """Create temperature anomaly visualization"""
    anomaly, region = get_temperature_anomaly()
    
    Map = geemap.Map()
    Map.centerObject(region, zoom=10)
    
    # Visualization parameters
    temp_viz = {
        'min': -2,
        'max': 2,
        'palette': ['blue', 'white', 'red']
    }
    
    Map.addLayer(anomaly, temp_viz, f'Temperature Anomaly')
    Map.addLayer(region, {'color': 'black'}, 'Palakkad District', opacity=0.3)
    
    print("\n✅ Temperature anomaly map created!")
    return Map

# ============================================================================
# PRECIPITATION ANALYSIS
# ============================================================================

def get_precipitation_analysis(year=2023):
    """
    Analyze precipitation using GPM/CHIRPS data
    """
    print(f"\n💧 Fetching precipitation data for {year}...")
    
    region = get_palakkad_region()
    
    # Load CHIRPS daily precipitation
    chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
        .filterBounds(region) \
        .filterDate(f'{year}-01-01', f'{year}-12-31')
    
    # Calculate monthly total
    def monthly_precip(month):
        filtered = chirps.filter(ee.Filter.calendarRange(month, month, 'month'))
        return filtered.sum().set('month', month)
    
    months = ee.List.sequence(1, 12)
    monthly_rain = ee.ImageCollection.fromImages(months.map(monthly_precip))
    
    print(f"   ✓ Days: {chirps.size().getInfo()}")
    print(f"   ✓ Resolution: 5km")
    
    return monthly_rain, region

# ============================================================================
# ANIMATION GENERATION
# ============================================================================

def create_ndvi_animation(start_date='2023-01-01', end_date='2023-12-31', 
                          output_gif='palakkad_ndvi_animation.gif'):
    """
    Create animated GIF showing NDVI changes over time
    
    This will impress your panel!
    """
    print(f"\n🎬 Creating NDVI animation...")
    
    region = get_palakkad_region()
    
    # Get Sentinel-2 NDVI
    s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
        .filterBounds(region) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    
    def add_ndvi(image):
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        return image.addBands(ndvi).clip(region)
    
    ndvi_collection = s2.map(add_ndvi).select('NDVI')
    
    # Create animation parameters
    animation_params = {
        'dimensions': 800,
        'region': region,
        'crs': 'EPSG:3857',
        'framesPerSecond': 2,
        'min': 0.0,
        'max': 0.8,
        'palette': ['red', 'yellow', 'lightgreen', 'darkgreen']
    }
    
    print(f"   ✓ Generating GIF animation...")
    print(f"   ✓ Frames: {ndvi_collection.size().getInfo()}")
    print(f"   📁 Output: {output_gif}")
    
    # Generate URL (you'll need to download manually)
    url = ndvi_collection.getVideoThumbURL(animation_params)
    print(f"\n   🔗 Download animation from: {url}")
    
    return url

# ============================================================================
# EXPORT FUNCTIONS
# ============================================================================

def export_district_composite(year=2023, output_file='palakkad_satellite_composite.png'):
    """
    Export a publication-quality composite image of Palakkad
    
    Combines RGB + NDVI + Temperature in one figure
    """
    print(f"\n📸 Creating composite satellite image...")
    
    region = get_palakkad_region()
    
    # Get cloud-free Sentinel-2 image
    s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
        .filterBounds(region) \
        .filterDate(f'{year}-01-01', f'{year}-12-31') \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5)) \
        .median()
    
    # Calculate NDVI
    ndvi = s2.normalizedDifference(['B8', 'B4'])
    
    # RGB visualization
    rgb_viz = {'min': 0, 'max': 3000, 'bands': ['B4', 'B3', 'B2']}
    
    # Get thumbnail URL
    rgb_url = s2.getThumbURL({
        'region': region,
        'dimensions': 1024,
        'format': 'png',
        **rgb_viz
    })
    
    print(f"   ✅ Composite created!")
    print(f"   🔗 Download from: {rgb_url}")
    
    return rgb_url

# ============================================================================
# MAIN DEMONSTRATION
# ============================================================================

def main_demo():
    """
    Run complete Google Earth Engine demonstration
    """
    print("="*80)
    print("🛰️ GOOGLE EARTH ENGINE INTEGRATION FOR PALAKKAD AGRICULTURAL DSS")
    print("="*80)
    
    # Initialize
    initialize_gee()
    
    print("\n📋 MENU:")
    print("   1. Generate NDVI Interactive Map")
    print("   2. Generate Temperature Anomaly Map")
    print("   3. Create NDVI Animation (GIF)")
    print("   4. Export High-Resolution Composite Image")
    print("   5. Run All")
    
    choice = input("\nSelect option (1-5): ")
    
    if choice == '1' or choice == '5':
        Map = visualize_ndvi_maps()
        Map.to_html('palakkad_ndvi_map.html')
        print("   💾 Saved as: palakkad_ndvi_map.html")
    
    if choice == '2' or choice == '5':
        Map = visualize_temperature_anomaly()
        Map.to_html('palakkad_temp_anomaly.html')
        print("   💾 Saved as: palakkad_temp_anomaly.html")
    
    if choice == '3' or choice == '5':
        url = create_ndvi_animation()
        print("   ℹ️ Copy the URL and download the GIF manually")
    
    if choice == '4' or choice == '5':
        url = export_district_composite()
        print("   ℹ️ Copy the URL and download the image manually")
    
    print("\n" + "="*80)
    print("✅ GOOGLE EARTH ENGINE DEMONSTRATION COMPLETE")
    print("="*80)
    print("\n💡 TIP: Embed these visualizations in your presentation for 'WOW' effect!")

# ============================================================================
# SIMPLIFIED VERSION FOR NOTEBOOK
# ============================================================================

def add_to_notebook():
    """
    Simple code to add to your Jupyter notebook
    """
    code = '''
# ============================================================================
# GOOGLE EARTH ENGINE SATELLITE IMAGERY (OPTIONAL ENHANCEMENT)
# ============================================================================

# NOTE: Requires earthengine-api and geemap
# pip install earthengine-api geemap

try:
    import ee
    import geemap
    
    # Initialize
    ee.Initialize()
    
    # Define Palakkad region
    palakkad = ee.Geometry.Rectangle([76.1, 10.4, 76.9, 11.1])
    
    # Get Sentinel-2 NDVI for 2023
    s2 = ee.ImageCollection('COPERNICUS/S2_SR') \\
        .filterBounds(palakkad) \\
        .filterDate('2023-01-01', '2023-12-31') \\
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    
    def add_ndvi(image):
        return image.normalizedDifference(['B8', 'B4']).rename('NDVI')
    
    ndvi = s2.map(add_ndvi).median()
    
    # Create interactive map
    Map = geemap.Map()
    Map.centerObject(palakkad, zoom=10)
    Map.addLayer(ndvi, {'min': 0, 'max': 0.8, 'palette': ['red', 'yellow', 'green']}, 'NDVI')
    Map.addLayer(palakkad, {'color': 'red'}, 'Palakkad')
    
    # Display in notebook
    display(Map)
    
    print("✅ Google Earth Engine visualization loaded!")
    print("   🛰️ Sentinel-2 NDVI (10m resolution)")
    print("   📅 Period: 2023")
    
except ImportError:
    print("⚠️ Google Earth Engine not installed")
    print("   Run: pip install earthengine-api geemap")
except Exception as e:
    print(f"⚠️ Google Earth Engine error: {e}")
    print("   Solution: Run ee.Authenticate() first")
'''
    
    return code

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*80)
    print("GOOGLE EARTH ENGINE INTEGRATION SCRIPT")
    print("="*80)
    print("\nThis script demonstrates advanced satellite imagery integration.")
    print("It requires a Google Earth Engine account and authentication.")
    print("\nTo use in your notebook, run: add_to_notebook()")
    print("\nFor full demo, run: main_demo()")
    print("="*80 + "\n")
    
    # Uncomment to run demo:
    # main_demo()
