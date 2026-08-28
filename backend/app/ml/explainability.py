import numpy as np
import pandas as pd
from typing import Dict, Any, List
import shap
from app.ml.drift_prediction import REGRESSION_FEATURES

class ModelExplainer:
    """
    SHAP-based Explainable AI module for interpreting drift predictions and feature impacts.
    """
    def __init__(self, model: Any, scaler: Any, feature_names: List[str] = None):
        self.model = model
        self.scaler = scaler
        self.feature_names = feature_names or REGRESSION_FEATURES
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        if self.model is None:
            return
            
        try:
            # TreeExplainer for Random Forest or Gradient Boosting
            if hasattr(self.model, "estimators_") or hasattr(self.model, "tree_"):
                self.explainer = shap.TreeExplainer(self.model)
            else:
                # Kernel / Linear explainer fallback
                dummy_background = np.zeros((10, len(self.feature_names)))
                self.explainer = shap.LinearExplainer(self.model, dummy_background)
        except Exception:
            self.explainer = None

    def explain_sample(self, feature_row: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates feature attribution values for a single component sample.
        """
        X_sample = feature_row[self.feature_names].values
        X_scaled = self.scaler.transform(X_sample)

        feature_contributions = {}
        
        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(X_scaled)
                if isinstance(shap_values, list):
                    shap_values = shap_values[0]
                if len(shap_values.shape) > 1:
                    shap_values = shap_values[0]

                for feat_name, val, shap_val in zip(self.feature_names, X_sample[0], shap_values):
                    feature_contributions[feat_name] = {
                        "feature_value": float(round(val, 4)),
                        "shap_contribution": float(round(shap_val, 4))
                    }
                return {
                    "explainability_type": "SHAP",
                    "contributions": feature_contributions
                }
            except Exception:
                pass

        # Fallback to feature importance / relative weight calculation if SHAP calculation fails or is unsupported
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            for feat_name, val, imp in zip(self.feature_names, X_sample[0], importances):
                feature_contributions[feat_name] = {
                    "feature_value": float(round(val, 4)),
                    "shap_contribution": float(round(imp * val * 0.1, 4))
                }
        else:
            for feat_name, val in zip(self.feature_names, X_sample[0]):
                feature_contributions[feat_name] = {
                    "feature_value": float(round(val, 4)),
                    "shap_contribution": 0.0
                }

        return {
            "explainability_type": "FeatureImportanceFallback",
            "contributions": feature_contributions
        }
