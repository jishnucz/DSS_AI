"""Check which libraries are installed for the notebook"""
import importlib
import sys

# Libraries used in the notebook
notebook_libs = [
    ('pandas', 'pd'),
    ('numpy', 'np'),
    ('matplotlib', 'matplotlib.pyplot'),
    ('seaborn', 'sns'),
    ('sklearn', 'scikit-learn'),
    ('scipy', 'scipy.stats'),
    ('tensorflow', 'tensorflow'),
    ('shap', 'shap'),
]

print("="*70)
print("CHECKING NOTEBOOK DEPENDENCIES")
print("="*70)

missing = []
installed = []

for lib, pip_name in notebook_libs:
    try:
        mod = importlib.import_module(lib if '.' not in lib else lib.split('.')[0])
        version = getattr(mod, '__version__', 'unknown')
        print(f"✅ {pip_name:20s} - version {version}")
        installed.append(pip_name)
    except ImportError:
        print(f"❌ {pip_name:20s} - NOT INSTALLED")
        missing.append(pip_name)

print("\n" + "="*70)
print(f"SUMMARY: {len(installed)}/{len(notebook_libs)} libraries installed")
print("="*70)

if missing:
    print("\n📦 TO INSTALL MISSING LIBRARIES:")
    print(f"   pip install {' '.join(missing)}")
else:
    print("\n✅ All dependencies are installed!")
