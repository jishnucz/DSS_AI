import json

# Load notebook
with open('AI_ML_Analysis_Enhanced_v2_FIXED.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Extract all code
text = '\n'.join([''.join(c['source']) for c in nb['cells'] if c['cell_type']=='code'])

print("="*70)
print("VERIFICATION OF FIXES".center(70))
print("="*70)
print()

checks = [
    ("1. Remove .values from correct_mask", 
     "correct_mask = (y_pred_test == y_test)  #" in text),
    
    ("2. Use numpy random choice for sampling", 
     "sample_indices = np.random.choice" in text),
    
    ("3. Fix y_sample array indexing", 
     "y_sample[example_idx] == 1" in text),
    
    ("4. Fix X_sample 2D slicing for predict", 
     "X_sample[example_idx:example_idx+1]" in text),
    
    ("5. Fix X_sample array indexing", 
     "X_sample[example_idx, feat_idx]" in text),
]

all_passed = True
for desc, result in checks:
    status = "✅ PASS" if result else "❌ FAIL"
    print(f"{status}  {desc}")
    if not result:
        all_passed = False

print()
print("="*70)
if all_passed:
    print("✅ ALL FIXES SUCCESSFULLY APPLIED!".center(70))
else:
    print("⚠️  SOME FIXES MISSING - NEEDS ATTENTION".center(70))
print("="*70)
