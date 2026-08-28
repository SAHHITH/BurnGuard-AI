import os
import sys

# Compute paths to ensure root and backend directories are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for path in [ROOT_DIR, BACKEND_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import existing FastAPI application
try:
    from backend.app.main import app
except ImportError:
    from app.main import app

# Expose app / handler for Vercel Python serverless runtime
handler = app
