import os
from pydantic_settings import BaseSettings

# Compute project base paths dynamically
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

class Settings(BaseSettings):
    PROJECT_NAME: str = "BurnGuard AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Project Root Directory
    BASE_DIR: str = PROJECT_ROOT
    
    # Database URL defaults to sqlite for local dev, can be overridden by env variable (e.g. postgresql://...)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(PROJECT_ROOT, 'burnguard.db')}"
    )
    
    # Model Artifact & Data Paths (relative to PROJECT_ROOT)
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.join(PROJECT_ROOT, "models"))
    DATA_RAW_DIR: str = os.getenv("DATA_RAW_DIR", os.path.join(PROJECT_ROOT, "data", "raw"))
    
    # Hybrid Risk Scoring Weights
    ANOMALY_WEIGHT: float = float(os.getenv("ANOMALY_WEIGHT", "0.40"))
    EARLY_DRIFT_WEIGHT: float = float(os.getenv("EARLY_DRIFT_WEIGHT", "0.25"))
    PREDICTED_RISK_WEIGHT: float = float(os.getenv("PREDICTED_RISK_WEIGHT", "0.25"))
    LOT_DEVIATION_WEIGHT: float = float(os.getenv("LOT_DEVIATION_WEIGHT", "0.10"))
    
    class Config:
        case_sensitive = True

settings = Settings()
