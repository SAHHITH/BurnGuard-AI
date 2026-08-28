from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.database.connection import get_db
from app.schemas.schemas import ComponentPaginatedResponse, ComponentDetailResponse
from app.services.data_service import get_components_paginated
from app.services.risk_service import get_component_details

router = APIRouter(prefix="/components", tags=["Components Telemetry"])

@router.get("", response_model=ComponentPaginatedResponse)
def list_components(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    lot_id: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("risk_score", pattern="^(risk_score|component_id|predicted_value_168h)$"),
    sort_desc: bool = True,
    db: Session = Depends(get_db)
):
    """
    Returns paginated list of electronic components with search, filtering, and sorting parameters.
    """
    res = get_components_paginated(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        lot_id=lot_id,
        status=status,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    return res


@router.get("/{component_id}", response_model=ComponentDetailResponse)
def get_single_component_detail(component_id: str, db: Session = Depends(get_db)):
    """
    Returns comprehensive component details including historical telemetry, anomaly score,
    predicted 168h value, hybrid risk score, XAI explanations, and status classification.
    """
    try:
        details = get_component_details(db, component_id)
        return details
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving component details: {str(e)}")
