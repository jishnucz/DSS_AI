import json

# Load notebook
with open('AI_ML_Analysis_Enhanced_v2_FIXED.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find and print lines with iloc usage in SHAP cell
for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = ''.join(cell['source'])
        if 'X_sample' in source and 'iloc' in source:
            print(f"Cell {i}:")
            print("="*80)
            lines = source.split('\n')
            for j, line in enumerate(lines, 1):
                if 'iloc' in line:
                    # Print context: 2 lines before and after
                    start = max(0, j-3)
                    end = min(len(lines), j+2)
                    for k in range(start, end):
                        marker = ">>> " if k == j-1 else "    "
                        print(f"{marker}{k+1:4d}: {lines[k]}")
                    print()
