# BurnGuard AI: AI-Driven Predictive Anomaly Detection for Electronic Component Burn-In Screening

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

**BurnGuard AI** is an enterprise-grade AI/ML software application engineered for high-reliability industries (aerospace, defense, automotive, medical devices) to screen electronic components during burn-in and environmental stress testing.

By replacing traditional static datasheet pass/fail thresholds (e.g., $I_{\text{leakage}} \le 50\,\mu\text{A}$) with dynamic Isolation Forest anomaly detection, 168-hour drift forecasting models, and a configurable Hybrid Risk Score Engine (0–100), BurnGuard AI identifies latent defects and out-of-family components before they reach critical field applications.

---

## 1. Problem Statement

Electronic components undergo burn-in stress screening to accelerate early-life failure mechanisms. Traditional screening relies on static upper/lower limits. 

**The Challenge:**
* A component with a leakage current of $45\,\mu\text{A}$ passes a static $50\,\mu\text{A}$ datasheet limit.
* However, if the manufacturing lot average is $10\,\mu\text{A}$ with a standard deviation ($\sigma$) of $1.2\,\mu\text{A}$, then $45\,\mu\text{A}$ ($+29.1\,\sigma$) represents an **abnormal out-of-family unit** containing latent defects.
* Early parameter degradation between 0h and 24h often predicts catastrophic failure at 168 hours.

---

## 2. Core System Architecture

```text
Component Telemetry (0h, 24h, Temp, Lot ID)
               │
               ▼
   Data Preprocessing & Validation
               │
               ▼
     Feature Engineering Matrix
  (Drift Rates, Lot Z-Scores, Ratios)
               │
      ┌────────┴────────┐
      ▼                 ▼
Isolation Forest    168h Drift Predictor
Anomaly Detector   (RandomForest / XGBoost)
      │                 │
      └────────┬────────┘
               ▼
     Hybrid Risk Score Engine (0–100)
    (40% Anomaly + 25% Drift + 25% Pred + 10% Lot)
               │
               ▼
  Classification: SAFE / MONITOR / HIGH_RISK
               │
               ▼
  Explainable AI (SHAP & Rule-Based Reasons)
               │
               ▼
 Fast-API Backend ──▶ React Enterprise Dashboard
```

---

## 3. Key Features

- **Synthetic Burn-In Data Generator:** Generates multi-lot semiconductor screening logs with normal thermal stabilization, slow drifters, rapid degradation, and baseline anomalies.
- **Dynamic Anomaly Detection:** Compares Isolation Forest against Local Outlier Factor (LOF) and One-Class SVM.
- **168h Failure Forecast:** Regression models (Linear, Random Forest, Gradient Boosting) predicting future degradation values using early 0h–24h telemetry.
- **Hybrid Risk Score (0–100):** Configurable weighted engine classifying units into `SAFE` (0–30), `MONITOR` (31–60), and `HIGH_RISK` (61–100).
- **Explainable AI (XAI):** SHAP feature contribution charts + human-readable diagnostic reasons for quality assurance engineers.
- **FastAPI REST Backend:** OpenAPI specification, PostgreSQL persistence, real-time single component prediction endpoint.
- **Modern Dark UI Dashboard:** Interactive React 19 + TypeScript + Recharts + Tailwind CSS frontend with search, lot filtering, line graph forecasts, and realtime inference sandbox.

---

## 4. Technology Stack

- **ML / Data Science:** Python 3.11+, Scikit-Learn, Pandas, NumPy, Joblib, SHAP
- **Backend:** FastAPI, Pydantic v2, SQLAlchemy, Uvicorn
- **Database:** PostgreSQL 15 (Docker) / SQLite (Local Fallback)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
- **DevOps & Testing:** Docker, Docker Compose, Pytest, Nginx

---

## 5. Getting Started

### Option A: Quick Local Run (Python + Node.js)

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-org/burnguard-ai.git
   cd burnguard-ai
   ```

2. **Backend Setup:**
   ```bash
   # Install dependencies
   pip install -r backend/requirements.txt

   # Generate demo dataset
   python scripts/generate_dataset.py

   # Train ML models
   $env:PYTHONPATH="."; python scripts/train_models.py

   # Start FastAPI Server
   $env:PYTHONPATH="."; uvicorn backend.app.main:app --reload --port 8000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Option B: Production Docker Compose Setup

Run the entire full-stack application (PostgreSQL + FastAPI + Nginx React Frontend):

```bash
docker compose up --build
```

Access Points:
- **Frontend Dashboard:** `http://localhost:3000`
- **FastAPI Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## 6. API Endpoint Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Application health check |
| `POST` | `/api/data/upload` | Upload CSV measurement logs |
| `POST` | `/api/data/generate-demo` | Generate synthetic demo dataset |
| `GET` | `/api/dashboard/summary` | Executive KPI summary statistics |
| `GET` | `/api/components` | Paginated component search & filtering |
| `GET` | `/api/components/{id}` | Detailed component history & XAI explanations |
| `POST` | `/api/predict` | Real-time single component risk inference |
| `GET` | `/api/models/metrics` | ML training metrics (MAE, RMSE, R²) |

---

## 7. Hybrid Risk Scoring Methodology

The Hybrid Risk Score ($R \in [0, 100]$) combines four statistical dimensions:

$$R = 0.40 \cdot S_{\text{anomaly}} + 0.25 \cdot S_{\text{drift}} + 0.25 \cdot S_{\text{pred}} + 0.10 \cdot S_{\text{lot}}$$

* **$S_{\text{anomaly}}$ (40%):** Normalized Isolation Forest score (0–100).
* **$S_{\text{drift}}$ (25%):** Early drift rate ($\mu\text{A/h}$) and percentage change from 0h.
* **$S_{\text{pred}}$ (25%):** Ratio of predicted 168h value vs. initial baseline.
* **$S_{\text{lot}}$ (10%):** Statistical Z-Score deviation from manufacturing lot mean.

**Risk Classification:**
- `SAFE` (0 – 30 pts): Component within normal lot distribution.
- `MONITOR` (31 – 60 pts): Mild parameter drift; marked for re-testing.
- `HIGH_RISK` (61 – 100 pts): Statistically abnormal or rapidly degrading; quarantined.

---

## 8. Running Automated Tests

Run the Pytest suite to verify feature engineering, risk score boundaries, prediction API, and database operations:

```bash
$env:PYTHONPATH="."; python -m pytest
```

---

## 9. Project Structure

```text
burnguard-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI route handlers
│   │   ├── database/        # SQLAlchemy engine & session setup
│   │   ├── ml/              # Preprocessing, Features, Anomaly, Drift, Risk, XAI
│   │   ├── models/          # Database ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic & prediction manager
│   │   ├── config.py        # Settings configuration
│   │   └── main.py          # FastAPI application entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, KPICard, RiskBadge, DetailModal
│   │   ├── pages/           # Dashboard, Telemetry Explorer, Sandbox, Upload, Analytics
│   │   ├── services/        # Axios API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css        # Tailwind v4 glassmorphism styles
│   ├── Dockerfile
│   └── package.json
├── data/
│   └── raw/                 # Generated/Uploaded CSV datasets
├── models/                  # Saved .joblib model artifacts & metrics.json
├── scripts/
│   ├── generate_dataset.py  # Synthetic data generator
│   └── train_models.py      # ML training & model selection script
├── tests/                   # Pytest test suite
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. License

This project is licensed under the MIT License.
