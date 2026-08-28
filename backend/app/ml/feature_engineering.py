import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List

FEATURE_COLUMNS = [
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
    "lot_deviation_24h",
    "z_score_24h",
    "value_ratio_24h_0h",
    "deviation_percent_lot_0h",
    "temp_normalized_drift",
    "lot_rank_0h"
]

def calculate_features(df: pd.DataFrame, lot_stats: dict = None) -> Tuple[pd.DataFrame, dict]:
    """
    Computes domain-specific feature engineering matrix for anomaly detection & drift prediction.
    
    If lot_stats dictionary is provided, it uses existing reference lot distributions (useful for inference).
    Otherwise, computes lot statistics directly from df (useful for training).
    
    Returns (featured_df, updated_lot_stats).
    """
    df_feat = df.copy()
    
    # 1. Early Drift features
    df_feat["drift_24h"] = df_feat["value_24h"] - df_feat["value_0h"]
    df_feat["drift_rate_24h"] = df_feat["drift_24h"] / 24.0
    
    # Safe percent change calculation
    df_feat["percent_change_24h"] = np.where(
        df_feat["value_0h"] > 1e-6,
        ((df_feat["value_24h"] - df_feat["value_0h"]) / df_feat["value_0h"]) * 100.0,
        0.0
    )
    
    df_feat["value_ratio_24h_0h"] = np.where(
        df_feat["value_0h"] > 1e-6,
        df_feat["value_24h"] / df_feat["value_0h"],
        1.0
    )
    
    # Temperature normalized drift
    temp_factor = np.maximum(df_feat["temperature"] / 100.0, 0.5)
    df_feat["temp_normalized_drift"] = df_feat["drift_24h"] / temp_factor
    
    # 2. Lot Statistical Features
    if lot_stats is None:
        lot_stats = {}
        grouped = df_feat.groupby("lot_id")
        for lot_id, group in grouped:
            lot_stats[str(lot_id)] = {
                "mean_0h": float(group["value_0h"].mean()),
                "std_0h": float(group["value_0h"].std()) if len(group) > 1 and group["value_0h"].std() > 1e-6 else 1.0,
                "mean_24h": float(group["value_24h"].mean()),
                "std_24h": float(group["value_24h"].std()) if len(group) > 1 and group["value_24h"].std() > 1e-6 else 1.0,
            }

    # Global defaults for fallback if a new unseen lot appears
    global_mean_0h = float(df_feat["value_0h"].mean())
    global_std_0h = float(df_feat["value_0h"].std()) if float(df_feat["value_0h"].std()) > 1e-6 else 1.0
    global_mean_24h = float(df_feat["value_24h"].mean())
    global_std_24h = float(df_feat["value_24h"].std()) if float(df_feat["value_24h"].std()) > 1e-6 else 1.0

    # Map lot stats
    def get_lot_stat(lot_id, stat_key, fallback):
        lot_str = str(lot_id)
        if lot_str in lot_stats:
            return lot_stats[lot_str].get(stat_key, fallback)
        return fallback

    df_feat["lot_mean_0h"] = df_feat["lot_id"].apply(lambda l: get_lot_stat(l, "mean_0h", global_mean_0h))
    df_feat["lot_std_0h"] = df_feat["lot_id"].apply(lambda l: get_lot_stat(l, "std_0h", global_std_0h))
    df_feat["lot_mean_24h"] = df_feat["lot_id"].apply(lambda l: get_lot_stat(l, "mean_24h", global_mean_24h))
    df_feat["lot_std_24h"] = df_feat["lot_id"].apply(lambda l: get_lot_stat(l, "std_24h", global_std_24h))

    # Lot Deviations and Z-scores
    df_feat["lot_deviation_0h"] = df_feat["value_0h"] - df_feat["lot_mean_0h"]
    df_feat["z_score_0h"] = df_feat["lot_deviation_0h"] / df_feat["lot_std_0h"].replace(0, 1.0)

    df_feat["lot_deviation_24h"] = df_feat["value_24h"] - df_feat["lot_mean_24h"]
    df_feat["z_score_24h"] = df_feat["lot_deviation_24h"] / df_feat["lot_std_24h"].replace(0, 1.0)

    df_feat["deviation_percent_lot_0h"] = np.where(
        df_feat["lot_mean_0h"] > 1e-6,
        (df_feat["lot_deviation_0h"] / df_feat["lot_mean_0h"]) * 100.0,
        0.0
    )

    # Rank percentile within lot
    if "lot_id" in df_feat.columns and len(df_feat) > 1:
        df_feat["lot_rank_0h"] = df_feat.groupby("lot_id")["value_0h"].rank(pct=True)
    else:
        df_feat["lot_rank_0h"] = 0.5

    # Replace any potential infs or NaNs with 0
    df_feat[FEATURE_COLUMNS] = df_feat[FEATURE_COLUMNS].fillna(0.0).replace([np.inf, -np.inf], 0.0)

    return df_feat, lot_stats
