FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend code, ML modules, scripts, and initial data
COPY backend ./backend
COPY scripts ./scripts
COPY data ./data

# Create directory for models if missing
RUN mkdir -p models

# Environment variables
ENV PYTHONPATH=.
ENV PORT=8000
ENV DATABASE_URL=postgresql://burnguard:burnguard123@db:5432/burnguard_db

EXPOSE 8000

# Run model training on first startup if missing, then start FastAPI server
CMD python scripts/generate_dataset.py && python scripts/train_models.py && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
