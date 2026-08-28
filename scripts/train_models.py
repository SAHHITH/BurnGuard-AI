import os
import json
import joblib
import pandas as pd

import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.preprocessing import validate_dataframe, preprocess_data
from app.ml.feature_engineering import calculate_features
from app.ml.anomaly_detection import AnomalyDetector
from app.ml.drift_prediction import DriftPredictor

def run_training_pipeline(
    raw_data_path: str = "data/raw/burnin_dataset.csv",
    output_dir: str = "models"
):
    """
    Executes full ML training pipeline, trains Anomaly Detection and Drift Prediction models,
    evaluates candidates, and saves trained artifacts and performance metrics.
    """
    print("=" * 60)
    print("BurnGuard AI - Machine Learning Training Pipeline")
    print("=" * 60)

    # 1. Load raw data
    if not os.path.exists(raw_data_path):
        raise FileNotFoundError(f"Raw dataset not found at '{raw_data_path}'. Run dataset generator first.")

    raw_df = pd.read_csv(raw_data_path)
    print(f"Loaded raw dataset with {len(raw_df)} rows.")

    # 2. Validate dataset
    is_valid, errors = validate_dataframe(raw_df)
    if not is_valid:
        raise ValueError(f"Dataset validation failed: {errors}")
    print("[OK] Dataset validation passed successfully.")

    # 3. Data Preprocessing
    clean_df = preprocess_data(raw_df)
    print(f"[OK] Data preprocessing complete. {len(clean_df)} cleaned records.")

    # 4. Feature Engineering
    feat_df, lot_stats = calculate_features(clean_df)
    print(f"[OK] Feature engineering complete. Extracted {feat_df.shape[1]} total columns across {len(lot_stats)} lots.")

    # 5. Train & Compare Anomaly Detection
    print("\n--- Training Anomaly Detection Models ---")
    anomaly_detector = AnomalyDetector(contamination=0.08)
    anomaly_report = anomaly_detector.train_and_compare(feat_df)
    print(f"[OK] Anomaly Models Comparison:\n{json.dumps(anomaly_report, indent=2)}")

    # 6. Train & Compare Drift Regression Models
    print("\n--- Training 168h Drift Prediction Models ---")
    drift_predictor = DriftPredictor()
    drift_report = drift_predictor.train_and_evaluate(feat_df)
    print(f"[OK] Selected Drift Model: {drift_report['selected_model']}")
    print(f"[OK] Model Performance (Test Set):\n{json.dumps(drift_report['best_metrics'], indent=2)}")

    # 7. Save Model Artifacts
    os.makedirs(output_dir, exist_ok=True)
    
    anomaly_model_path = os.path.join(output_dir, "anomaly_model.joblib")
    drift_model_path = os.path.join(output_dir, "drift_model.joblib")
    preprocessing_path = os.path.join(output_dir, "preprocessing_pipeline.joblib")
    metrics_path = os.path.join(output_dir, "metrics.json")
    lot_stats_path = os.path.join(output_dir, "lot_stats.json")

    anomaly_detector.save(anomaly_model_path)
    drift_predictor.save(drift_model_path)
    joblib.dump({"lot_stats": lot_stats}, preprocessing_path)

    metrics_payload = {
        "anomaly_report": anomaly_report,
        "drift_report": drift_report,
        "selected_drift_model": drift_predictor.best_model_name,
        "mae": drift_predictor.metrics.get("mae"),
        "rmse": drift_predictor.metrics.get("rmse"),
        "r2": drift_predictor.metrics.get("r2"),
        "training_date": pd.Timestamp.now().isoformat(),
        "model_version": "1.0.0"
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(lot_stats_path, "w") as f:
        json.dump(lot_stats, f, indent=2)

    print(f"\n[OK] Saved model artifacts to '{output_dir}/':")
    print(f"  - {anomaly_model_path}")
    print(f"  - {drift_model_path}")
    print(f"  - {preprocessing_path}")
    print(f"  - {metrics_path}")
    print(f"  - {lot_stats_path}")
    print("=" * 60)
    print("Training Pipeline Execution Completed Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_training_pipeline()
