import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

REGRESSION_FEATURES = [
    "value_0h",
    "value_24h",
    "temperature",
    "drift_24h",
    "drift_rate_24h",
    "percent_change_24h",
    "lot_mean_0h",
    "lot_std_0h",
    "lot_deviation_0h",
    "z_score_0h",
    "value_ratio_24h_0h",
    "temp_normalized_drift"
]

TARGET = "value_168h"

class DriftPredictor:
    """
    Early Drift Prediction model wrapper.
    Trains and compares LinearRegression, RandomForestRegressor, and GradientBoostingRegressor
    to forecast 168h component values using early 0h-24h data. Selects the model with minimum MAE.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = None
        self.best_model_name = ""
        self.metrics = {}
        self.feature_names = REGRESSION_FEATURES
        self.is_fitted = False

    def train_and_evaluate(self, df_features: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains Linear Regression, Random Forest, and Gradient Boosting models.
        Evaluates on test split, selects best model based on MAE, and returns evaluation summary.
        """
        if TARGET not in df_features.columns:
            raise ValueError(f"Target column '{TARGET}' missing from training dataframe.")

        X = df_features[self.feature_names].values
        y = df_features[TARGET].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        candidate_models = {
            "LinearRegression": LinearRegression(),
            "RandomForestRegressor": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
            "GradientBoostingRegressor": GradientBoostingRegressor(n_estimators=100, random_state=42)
        }

        results = {}
        best_mae = float("inf")
        best_model = None
        best_name = ""

        for name, mdl in candidate_models.items():
            mdl.fit(X_train_scaled, y_train)
            y_pred = mdl.predict(X_test_scaled)

            mae = float(mean_absolute_error(y_test, y_pred))
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            r2 = float(r2_score(y_test, y_pred))

            results[name] = {
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "r2": round(r2, 4)
            }

            if mae < best_mae:
                best_mae = mae
                best_model = mdl
                best_name = name

        self.model = best_model
        self.best_model_name = best_name
        self.metrics = results[best_name]
        self.is_fitted = True

        evaluation_report = {
            "selected_model": best_name,
            "best_metrics": self.metrics,
            "all_models_comparison": results,
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        }

        return evaluation_report

    def predict(self, df_features: pd.DataFrame) -> np.ndarray:
        """
        Predicts 168h values for input features.
        """
        if not self.is_fitted:
            raise RuntimeError("DriftPredictor is not trained yet.")

        X = df_features[self.feature_names].values
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        # Ensure predicted value is non-negative and realistic relative to value_24h
        predictions = np.maximum(df_features["value_24h"].values * 0.8, predictions)
        return np.round(predictions, 2)

    def get_feature_importances(self) -> Dict[str, float]:
        """
        Returns feature importances if supported by the fitted model.
        """
        if not self.is_fitted or self.model is None:
            return {}
            
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            return {name: float(round(imp, 4)) for name, imp in zip(self.feature_names, importances)}
        elif hasattr(self.model, "coef_"):
            coefs = np.abs(self.model.coef_)
            total = sum(coefs) + 1e-6
            return {name: float(round(c / total, 4)) for name, c in zip(self.feature_names, coefs)}
        return {}

    def save(self, filepath: str):
        joblib.dump({
            "scaler": self.scaler,
            "model": self.model,
            "best_model_name": self.best_model_name,
            "metrics": self.metrics,
            "feature_names": self.feature_names,
            "is_fitted": self.is_fitted
        }, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.scaler = data["scaler"]
        self.model = data["model"]
        self.best_model_name = data["best_model_name"]
        self.metrics = data["metrics"]
        self.feature_names = data["feature_names"]
        self.is_fitted = data["is_fitted"]
