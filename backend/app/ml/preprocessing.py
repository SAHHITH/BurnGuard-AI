import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List

REQUIRED_COLUMNS = [
    "component_id", "lot_id", "value_0h", "value_24h", "temperature"
]

OPTIONAL_COLUMNS = ["value_96h", "value_168h", "ground_truth_status"]

def validate_dataframe(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validates that incoming DataFrame has all required columns and valid numeric ranges.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {', '.join(missing_cols)}")
        return False, errors
        
    if df.empty:
        errors.append("Uploaded dataset is empty.")
        return False, errors

    # Check for invalid non-numeric types in values
    num_cols = ["value_0h", "value_24h", "temperature"]
    for col in num_cols:
        if not pd.api.types.is_numeric_dtype(df[col]):
            try:
                pd.to_numeric(df[col])
            except Exception:
                errors.append(f"Column '{col}' contains non-numeric data that cannot be parsed.")
                
    # Check for negative values in parameters (leakage current / resistance / voltage measurement should be >= 0)
    for col in ["value_0h", "value_24h"]:
        if col in df.columns:
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                errors.append(f"Found {neg_count} invalid negative measurement values in column '{col}'.")
                
    return len(errors) == 0, errors


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and prepares raw component burn-in dataframe.
    - Standardizes data types
    - Removes duplicates based on component_id
    - Imputes or fixes invalid negative/missing values
    """
    cleaned_df = df.copy()
    
    # 1. Deduplicate by component_id if present
    if "component_id" in cleaned_df.columns:
        cleaned_df = cleaned_df.drop_duplicates(subset=["component_id"], keep="first")
        
    # 2. Ensure numeric types
    for col in ["value_0h", "value_24h", "value_96h", "value_168h", "temperature"]:
        if col in cleaned_df.columns:
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
            
    # 3. Handle missing values
    # For value_0h and value_24h, fill missing with median of respective lot if available, else global median
    for col in ["value_0h", "value_24h"]:
        if col in cleaned_df.columns and cleaned_df[col].isnull().any():
            if "lot_id" in cleaned_df.columns:
                cleaned_df[col] = cleaned_df.groupby("lot_id")[col].transform(lambda x: x.fillna(x.median()))
            cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].median())

    # Replace negative values with small positive epsilon
    for col in ["value_0h", "value_24h"]:
        if col in cleaned_df.columns:
            cleaned_df[col] = cleaned_df[col].apply(lambda x: max(0.01, float(x)) if pd.notnull(x) else 0.01)
            
    # Fill temperature default if missing
    if "temperature" in cleaned_df.columns:
        cleaned_df["temperature"] = cleaned_df["temperature"].fillna(125.0)

    return cleaned_df
