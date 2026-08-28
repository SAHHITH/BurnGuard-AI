import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

# Default Configurable Weights
DEFAULT_WEIGHTS = {
    "anomaly_weight": 0.40,
    "early_drift_weight": 0.25,
    "predicted_risk_weight": 0.25,
    "lot_deviation_weight": 0.10
}

# Status Thresholds
SAFE_UPPER_LIMIT = 30.0
MONITOR_UPPER_LIMIT = 60.0

class HybridRiskEngine:
    """
    Combines Anomaly Scores, Early Drift Severity, Predicted 168h Risk, and Lot Deviation
    into a unified 0-100 Hybrid Risk Score, classifying components into SAFE, MONITOR, or HIGH_RISK,
    and generating deterministic rule-based explainability strings.
    """
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or DEFAULT_WEIGHTS.copy()
        
    def calculate_component_risk(
        self,
        value_0h: float,
        value_24h: float,
        predicted_168h: float,
        anomaly_score: float,
        z_score_0h: float,
        drift_rate_24h: float,
        percent_change_24h: float,
        lot_mean_0h: float
    ) -> Dict[str, Any]:
        """
        Calculates hybrid risk score for a single component.
        """
        # 1. Anomaly Component (0 - 40 pts)
        anomaly_contrib = anomaly_score * 100.0 * self.weights["anomaly_weight"]

        # 2. Early Drift Severity Component (0 - 25 pts)
        # Higher drift rates or high % changes produce higher severity
        drift_severity = min(1.0, max(0.0, (abs(drift_rate_24h) / 0.5) * 0.5 + (abs(percent_change_24h) / 100.0) * 0.5))
        early_drift_contrib = drift_severity * 100.0 * self.weights["early_drift_weight"]

        # 3. Predicted 168h Risk Component (0 - 25 pts)
        # Ratio of predicted 168h value to baseline 0h value
        predict_ratio = (predicted_168h - value_0h) / (value_0h + 1e-6)
        pred_risk_severity = min(1.0, max(0.0, predict_ratio / 1.5))
        predicted_risk_contrib = pred_risk_severity * 100.0 * self.weights["predicted_risk_weight"]

        # 4. Lot Deviation Component (0 - 10 pts)
        # Based on z-score magnitude
        z_severity = min(1.0, max(0.0, abs(z_score_0h) / 3.0))
        lot_deviation_contrib = z_severity * 100.0 * self.weights["lot_deviation_weight"]

        # Total Raw Score (0 - 100)
        raw_risk_score = anomaly_contrib + early_drift_contrib + predicted_risk_contrib + lot_deviation_contrib
        risk_score = float(round(min(100.0, max(0.0, raw_risk_score)), 1))

        # Classification
        if risk_score <= SAFE_UPPER_LIMIT:
            status = "SAFE"
        elif risk_score <= MONITOR_UPPER_LIMIT:
            status = "MONITOR"
        else:
            status = "HIGH_RISK"

        # Generate Human-Readable Explanations
        reasons = []
        if anomaly_score > 0.6:
            reasons.append(f"Statistically abnormal multi-parameter pattern detected (Anomaly Score: {round(anomaly_score, 2)})")
        if abs(drift_rate_24h) > 0.25:
            reasons.append(f"Rapid early drift detected ({round(drift_rate_24h*24, 2)} µA parameter shift in first 24h)")
        if abs(percent_change_24h) > 40.0:
            reasons.append(f"Significant parameter escalation (+{round(percent_change_24h, 1)}% from 0h baseline)")
        if abs(z_score_0h) > 2.0:
            reasons.append(f"Large baseline deviation from lot average ({round(z_score_0h, 2)} σ from lot mean)")
        if predicted_168h > (value_0h * 1.8):
            reasons.append(f"Predicted 168h value ({predicted_168h} µA) severely exceeds safety growth threshold")

        if not reasons:
            reasons.append("Component operating within normal statistical lot distribution and low drift parameters.")

        return {
            "risk_score": risk_score,
            "status": status,
            "components": {
                "anomaly_contribution": round(anomaly_contrib, 2),
                "early_drift_contribution": round(early_drift_contrib, 2),
                "predicted_risk_contribution": round(predicted_risk_contrib, 2),
                "lot_deviation_contribution": round(lot_deviation_contrib, 2)
            },
            "reasons": reasons
        }

    def evaluate_dataframe(self, df_feat: pd.DataFrame, anomaly_scores: np.ndarray, predicted_168h: np.ndarray) -> pd.DataFrame:
        """
        Applies risk calculation across a pandas DataFrame of featured components.
        """
        risk_scores = []
        statuses = []
        reasons_list = []

        for i, row in df_feat.reset_index(drop=True).iterrows():
            res = self.calculate_component_risk(
                value_0h=float(row["value_0h"]),
                value_24h=float(row["value_24h"]),
                predicted_168h=float(predicted_168h[i]),
                anomaly_score=float(anomaly_scores[i]),
                z_score_0h=float(row["z_score_0h"]),
                drift_rate_24h=float(row["drift_rate_24h"]),
                percent_change_24h=float(row["percent_change_24h"]),
                lot_mean_0h=float(row["lot_mean_0h"])
            )
            risk_scores.append(res["risk_score"])
            statuses.append(res["status"])
            reasons_list.append(res["reasons"])

        result_df = df_feat.copy()
        result_df["risk_score"] = risk_scores
        result_df["status"] = statuses
        result_df["reasons"] = reasons_list
        return result_df
