from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.database.database import get_db

router = APIRouter(tags=["Health Check"])

logger = logging.getLogger(__name__)

@router.get("/health", summary="Perform a comprehensive health check", status_code=status.HTTP_200_OK)
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        logger.info("Health check successful: API is running and DB is connected.")
        return {
            "api_status": "ok",
            "database_status": "ok",
            "message": "All services are operational."
        }
    except Exception as e:
        logger.error(f"Health check failed: Database connection error. Details: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "api_status": "ok",
                "database_status": "error",
                "message": "API is running, but the database connection has failed.",
                "error_details": str(e),
            },
        )