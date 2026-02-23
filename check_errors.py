import json
import sys

# Load notebook
with open('AI_ML_Analysis_Enhanced_v2_FIXED.ipynb', encoding='utf-8') as f:
    nb = json.load(f)

# Find error cells
error_cells = []
for i, cell in enumerate(nb['cells']):
    if cell.get('outputs'):
        for out in cell.get('outputs', []):
            if 'ename' in out:
                error_cells.append((i, cell, out))
                break

print(f'Found {len(error_cells)} cells with errors\n')

for cell_idx, cell, error_out in error_cells:
    print(f"Cell {cell_idx} (execution_count={cell.get('execution_count', 'None')}):")
    print(f"  Error: {error_out.get('ename', 'Unknown')}: {error_out.get('evalue', '')}")
    print(f"  First few lines of code:")
    for line in ''.join(cell.get('source', []))[:200].split('\n')[:3]:
        print(f"    {line}")
    print()
