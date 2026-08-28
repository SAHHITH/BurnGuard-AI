import os
import sys

# Ensure sys.path includes backend and root directories for seamless imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

for path in [ROOT_DIR, BACKEND_DIR, CURRENT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import settings
    from app.database.connection import engine, Base, SessionLocal
    from app.api.routes_data import router as data_router
    from app.api.routes_components import router as components_router
    from app.api.routes_prediction import router as prediction_router
    from app.api.routes_dashboard import router as dashboard_router
    from app.api.routes_models import router as models_router
    from app.services.data_service import generate_and_seed_demo_data
    from app.models.database_models import ComponentModel
except ImportError:
    from backend.app.config import settings
    from backend.app.database.connection import engine, Base, SessionLocal
    from backend.app.api.routes_data import router as data_router
    from backend.app.api.routes_components import router as components_router
    from backend.app.api.routes_prediction import router as prediction_router
    from backend.app.api.routes_dashboard import router as dashboard_router
    from backend.app.api.routes_models import router as models_router
    from backend.app.services.data_service import generate_and_seed_demo_data
    from backend.app.models.database_models import ComponentModel

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[WARNING] Database table creation check: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Driven Predictive Anomaly Detection & 168h Drift Screening Platform for Electronic Components",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# Enable CORS for local dev and Vercel serverless deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(data_router, prefix=settings.API_PREFIX)
app.include_router(components_router, prefix=settings.API_PREFIX)
app.include_router(prediction_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(models_router, prefix=settings.API_PREFIX)

@app.get("/health", tags=["Health Check"])
@app.get("/api/health", tags=["Health Check"])
def health_check():
    """
    Application Health Check Endpoint
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.on_event("startup")
def startup_db_seed():
    """
    On application startup, checks if DB has components. If empty, seeds initial demo dataset.
    """
    try:
        db = SessionLocal()
        try:
            count = db.query(ComponentModel).count()
            if count == 0:
                print("[INFO] Database is empty. Seeding initial demo dataset...")
                generate_and_seed_demo_data(db, num_components=1000)
                print("[OK] Initial database seed completed.")
        except Exception as e:
            print(f"[WARNING] Database startup seed check: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"[WARNING] Database session initialization during startup: {e}")
