"""Test configuration and shared fixtures."""
import sys
import os

# Ensure `app` package is importable when running `pytest` from executor-api/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
