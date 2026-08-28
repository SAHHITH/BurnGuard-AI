from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.connection import get_db
from app.schemas.schemas import DashboardSummaryResponse
from app.services.risk_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary_kpis(db: Session = Depends(get_db)):
    """
    Returns executive dashboard summary analytics, risk breakdown, lot distributions,
    model performance metrics, and recent high-risk alerts.
    """
    summary = get_dashboard_summary(db)
    return summary
