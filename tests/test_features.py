import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pandas as pd
import numpy as np
from app.ml.feature_engineering import calculate_features

def test_feature_calculation_columns():
    df = pd.DataFrame([{
        "component_id": "C001",
        "lot_id": "LOT01",
        "value_0h": 10.0,
        "value_24h": 12.4,
        "temperature": 125.0
    }])
    
    feat_df, lot_stats = calculate_features(df)
    
    assert "drift_24h" in feat_df.columns
    assert "drift_rate_24h" in feat_df.columns
    assert "percent_change_24h" in feat_df.columns
    assert "lot_deviation_0h" in feat_df.columns
    assert "z_score_0h" in feat_df.columns
    
    assert abs(feat_df["drift_24h"].iloc[0] - 2.4) < 1e-4
    assert abs(feat_df["drift_rate_24h"].iloc[0] - 0.1) < 1e-4
    assert abs(feat_df["percent_change_24h"].iloc[0] - 24.0) < 1e-4

def test_division_by_zero_safety():
    df = pd.DataFrame([{
        "component_id": "C002",
        "lot_id": "LOT01",
        "value_0h": 0.0,
        "value_24h": 5.0,
        "temperature": 125.0
    }])
    
    feat_df, _ = calculate_features(df)
    assert not np.isinf(feat_df["percent_change_24h"].iloc[0])
    assert not np.isnan(feat_df["percent_change_24h"].iloc[0])
