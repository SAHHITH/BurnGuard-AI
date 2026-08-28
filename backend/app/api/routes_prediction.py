from fastapi import APIRouter, HTTPException
from app.schemas.schemas import SinglePredictionRequest, SinglePredictionResponse
from app.services.prediction_service import prediction_manager

router = APIRouter(prefix="/predict", tags=["Real-time Prediction"])

@router.post("", response_model=SinglePredictionResponse)
def predict_single_component(payload: SinglePredictionRequest):
    """
    Real-time inference endpoint for single electronic component screening.
    Accepts 0h, 24h measurements, temperature, and lot ID to produce Anomaly Score,
    Predicted 168h Value, Hybrid Risk Score, Status, and Explainability Reasons.
    """
    try:
        res = prediction_manager.predict_single(
            comp_id=payload.component_id,
            lot_id=payload.lot_id,
            val_0h=payload.value_0h,
            val_24h=payload.value_24h,
            temp=payload.temperature
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
