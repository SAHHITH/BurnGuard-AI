import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_components" in data
    assert "risk_distribution" in data

def test_predict_endpoint():
    payload = {
        "component_id": "API_TEST_001",
        "lot_id": "LOT_01",
        "value_0h": 10.2,
        "value_24h": 18.5,
        "temperature": 125.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["component_id"] == "API_TEST_001"
    assert data["status"] in ["SAFE", "MONITOR", "HIGH_RISK"]

def test_model_metrics():
    response = client.get("/api/models/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "mae" in data
    assert "model_name" in data
