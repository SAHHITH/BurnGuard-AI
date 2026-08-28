import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

db_url = settings.DATABASE_URL

# Handle Vercel / serverless SQLite read-only filesystem
if db_url.startswith("sqlite"):
    raw_path = db_url.replace("sqlite:///", "")
    # If running on Vercel or target directory is not writable, copy to /tmp
    if os.getenv("VERCEL") or (os.path.exists(raw_path) and not os.access(os.path.dirname(os.path.abspath(raw_path)), os.W_OK)):
        tmp_db_path = "/tmp/burnguard.db"
        if not os.path.exists(tmp_db_path) and os.path.exists(raw_path):
            try:
                shutil.copy2(raw_path, tmp_db_path)
            except Exception as e:
                print(f"[WARNING] Could not copy DB to /tmp: {e}")
        db_url = f"sqlite:///{tmp_db_path}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency generator for FastAPI routes to yield database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
