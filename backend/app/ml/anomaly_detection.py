import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import joblib

ANOMALY_FEATURES = [
    "value_0h",
    "value_24h",
    "drift_24h",
    "drift_rate_24h",
    "percent_change_24h",
    "lot_deviation_0h",
    "z_score_0h",
    "temperature"
]

class AnomalyDetector:
    """
    Dynamic Anomaly Detection pipeline wrapper.
    Supports Isolation Forest as default production model, along with LOF and One-Class SVM.
    """
    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1
        )
        self.is_fitted = False
        self.feature_names = ANOMALY_FEATURES

    def train_and_compare(self, df_features: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains IsolationForest, LOF, and OneClassSVM on the feature set and produces a comparison report.
        Maintains IsolationForest as the production model.
        """
        X = df_features[self.feature_names].values
        X_scaled = self.scaler.fit_transform(X)
        
        # 1. Isolation Forest
        iso_forest = IsolationForest(n_estimators=100, contamination=self.contamination, random_state=42, n_jobs=-1)
        iso_forest.fit(X_scaled)
        iso_raw_scores = iso_forest.score_samples(X_scaled)
        # Normalize score to 0..1 (higher = more anomalous)
        iso_anomaly_scores = (iso_raw_scores.max() - iso_raw_scores) / (iso_raw_scores.max() - iso_raw_scores.min() + 1e-6)
        iso_preds = iso_forest.predict(X_scaled) # -1 anomaly, 1 normal
        iso_anomalies_count = int((iso_preds == -1).sum())

        # 2. Local Outlier Factor (Novelty detection mode)
        lof = LocalOutlierFactor(n_neighbors=20, contamination=self.contamination, novelty=True)
        lof.fit(X_scaled)
        lof_raw_scores = lof.score_samples(X_scaled)
        lof_anomaly_scores = (lof_raw_scores.max() - lof_raw_scores) / (lof_raw_scores.max() - lof_raw_scores.min() + 1e-6)
        lof_preds = lof.predict(X_scaled)
        lof_anomalies_count = int((lof_preds == -1).sum())

        # 3. One-Class SVM
        oc_svm = OneClassSVM(nu=self.contamination, kernel="rbf", gamma="scale")
        oc_svm.fit(X_scaled)
        svm_raw_scores = oc_svm.score_samples(X_scaled)
        svm_anomaly_scores = (svm_raw_scores.max() - svm_raw_scores) / (svm_raw_scores.max() - svm_raw_scores.min() + 1e-6)
        svm_preds = oc_svm.predict(X_scaled)
        svm_anomalies_count = int((svm_preds == -1).sum())

        # Set production model to Isolation Forest
        self.model = iso_forest
        self.is_fitted = True

        comparison_report = {
            "dataset_size": len(df_features),
            "contamination_target": self.contamination,
            "models": {
                "IsolationForest": {
                    "anomalies_detected": iso_anomalies_count,
                    "anomaly_rate": round(iso_anomalies_count / len(df_features), 4),
                    "mean_anomaly_score": float(np.mean(iso_anomaly_scores)),
                    "is_selected_production": True
                },
                "LocalOutlierFactor": {
                    "anomalies_detected": lof_anomalies_count,
                    "anomaly_rate": round(lof_anomalies_count / len(df_features), 4),
                    "mean_anomaly_score": float(np.mean(lof_anomaly_scores)),
                    "is_selected_production": False
                },
                "OneClassSVM": {
                    "anomalies_detected": svm_anomalies_count,
                    "anomaly_rate": round(svm_anomalies_count / len(df_features), 4),
                    "mean_anomaly_score": float(np.mean(svm_anomaly_scores)),
                    "is_selected_production": False
                }
            }
        }

        return comparison_report

    def predict(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predicts anomaly status and normalized anomaly scores for given feature dataframe.
        Returns (is_anomaly_array (bool), anomaly_score_array (float 0..1)).
        """
        if not self.is_fitted:
            raise RuntimeError("AnomalyDetector must be trained before calling predict().")
            
        X = df_features[self.feature_names].values
        X_scaled = self.scaler.transform(X)
        
        # Decision function: lower values mean more abnormal
        raw_scores = self.model.score_samples(X_scaled)
        
        # Mapping raw scores (which typically range between -0.8 and 0.2) to normalized 0..1 scale
        # Score threshold centered around -0.15 for isolation forest decision
        normalized_scores = 1.0 / (1.0 + np.exp(8.0 * (raw_scores + 0.12)))
        normalized_scores = np.clip(normalized_scores, 0.0, 1.0)
        
        preds = self.model.predict(X_scaled)
        is_anomaly = (preds == -1) | (normalized_scores > 0.55)

        return is_anomaly, np.round(normalized_scores, 4)

    def save(self, filepath: str):
        joblib.dump({"scaler": self.scaler, "model": self.model, "is_fitted": self.is_fitted, "feature_names": self.feature_names}, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.scaler = data["scaler"]
        self.model = data["model"]
        self.is_fitted = data["is_fitted"]
        self.feature_names = data["feature_names"]
