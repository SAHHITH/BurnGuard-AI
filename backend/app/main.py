import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.api.routes_data import router as data_router
from app.api.routes_components import router as components_router
from app.api.routes_prediction import router as prediction_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_models import router as models_router
from app.services.data_service import generate_and_seed_demo_data
from app.models.database_models import ComponentModel

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Driven Predictive Anomaly Detection & 168h Drift Screening Platform for Electronic Components",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# Enable CORS for local dev and frontend docker container
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
def health_check():
    """
    Application Health Check
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
    db = SessionLocal()
    try:
        count = db.query(ComponentModel).count()
        if count == 0:
            print("[INFO] Database is empty. Seeding initial demo dataset...")
            generate_and_seed_demo_data(db, num_components=1000)
            print("[OK] Initial database seed completed.")
    except Exception as e:
        print(f"[WARNING] Database startup seed check failed: {e}")
    finally:
        db.close()
