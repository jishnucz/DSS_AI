
import ee
import geemap
import pandas as pd

# Initialize Earth Engine
ee.Initialize()

# Palakkad district boundary (approximate)
palakkad_bbox = ee.Geometry.Rectangle([76.0, 10.5, 77.0, 11.2])

# Define taluk points
taluks = {
    'Alathur': ee.Geometry.Point([76.5356, 10.6483]),
    'Chittur': ee.Geometry.Point([76.7414, 10.7004]),
    'Palakkad': ee.Geometry.Point([76.6548, 10.7867]),
    'Attappady': ee.Geometry.Point([76.5800, 11.1100]),
    # Add more taluks...
}

# MODIS NDVI collection
modis_ndvi = ee.ImageCollection('MODIS/006/MOD13Q1') \
    .filterBounds(palakkad_bbox) \
    .filterDate('2020-01-01', '2024-12-31') \
    .select('NDVI')

# Function to extract NDVI for a point
def extract_ndvi(image):
    date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
    
    values = {}
    for taluk, point in taluks.items():
        ndvi = image.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point.buffer(250),  # 250m buffer
            scale=250
        ).get('NDVI')
        values[taluk] = ndvi
    
    return ee.Feature(None, {
        'date': date,
        **values
    })

# Map over collection
ndvi_timeseries = modis_ndvi.map(extract_ndvi)

# Convert to pandas (use geemap)
# This requires running in GEE environment
ndvi_df = geemap.ee_to_pandas(ndvi_timeseries)

# Scale NDVI (MODIS stores as scaled integer)
for col in ndvi_df.columns:
    if col != 'date':
        ndvi_df[col] = ndvi_df[col] / 10000

print(ndvi_df.head())
