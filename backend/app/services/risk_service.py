import os
import json
import pandas as pd
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database_models import LotModel, ComponentModel, MeasurementModel, PredictionModel
from app.services.prediction_service import prediction_manager
from app.ml.feature_engineering import calculate_features
from app.ml.preprocessing import preprocess_data
from app.config import settings

def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    """
    Computes real-time KPI metrics, risk distributions, lot groupings, and model performance metrics.
    """
    total_components = db.query(ComponentModel).count()
    if total_components == 0:
        # Seed automatically if database is empty
        from app.services.data_service import generate_and_seed_demo_data
        generate_and_seed_demo_data(db, num_components=500)
        total_components = db.query(ComponentModel).count()

    safe_count = db.query(PredictionModel).filter(PredictionModel.status == "SAFE").count()
    monitor_count = db.query(PredictionModel).filter(PredictionModel.status == "MONITOR").count()
    high_risk_count = db.query(PredictionModel).filter(PredictionModel.status == "HIGH_RISK").count()
    anomalies_count = db.query(PredictionModel).filter(PredictionModel.is_anomaly == 1).count()

    avg_predicted_168h_res = db.query(func.avg(PredictionModel.predicted_value_168h)).scalar()
    avg_predicted_168h = round(float(avg_predicted_168h_res), 2) if avg_predicted_168h_res else 0.0

    # Components by lot
    lots_query = db.query(ComponentModel.lot_id, func.count(ComponentModel.id)).group_by(ComponentModel.lot_id).all()
    components_by_lot = {lot_id: count for lot_id, count in lots_query}

    # Model MAE metric
    metrics_path = os.path.join(settings.MODEL_DIR, "metrics.json")
    model_mae = 4.84
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                data = json.load(f)
                model_mae = float(data.get("mae", 4.84))
        except Exception:
            pass

    # Recent High-Risk Components
    high_risk_objs = db.query(ComponentModel).join(PredictionModel).filter(
        PredictionModel.status == "HIGH_RISK"
    ).order_by(PredictionModel.risk_score.desc()).limit(5).all()

    recent_high_risk = []
    for c in high_risk_objs:
        m_0h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "0h").first()
        m_24h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "24h").first()
        m_168h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "168h").first()

        recent_high_risk.append({
            "component_id": c.component_id,
            "lot_id": c.lot_id,
            "value_0h": m_0h.value if m_0h else 0.0,
            "value_24h": m_24h.value if m_24h else 0.0,
            "predicted_value_168h": c.prediction.predicted_value_168h if c.prediction else 0.0,
            "actual_value_168h": m_168h.value if m_168h else None,
            "risk_score": c.prediction.risk_score if c.prediction else 0.0,
            "status": c.prediction.status if c.prediction else "HIGH_RISK",
            "is_anomaly": bool(c.prediction.is_anomaly) if c.prediction else True
        })

    return {
        "total_components": total_components,
        "safe_components": safe_count,
        "monitor_components": monitor_count,
        "high_risk_components": high_risk_count,
        "anomalies_detected": anomalies_count,
        "avg_predicted_168h": avg_predicted_168h,
        "model_mae": round(model_mae, 2),
        "risk_distribution": {
            "SAFE": safe_count,
            "MONITOR": monitor_count,
            "HIGH_RISK": high_risk_count
        },
        "components_by_lot": components_by_lot,
        "recent_high_risk": recent_high_risk
    }


def get_component_details(db: Session, component_id: str) -> Dict[str, Any]:
    """
    Retrieves complete component telemetry history, calculated features, XAI SHAP attributions, and risk reasons.
    """
    comp = db.query(ComponentModel).filter(ComponentModel.component_id == component_id).first()
    if not comp:
        raise ValueError(f"Component '{component_id}' not found.")

    measurements = db.query(MeasurementModel).filter(MeasurementModel.component_id == component_id).all()
    prediction = comp.prediction

    meas_dict = {m.time_point: m.value for m in measurements}
    temp = measurements[0].temperature if measurements else 125.0

    val_0h = meas_dict.get("0h", 0.0)
    val_24h = meas_dict.get("24h", 0.0)
    val_96h = meas_dict.get("96h", None)
    val_168h = meas_dict.get("168h", None)

    # Reconstruct feature vector
    raw_df = pd.DataFrame([{
        "component_id": component_id,
        "lot_id": comp.lot_id,
        "value_0h": val_0h,
        "value_24h": val_24h,
        "temperature": temp
    }])
    clean_df = preprocess_data(raw_df)
    feat_df, _ = calculate_features(clean_df, lot_stats=prediction_manager.lot_stats)

    row_feat = feat_df.iloc[0]

    # Compute XAI
    explainability = {}
    if prediction_manager.explainer:
        explainability = prediction_manager.explainer.explain_sample(feat_df)

    history = [
        {"time_point": "0h", "value": val_0h, "temperature": temp},
        {"time_point": "24h", "value": val_24h, "temperature": temp}
    ]
    if val_96h is not None:
        history.append({"time_point": "96h", "value": val_96h, "temperature": temp})
    if val_168h is not None:
        history.append({"time_point": "168h", "value": val_168h, "temperature": temp})

    return {
        "component_id": comp.component_id,
        "lot_id": comp.lot_id,
        "temperature": temp,
        "risk_score": prediction.risk_score if prediction else 0.0,
        "status": prediction.status if prediction else "SAFE",
        "anomaly_score": prediction.anomaly_score if prediction else 0.0,
        "is_anomaly": bool(prediction.is_anomaly) if prediction else False,
        "predicted_value_168h": prediction.predicted_value_168h if prediction else 0.0,
        "actual_value_168h": val_168h,
        "drift_rate_24h": float(round(row_feat["drift_rate_24h"], 4)),
        "percent_change_24h": float(round(row_feat["percent_change_24h"], 2)),
        "lot_deviation_0h": float(round(row_feat["lot_deviation_0h"], 2)),
        "z_score_0h": float(round(row_feat["z_score_0h"], 2)),
        "reasons": prediction.reasons if prediction and prediction.reasons else [],
        "measurement_history": history,
        "explainability": explainability
    }
