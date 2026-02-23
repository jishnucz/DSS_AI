import json

# Load notebook
with open('AI_ML_Analysis_Enhanced_v2_FIXED.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find SHAP cell
for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = ''.join(cell['source'])
        if 'SHAP' in source and 'iloc' in source:
            lines = source.split('\n')
            # Print lines 108-122 with full text
            for j in range(107, 122):
                if j < len(lines):
                    print(f"{j+1:4d}: {repr(lines[j])}")
            break
