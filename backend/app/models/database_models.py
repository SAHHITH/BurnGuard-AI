from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.connection import Base

class LotModel(Base):
    __tablename__ = "lots"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    components = relationship("ComponentModel", back_populates="lot", cascade="all, delete-orphan")


class ComponentModel(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(String, unique=True, index=True, nullable=False)
    lot_id = Column(String, ForeignKey("lots.lot_id"), nullable=False, index=True)
    ground_truth_status = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lot = relationship("LotModel", back_populates="components")
    measurements = relationship("MeasurementModel", back_populates="component", cascade="all, delete-orphan")
    prediction = relationship("PredictionModel", back_populates="component", uselist=False, cascade="all, delete-orphan")


class MeasurementModel(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(String, ForeignKey("components.component_id"), nullable=False, index=True)
    time_point = Column(String, nullable=False) # '0h', '24h', '96h', '168h'
    parameter_name = Column(String, default="leakage_current_uA")
    value = Column(Float, nullable=False)
    temperature = Column(Float, default=125.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    component = relationship("ComponentModel", back_populates="measurements")


class PredictionModel(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(String, ForeignKey("components.component_id"), unique=True, nullable=False, index=True)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Integer, default=0) # 0 = False, 1 = True
    predicted_value_168h = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    status = Column(String, nullable=False) # 'SAFE', 'MONITOR', 'HIGH_RISK'
    reasons = Column(JSON, nullable=True) # List of human readable explanations
    model_version = Column(String, default="1.0.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    component = relationship("ComponentModel", back_populates="prediction")
