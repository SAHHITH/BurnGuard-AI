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

* **Synthetic Burn-In Data Generator:** Generates multi-lot semiconductor screening logs with normal thermal stabilization, slow drifters, rapid degradation, and baseline anomalies.
* **Dynamic Anomaly Detection:** Compares Isolation Forest against Local Outlier Factor (LOF) and One-Class SVM.
* **168h Failure Forecast:** Regression models (Linear, Random Forest, Gradient Boosting) predicting future degradation values using early 0h–24h telemetry.
* **Hybrid Risk Score (0–100):** Configurable weighted engine classifying units into `SAFE` (0–30), `MONITOR` (31–60), and `HIGH_RISK` (61–100).
* **Explainable AI (XAI):** SHAP feature contribution charts + human-readable diagnostic reasons for quality assurance engineers.
* **FastAPI REST Backend:** OpenAPI specification, PostgreSQL persistence, real-time single component prediction endpoint.
* **Modern Command Center UI:** Interactive React 19 + TypeScript + Recharts + Tailwind CSS frontend with light/dark/system theme modes, parameter drift scatter space, signal timelines, and realtime inference sandbox.

---

## 4. Technology Stack

* **ML / Data Science:** Python 3.11+, Scikit-Learn, Pandas, NumPy, Joblib, SHAP
* **Backend:** FastAPI, Pydantic v2, SQLAlchemy, Uvicorn
* **Database:** PostgreSQL 15 / SQLite
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
* **Deployment:** Vercel (Unified React + FastAPI Serverless), Docker, Docker Compose

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
   pip install -r requirements.txt

   # Start FastAPI Backend Server
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```

3. **Frontend Setup:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173` in your browser.

---

### Option B: Deploying BurnGuard AI on Vercel

The application is fully configured to deploy both the **React/Vite frontend** and **FastAPI Python backend** as a single Vercel project.

#### Deployment Steps

1. **Push Project to GitHub:**

   ```bash
   git add .
   git commit -m "Configure BurnGuard AI for Vercel deployment"
   git push origin main
   ```

2. **Import Repository into Vercel:**
   * Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**.
   * Select your `BurnGuard-AI` GitHub repository.

3. **Project Settings Configuration:**
   * **Framework Preset:** `Vite` (or `Other`).
   * **Root Directory:** `./` (Leave default as root).
   * **Build & Development Settings:** Vercel automatically uses `vercel.json` to handle Python serverless API build (`@vercel/python`) and Vite static site build (`@vercel/static-build`).

4. **Environment Variables:**
   Add the following environment variables in the Vercel Dashboard (**Settings** → **Environment Variables**):
   * `VITE_API_URL` = `/api`
   * `DATABASE_URL` = `postgresql://user:password@your-postgres-host:5432/burnguard_db` *(Optional: If omitted, automatically uses SQLite `/tmp/burnguard.db` fallback)*

5. **Deploy & Test:**
   * Click **Deploy**.
   * Once build completes, test health endpoint: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/health`.
   * Verify response:

     ```json
     {
       "status": "healthy",
       "project": "BurnGuard AI",
       "version": "1.0.0"
     }
     ```

   * Access frontend dashboard at `https://YOUR-VERCEL-DOMAIN.vercel.app`.

6. **Continuous Deployment:**
   * Any future commits pushed to `main` branch will automatically trigger automated production builds on Vercel.

---

### Option C: Production Docker Compose Setup

Run the full application using Docker Compose:

```bash
docker compose up --build
```

Access Points:

* **Frontend Dashboard:** `http://localhost:3000`
* **FastAPI Documentation:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/health`

---

## 6. API Endpoint Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Application health check |
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

---

## 8. Project Structure

```text
BurnGuard-AI/
├── api/
│   └── index.py             # Vercel FastAPI Serverless Entrypoint
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
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, KPICard, RiskBadge, DetailModal, HealthGauge, ScatterPlot
│   │   ├── pages/           # Dashboard, Telemetry Explorer, Sandbox, Upload, Analytics
│   │   ├── services/        # Axios API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css        # Glassmorphism & PCB theme styles
│   ├── package.json
│   └── vite.config.ts       # Vite configuration & dev proxy
├── data/
│   └── raw/                 # Generated/Uploaded CSV datasets
├── models/                  # Saved .joblib model artifacts & metrics.json
├── requirements.txt         # Root Python requirements for Vercel
├── vercel.json              # Vercel unified frontend + serverless build routing
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 9. License

This project is licensed under the MIT License.
