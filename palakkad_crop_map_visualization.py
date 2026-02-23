"""
Palakkad Crop Distribution Map Visualization
============================================
Creates interactive and static maps showing crop distribution across Palakkad taluks
For integration into Agricultural DSS Application

Author: Agricultural DSS Team
Date: 2026
"""

import sys
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from pathlib import Path

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ============================================================================
# 1. LOAD DATA
# ============================================================================

print("="*80)
print("🗺️  PALAKKAD DISTRICT CROP DISTRIBUTION MAPPING SYSTEM")
print("="*80)

data_dir = Path('data')

# Load datasets
taluk_map = pd.read_csv(data_dir / 'palakkad_taluk_crop_map.csv')
crop_dist = pd.read_csv(data_dir / 'palakkad_crop_distribution.csv')

print(f"\n✅ Loaded {len(taluk_map)} taluks")
print(f"✅ Loaded {len(crop_dist)} crop entries")

# ============================================================================
# 2. DATA SUMMARY
# ============================================================================

print("\n" + "="*80)
print("📊 PALAKKAD DISTRICT AGRICULTURAL PROFILE")
print("="*80)

total_area = taluk_map['area_sqkm'].sum()
total_cultivated = taluk_map['total_cultivated_area_ha'].sum()

print(f"\n🏞️  DISTRICT OVERVIEW:")
print(f"   • Total Geographic Area: {total_area:,.0f} sq.km")
print(f"   • Total Cultivated Area: {total_cultivated:,} hectares")
print(f"   • Cultivation Intensity: {total_cultivated/(total_area*100)*100:.1f}%")
print(f"   • Number of Taluks: {len(taluk_map)}")

print(f"\n🌾 CROP DIVERSITY:")
crop_types = crop_dist['crop_type'].value_counts()
print(f"   • Total Crop Varieties: {len(crop_dist['crop_name'].unique())}")
print(f"   • Crop Categories: {len(crop_types)}")
for crop_type, count in crop_types.items():
    print(f"     - {crop_type}: {count} varieties")

print(f"\n📈 PRODUCTION STATISTICS:")
total_production = crop_dist['total_production_tons'].sum()
rice_production = crop_dist[crop_dist['crop_name'].str.contains('Rice', na=False)]['total_production_tons'].sum()
print(f"   • Total Annual Production: {total_production:,.0f} tons")
print(f"   • Rice Production: {rice_production:,.0f} tons ({rice_production/total_production*100:.1f}%)")

# ============================================================================
# 3. VISUALIZATION 1: TALUK MAP WITH CROP ZONES
# ============================================================================

print("\n📊 Generating Taluk-wise Crop Distribution Map...")

fig = plt.figure(figsize=(18, 14))

# Main map
ax1 = plt.subplot(2, 2, (1, 3))

# Color code by agro-ecological zone
zone_colors = {
    'Midland': '#90EE90',
    'Plains': '#FFD700',
    'Highland': '#87CEEB',
    'Lowland': '#98FB98',
    'Highland Transition': '#B0E0E6',
    'Rainshadow Highland': '#F4A460',
    'Midland-Highland': '#ADD8E6'
}

# Plot taluk locations
for idx, row in taluk_map.iterrows():
    color = zone_colors.get(row['agro_zone'], '#CCCCCC')
    
    # Marker size proportional to cultivated area
    size = (row['total_cultivated_area_ha'] / 500) ** 0.8
    
    ax1.scatter(row['longitude'], row['latitude'], 
               s=size*100, c=color, alpha=0.7, 
               edgecolors='black', linewidth=2, zorder=3)
    
    # Add taluk name
    ax1.text(row['longitude'], row['latitude'] + 0.03, row['taluk_name'],
            fontsize=9, ha='center', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8, edgecolor='black'))

ax1.set_xlabel('Longitude (°E)', fontsize=13, fontweight='bold')
ax1.set_ylabel('Latitude (°N)', fontsize=13, fontweight='bold')
ax1.set_title('🗺️ Palakkad District: Taluk-wise Agro-Ecological Zones\n(Marker size = Cultivated Area)', 
             fontsize=15, fontweight='bold', pad=15)
ax1.grid(True, alpha=0.3, linestyle='--')
ax1.set_xlim(76.1, 76.9)
ax1.set_ylim(10.4, 11.2)

# Legend for zones
legend_patches = [mpatches.Patch(color=color, label=zone) 
                 for zone, color in zone_colors.items()]
ax1.legend(handles=legend_patches, loc='upper left', fontsize=10, 
          title='Agro-Ecological Zones', framealpha=0.9)

# Add compass rose
ax1.text(0.95, 0.95, 'N ↑', transform=ax1.transAxes, 
        fontsize=20, fontweight='bold', ha='right', va='top')

# Panel 2: Top 10 Crops by Area
ax2 = plt.subplot(2, 2, 2)
top_crops = crop_dist.groupby('crop_name')['area_hectares'].sum().sort_values(ascending=False).head(10)
colors = plt.cm.Spectral(np.linspace(0, 1, len(top_crops)))
bars = ax2.barh(range(len(top_crops)), top_crops.values, color=colors, edgecolor='black', linewidth=1.5)
ax2.set_yticks(range(len(top_crops)))
ax2.set_yticklabels(top_crops.index, fontsize=10)
ax2.set_xlabel('Area (hectares)', fontsize=11, fontweight='bold')
ax2.set_title('🌾 Top 10 Crops by Cultivated Area', fontsize=12, fontweight='bold', pad=10)
ax2.grid(axis='x', alpha=0.3)

# Add value labels
for i, v in enumerate(top_crops.values):
    ax2.text(v + 500, i, f'{v:,.0f} ha', va='center', fontsize=9, fontweight='bold')

# Panel 3: Crop Production by Taluk
ax3 = plt.subplot(2, 2, 4)
taluk_production = crop_dist.groupby('taluk_name')['total_production_tons'].sum().sort_values(ascending=False)
colors = plt.cm.RdYlGn(np.linspace(0.3, 0.9, len(taluk_production)))
bars = ax3.barh(range(len(taluk_production)), taluk_production.values, 
               color=colors, edgecolor='black', linewidth=1.2)
ax3.set_yticks(range(len(taluk_production)))
ax3.set_yticklabels(taluk_production.index, fontsize=9)
ax3.set_xlabel('Total Production (tons/year)', fontsize=11, fontweight='bold')
ax3.set_title('📈 Total Agricultural Production by Taluk', fontsize=12, fontweight='bold', pad=10)
ax3.grid(axis='x', alpha=0.3)

# Add value labels
for i, v in enumerate(taluk_production.values):
    ax3.text(v + 2000, i, f'{v:,.0f}', va='center', fontsize=8, fontweight='bold')

plt.tight_layout()
plt.savefig('figures/palakkad_crop_distribution_map.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: figures/palakkad_crop_distribution_map.png")
plt.show()

# ============================================================================
# 4. VISUALIZATION 2: CROP TYPE HEAT MAP
# ============================================================================

print("\n📊 Generating Crop Type Distribution Heat Map...")

fig, axes = plt.subplots(2, 2, figsize=(18, 12))

crop_categories = ['Cereal', 'Plantation', 'Vegetable', 'Fruit']

for idx, crop_cat in enumerate(crop_categories):
    ax = axes[idx // 2, idx % 2]
    
    # Filter data
    cat_data = crop_dist[crop_dist['crop_type'] == crop_cat]
    
    if len(cat_data) > 0:
        # Pivot for heatmap
        pivot_data = cat_data.pivot_table(
            values='area_hectares', 
            index='taluk_name', 
            columns='crop_name', 
            fill_value=0
        )
        
        # Create heatmap
        sns.heatmap(pivot_data, annot=True, fmt='.0f', cmap='YlGnBu', 
                   linewidths=0.5, cbar_kws={'label': 'Area (ha)'},
                   ax=ax, annot_kws={'fontsize': 8})
        
        ax.set_title(f'🌾 {crop_cat} Crops Distribution Across Taluks', 
                    fontsize=13, fontweight='bold', pad=10)
        ax.set_xlabel('Crop Name', fontsize=11, fontweight='bold')
        ax.set_ylabel('Taluk', fontsize=11, fontweight='bold')
        plt.setp(ax.get_xticklabels(), rotation=45, ha='right', fontsize=9)
        plt.setp(ax.get_yticklabels(), rotation=0, fontsize=9)

plt.tight_layout()
plt.savefig('figures/palakkad_crop_type_heatmap.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved: figures/palakkad_crop_type_heatmap.png")
plt.show()

# ============================================================================
# 5. TALUK-WISE DETAILED REPORT
# ============================================================================

print("\n" + "="*80)
print("📋 TALUK-WISE CROP DISTRIBUTION REPORT")
print("="*80)

for idx, taluk_row in taluk_map.iterrows():
    taluk_name = taluk_row['taluk_name']
    taluk_crops = crop_dist[crop_dist['taluk_name'] == taluk_name]
    
    print(f"\n{'='*80}")
    print(f"📍 {taluk_name.upper()} TALUK")
    print(f"{'='*80}")
    print(f"Location: {taluk_row['latitude']:.4f}°N, {taluk_row['longitude']:.4f}°E")
    print(f"Area: {taluk_row['area_sqkm']} sq.km")
    print(f"Cultivated Area: {taluk_row['total_cultivated_area_ha']:,} hectares")
    print(f"Agro-Ecological Zone: {taluk_row['agro_zone']}")
    print(f"Annual Rainfall: {taluk_row['rainfall_mm']} mm")
    print(f"Soil Type: {taluk_row['soil_type']}")
    print(f"Irrigation: {taluk_row['irrigation_source']}")
    
    print(f"\n🌾 MAJOR CROPS:")
    for _, crop in taluk_crops.iterrows():
        print(f"   • {crop['crop_name']} ({crop['crop_type']})")
        print(f"     - Area: {crop['area_hectares']:,} ha ({crop['percentage_of_taluk']:.1f}% of taluk)")
        print(f"     - Yield: {crop['yield_tons_per_ha']:.1f} tons/ha")
        print(f"     - Production: {crop['total_production_tons']:,.0f} tons/year")
        print(f"     - Season: {crop['season']}")
        print(f"     - Variety: {crop['primary_variety']}")

# ============================================================================
# 6. GENERATE JSON FOR WEB APPLICATION
# ============================================================================

print("\n" + "="*80)
print("💾 GENERATING DATA FILES FOR APPLICATION INTEGRATION")
print("="*80)

# Export for web application
taluk_map.to_json('data/taluk_map.json', orient='records', indent=2)
crop_dist.to_json('data/crop_distribution.json', orient='records', indent=2)

print("✅ Generated: data/taluk_map.json")
print("✅ Generated: data/crop_distribution.json")

# Export summary statistics
summary_stats = {
    'district_summary': {
        'total_area_sqkm': float(total_area),
        'total_cultivated_area_ha': float(total_cultivated),
        'number_of_taluks': len(taluk_map),
        'total_production_tons': float(total_production),
        'rice_production_tons': float(rice_production)
    },
    'taluk_wise': taluk_map.to_dict('records'),
    'crop_distribution': crop_dist.to_dict('records')
}

import json
with open('data/palakkad_agriculture_summary.json', 'w') as f:
    json.dump(summary_stats, f, indent=2)

print("✅ Generated: data/palakkad_agriculture_summary.json")

print("\n" + "="*80)
print("✅ PALAKKAD CROP MAPPING COMPLETE")
print("="*80)
print("\n📌 FILES GENERATED:")
print("   1. palakkad_taluk_crop_map.csv - Taluk locations and characteristics")
print("   2. palakkad_crop_distribution.csv - Detailed crop-wise data")
print("   3. taluk_map.json - JSON for web application")
print("   4. crop_distribution.json - JSON for web application")
print("   5. palakkad_agriculture_summary.json - Complete summary")
print("\n📊 VISUALIZATIONS SAVED:")
print("   1. figures/palakkad_crop_distribution_map.png")
print("   2. figures/palakkad_crop_type_heatmap.png")
print("\n🔗 INTEGRATION: Use JSON files in your React/Node.js application")
print("="*80)
