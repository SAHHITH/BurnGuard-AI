from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SinglePredictionRequest(BaseModel):
    component_id: str = Field(..., example="NEW_C001")
    lot_id: str = Field(..., example="LOT_01")
    value_0h: float = Field(..., ge=0.0, example=10.2)
    value_24h: float = Field(..., ge=0.0, example=18.5)
    temperature: float = Field(default=125.0, ge=-40.0, le=300.0, example=125.0)

class SinglePredictionResponse(BaseModel):
    component_id: str
    lot_id: str
    anomaly_score: float
    is_anomaly: bool
    predicted_value_168h: float
    risk_score: float
    status: str
    reasons: List[str]

class MeasurementSchema(BaseModel):
    time_point: str
    value: float
    temperature: float

class ComponentSummary(BaseModel):
    component_id: str
    lot_id: str
    value_0h: float
    value_24h: float
    predicted_value_168h: float
    actual_value_168h: Optional[float] = None
    risk_score: float
    status: str
    is_anomaly: bool

class ComponentDetailResponse(BaseModel):
    component_id: str
    lot_id: str
    temperature: float
    risk_score: float
    status: str
    anomaly_score: float
    is_anomaly: bool
    predicted_value_168h: float
    actual_value_168h: Optional[float] = None
    drift_rate_24h: float
    percent_change_24h: float
    lot_deviation_0h: float
    z_score_0h: float
    reasons: List[str]
    measurement_history: List[MeasurementSchema]
    explainability: Dict[str, Any]

class ComponentPaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ComponentSummary]

class DashboardSummaryResponse(BaseModel):
    total_components: int
    safe_components: int
    monitor_components: int
    high_risk_components: int
    anomalies_detected: int
    avg_predicted_168h: float
    model_mae: float
    risk_distribution: Dict[str, int]
    components_by_lot: Dict[str, int]
    recent_high_risk: List[ComponentSummary]

class ModelMetricsResponse(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2: float
    training_date: str
    model_version: str
    anomaly_report: Dict[str, Any]
    feature_importances: Dict[str, float]
