import json

# Load notebook
with open('AI_ML_Analysis_Enhanced_v2_FIXED.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find SHAP cell - cell 35 based on the output
target_cells = []
for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = ''.join(cell['source'])
        if 'SHAP' in source and 'iloc' in source:
            target_cells.append((i, source))

print(f"Found {len(target_cells)} cells with SHAP and iloc")

for i, source in target_cells:
    print(f"\n{'='*80}")
    print(f"Cell {i}:")
    print('='*80)
    
    # Find the section with iloc
    lines = source.split('\n')
    for j, line in enumerate(lines):
        if j >= 105 and j <= 120:  # Around lines 110-113
            print(f"{j+1:4d}: {line}")
