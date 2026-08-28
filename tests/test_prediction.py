import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.prediction_service import prediction_manager

def test_single_component_prediction():
    res = prediction_manager.predict_single(
        comp_id="TEST_C001",
        lot_id="LOT_01",
        val_0h=10.0,
        val_24h=14.5,
        temp=125.0
    )
    
    assert res["component_id"] == "TEST_C001"
    assert "anomaly_score" in res
    assert "predicted_value_168h" in res
    assert "risk_score" in res
    assert res["status"] in ["SAFE", "MONITOR", "HIGH_RISK"]
    assert isinstance(res["reasons"], list)
