import os
import json
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.schemas.schemas import ModelMetricsResponse
from app.services.prediction_service import prediction_manager

router = APIRouter(prefix="/models", tags=["Model Telemetry & Analytics"])

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_performance_metrics():
    """
    Returns trained ML model performance metrics (MAE, RMSE, R²), anomaly model reports,
    training timestamp, version, and feature importances.
    """
    metrics_path = os.path.join(settings.MODEL_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=444, detail="Model metrics file not found. Run model training pipeline.")

    try:
        with open(metrics_path, "r") as f:
            data = json.load(f)

        feature_importances = {}
        if prediction_manager.is_loaded and prediction_manager.drift_predictor:
            feature_importances = prediction_manager.drift_predictor.get_feature_importances()

        return {
            "model_name": data.get("selected_drift_model", "RandomForestRegressor"),
            "mae": float(data.get("mae", 0.0)),
            "rmse": float(data.get("rmse", 0.0)),
            "r2": float(data.get("r2", 0.0)),
            "training_date": data.get("training_date", "2026-08-27T00:00:00"),
            "model_version": data.get("model_version", "1.0.0"),
            "anomaly_report": data.get("anomaly_report", {}),
            "feature_importances": feature_importances
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read model metrics: {str(e)}")
