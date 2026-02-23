#!/usr/bin/env python
"""Test script to verify crop classifier works"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    import transformers
    print("✓ transformers imported")
    
    import torch
    print("✓ torch imported")
    
    from PIL import Image
    print("✓ PIL imported")
    
    import crop_classifier
    print("✓ crop_classifier imported")
    
    print("\nInitializing crop classifier...")
    crop_classifier.initialize()
    print("✓ Crop classifier initialized")
    
    print("\nAll tests passed! The system is ready for crop classification.")
    
except Exception as e:
    print(f"✗ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
