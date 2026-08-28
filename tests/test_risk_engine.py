import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.risk_engine import HybridRiskEngine

def test_risk_score_boundaries():
    engine = HybridRiskEngine()
    
    # Test low-risk component
    safe_res = engine.calculate_component_risk(
        value_0h=10.0,
        value_24h=10.2,
        predicted_168h=10.8,
        anomaly_score=0.1,
        z_score_0h=0.2,
        drift_rate_24h=0.008,
        percent_change_24h=2.0,
        lot_mean_0h=10.0
    )
    
    assert 0.0 <= safe_res["risk_score"] <= 100.0
    assert safe_res["status"] == "SAFE"
    
    # Test high-risk component
    high_risk_res = engine.calculate_component_risk(
        value_0h=10.0,
        value_24h=25.0,
        predicted_168h=65.0,
        anomaly_score=0.92,
        z_score_0h=3.5,
        drift_rate_24h=0.625,
        percent_change_24h=150.0,
        lot_mean_0h=10.0
    )
    
    assert 0.0 <= high_risk_res["risk_score"] <= 100.0
    assert high_risk_res["status"] == "HIGH_RISK"
    assert len(high_risk_res["reasons"]) > 0
