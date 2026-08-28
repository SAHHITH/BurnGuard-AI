import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

from app.config import settings
from app.ml.preprocessing import preprocess_data
from app.ml.feature_engineering import calculate_features
from app.ml.anomaly_detection import AnomalyDetector
from app.ml.drift_prediction import DriftPredictor
from app.ml.risk_engine import HybridRiskEngine
from app.ml.explainability import ModelExplainer

class ModelPipelineManager:
    """
    Singleton service manager for loading ML models, making predictions, and computing explanations.
    """
    def __init__(self):
        self.anomaly_detector = None
        self.drift_predictor = None
        self.explainer = None
        self.lot_stats = {}
        self.risk_engine = HybridRiskEngine()
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        anomaly_path = os.path.join(settings.MODEL_DIR, "anomaly_model.joblib")
        drift_path = os.path.join(settings.MODEL_DIR, "drift_model.joblib")
        prep_path = os.path.join(settings.MODEL_DIR, "preprocessing_pipeline.joblib")
        lot_stats_path = os.path.join(settings.MODEL_DIR, "lot_stats.json")

        if os.path.exists(anomaly_path) and os.path.exists(drift_path):
            try:
                self.anomaly_detector = AnomalyDetector()
                self.anomaly_detector.load(anomaly_path)

                self.drift_predictor = DriftPredictor()
                self.drift_predictor.load(drift_path)

                if os.path.exists(lot_stats_path):
                    with open(lot_stats_path, "r") as f:
                        self.lot_stats = json.load(f)

                self.explainer = ModelExplainer(
                    model=self.drift_predictor.model,
                    scaler=self.drift_predictor.scaler,
                    feature_names=self.drift_predictor.feature_names
                )
                self.is_loaded = True
                print("[OK] ML Models successfully loaded into memory.")
            except Exception as e:
                print(f"[WARNING] Error loading model artifacts: {e}")
                self.is_loaded = False
        else:
            print("[WARNING] Model artifacts not found. Pipeline will train or await initial dataset processing.")
            self.is_loaded = False

    def predict_single(self, comp_id: str, lot_id: str, val_0h: float, val_24h: float, temp: float) -> Dict[str, Any]:
        """
        Runs real-time prediction pipeline for a single component.
        """
        single_df = pd.DataFrame([{
            "component_id": comp_id,
            "lot_id": lot_id,
            "value_0h": val_0h,
            "value_24h": val_24h,
            "temperature": temp
        }])

        clean_df = preprocess_data(single_df)
        feat_df, _ = calculate_features(clean_df, lot_stats=self.lot_stats)

        # 1. Anomaly Detection
        if self.is_loaded and self.anomaly_detector:
            is_anomaly_arr, anomaly_score_arr = self.anomaly_detector.predict(feat_df)
            is_anomaly = bool(is_anomaly_arr[0])
            anomaly_score = float(anomaly_score_arr[0])
        else:
            # Fallback baseline check
            anomaly_score = 0.5 if abs(val_24h - val_0h) > 5.0 else 0.1
            is_anomaly = anomaly_score > 0.55

        # 2. 168h Drift Prediction
        if self.is_loaded and self.drift_predictor:
            pred_168h_arr = self.drift_predictor.predict(feat_df)
            predicted_168h = float(pred_168h_arr[0])
        else:
            # Fallback baseline prediction
            predicted_168h = float(round(val_24h + (val_24h - val_0h) * 6.0, 2))

        # 3. Hybrid Risk Engine
        row = feat_df.iloc[0]
        risk_res = self.risk_engine.calculate_component_risk(
            value_0h=val_0h,
            value_24h=val_24h,
            predicted_168h=predicted_168h,
            anomaly_score=anomaly_score,
            z_score_0h=float(row["z_score_0h"]),
            drift_rate_24h=float(row["drift_rate_24h"]),
            percent_change_24h=float(row["percent_change_24h"]),
            lot_mean_0h=float(row["lot_mean_0h"])
        )

        return {
            "component_id": comp_id,
            "lot_id": lot_id,
            "anomaly_score": round(anomaly_score, 4),
            "is_anomaly": is_anomaly,
            "predicted_value_168h": predicted_168h,
            "risk_score": risk_res["risk_score"],
            "status": risk_res["status"],
            "reasons": risk_res["reasons"]
        }

    def predict_batch_dataframe(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
        """
        Batch prediction pipeline for loaded/uploaded dataset DataFrames.
        """
        clean_df = preprocess_data(df)
        feat_df, updated_lot_stats = calculate_features(clean_df, lot_stats=self.lot_stats if self.lot_stats else None)

        if not self.lot_stats:
            self.lot_stats = updated_lot_stats

        # Anomaly Detection
        if self.is_loaded and self.anomaly_detector:
            is_anomaly_arr, anomaly_scores = self.anomaly_detector.predict(feat_df)
        else:
            # Simple heuristic score if models not saved
            drift_rate = (feat_df["value_24h"] - feat_df["value_0h"]) / 24.0
            anomaly_scores = np.clip(np.abs(drift_rate) / 0.5, 0.0, 1.0)
            is_anomaly_arr = anomaly_scores > 0.55

        # 168h Drift Prediction
        if self.is_loaded and self.drift_predictor:
            predicted_168h = self.drift_predictor.predict(feat_df)
        else:
            predicted_168h = (feat_df["value_24h"] + (feat_df["value_24h"] - feat_df["value_0h"]) * 6.0).values
            predicted_168h = np.round(np.maximum(feat_df["value_24h"].values, predicted_168h), 2)

        # Risk Engine
        evaluated_df = self.risk_engine.evaluate_dataframe(feat_df, anomaly_scores, predicted_168h)
        evaluated_df["is_anomaly"] = is_anomaly_arr
        evaluated_df["anomaly_score"] = anomaly_scores
        evaluated_df["predicted_value_168h"] = predicted_168h

        return evaluated_df, self.lot_stats

prediction_manager = ModelPipelineManager()
