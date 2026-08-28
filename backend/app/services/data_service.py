import os
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

import sys
from app.models.database_models import LotModel, ComponentModel, MeasurementModel, PredictionModel
from app.ml.preprocessing import validate_dataframe, preprocess_data
from app.services.prediction_service import prediction_manager

# Ensure root workspace directory is in sys.path for scripts import
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
from scripts.generate_dataset import generate_synthetic_burnin_data

def ingest_dataframe_to_db(db: Session, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Processes, calculates ML features/predictions, and ingests component records into PostgreSQL/SQLite DB.
    """
    is_valid, errors = validate_dataframe(df)
    if not is_valid:
        raise ValueError(f"Invalid dataset: {'; '.join(errors)}")

    # Preprocess & Predict
    evaluated_df, lot_stats = prediction_manager.predict_batch_dataframe(df)

    # 1. Ingest Lots
    unique_lots = evaluated_df["lot_id"].unique()
    for lot_id in unique_lots:
        existing_lot = db.query(LotModel).filter(LotModel.lot_id == str(lot_id)).first()
        if not existing_lot:
            lot_obj = LotModel(lot_id=str(lot_id), description=f"Burn-in Manufacturing Lot {lot_id}")
            db.add(lot_obj)
    db.commit()

    # 2. Ingest Components & Measurements & Predictions
    components_inserted = 0
    components_updated = 0

    for idx, row in evaluated_df.iterrows():
        comp_id = str(row["component_id"])
        lot_id = str(row["lot_id"])
        ground_truth = str(row.get("ground_truth_status", "UNKNOWN"))

        # Check existing component
        comp_obj = db.query(ComponentModel).filter(ComponentModel.component_id == comp_id).first()
        if not comp_obj:
            comp_obj = ComponentModel(
                component_id=comp_id,
                lot_id=lot_id,
                ground_truth_status=ground_truth
            )
            db.add(comp_obj)
            db.flush() # get ID
            components_inserted += 1
        else:
            comp_obj.lot_id = lot_id
            comp_obj.ground_truth_status = ground_truth
            components_updated += 1

        # Delete existing measurements & prediction for clean re-ingest
        db.query(MeasurementModel).filter(MeasurementModel.component_id == comp_id).delete()
        db.query(PredictionModel).filter(PredictionModel.component_id == comp_id).delete()

        # Add time-series measurements
        temp = float(row.get("temperature", 125.0))
        measurements_to_add = [
            MeasurementModel(component_id=comp_id, time_point="0h", value=float(row["value_0h"]), temperature=temp),
            MeasurementModel(component_id=comp_id, time_point="24h", value=float(row["value_24h"]), temperature=temp),
        ]
        if "value_96h" in row and pd.notnull(row["value_96h"]):
            measurements_to_add.append(MeasurementModel(component_id=comp_id, time_point="96h", value=float(row["value_96h"]), temperature=temp))
        if "value_168h" in row and pd.notnull(row["value_168h"]):
            measurements_to_add.append(MeasurementModel(component_id=comp_id, time_point="168h", value=float(row["value_168h"]), temperature=temp))

        db.add_all(measurements_to_add)

        # Add prediction record
        pred_obj = PredictionModel(
            component_id=comp_id,
            anomaly_score=float(row["anomaly_score"]),
            is_anomaly=1 if bool(row["is_anomaly"]) else 0,
            predicted_value_168h=float(row["predicted_value_168h"]),
            risk_score=float(row["risk_score"]),
            status=str(row["status"]),
            reasons=list(row["reasons"]),
            model_version="1.0.0"
        )
        db.add(pred_obj)

    db.commit()

    return {
        "status": "success",
        "inserted": components_inserted,
        "updated": components_updated,
        "total_processed": len(evaluated_df)
    }


def generate_and_seed_demo_data(db: Session, num_components: int = 1500) -> Dict[str, Any]:
    """
    Generates synthetic burn-in screening data and seeds database.
    """
    csv_path = "data/raw/burnin_dataset.csv"
    df = generate_synthetic_burnin_data(num_components=num_components, output_path=csv_path)
    res = ingest_dataframe_to_db(db, df)
    return res


def get_components_paginated(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    lot_id: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "risk_score",
    sort_desc: bool = True
) -> Dict[str, Any]:
    """
    Queries components table with search, lot filter, status filter, and pagination.
    """
    query = db.query(ComponentModel).join(PredictionModel, ComponentModel.component_id == PredictionModel.component_id)

    if search:
        query = query.filter(
            or_(
                ComponentModel.component_id.ilike(f"%{search}%"),
                ComponentModel.lot_id.ilike(f"%{search}%")
            )
        )
    if lot_id:
        query = query.filter(ComponentModel.lot_id == lot_id)
    if status:
        query = query.filter(PredictionModel.status == status.upper())

    total = query.count()

    # Sorting
    if sort_by == "risk_score":
        sort_col = PredictionModel.risk_score
    elif sort_by == "component_id":
        sort_col = ComponentModel.component_id
    elif sort_by == "predicted_value_168h":
        sort_col = PredictionModel.predicted_value_168h
    else:
        sort_col = PredictionModel.risk_score

    if sort_desc:
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(sort_col)

    offset = (page - 1) * page_size
    components = query.offset(offset).limit(page_size).all()

    items = []
    for c in components:
        m_0h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "0h").first()
        m_24h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "24h").first()
        m_168h = db.query(MeasurementModel).filter(MeasurementModel.component_id == c.component_id, MeasurementModel.time_point == "168h").first()

        items.append({
            "component_id": c.component_id,
            "lot_id": c.lot_id,
            "value_0h": m_0h.value if m_0h else 0.0,
            "value_24h": m_24h.value if m_24h else 0.0,
            "predicted_value_168h": c.prediction.predicted_value_168h if c.prediction else 0.0,
            "actual_value_168h": m_168h.value if m_168h else None,
            "risk_score": c.prediction.risk_score if c.prediction else 0.0,
            "status": c.prediction.status if c.prediction else "SAFE",
            "is_anomaly": bool(c.prediction.is_anomaly) if c.prediction else False
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items
    }
