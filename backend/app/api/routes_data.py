import io
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.connection import get_db
from app.services.data_service import ingest_dataframe_to_db, generate_and_seed_demo_data

router = APIRouter(prefix="/data", tags=["Dataset Management"])

@router.post("/upload")
async def upload_csv_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Upload CSV dataset containing component burn-in measurements.
    Validates CSV structure, runs ML feature engineering & predictions, and stores in database.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    try:
        result = ingest_dataframe_to_db(db, df)
        return {
            "message": "Dataset uploaded and processed successfully.",
            "details": result
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting dataset: {str(e)}")


@router.post("/generate-demo")
async def generate_demo_dataset(num_components: int = 1500, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Generates synthetic burn-in screening dataset and populates PostgreSQL/SQLite database.
    """
    try:
        res = generate_and_seed_demo_data(db, num_components=num_components)
        return {
            "message": f"Successfully generated and processed {res['total_processed']} synthetic component records.",
            "details": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate demo dataset: {str(e)}")
