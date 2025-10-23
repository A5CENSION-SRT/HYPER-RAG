from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

# Get the backend directory (parent of app directory)
BACKEND_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None

    SUPERVISOR_MODEL: str = "gemini-2.5-flash"

    SUB_AGENT_MODEL: str = "gemini-2.5-flash"
    WASHING_MACHINE_MODEL: str = "gemini-2.5-flash"
    AC_MODEL: str = "gemini-2.5-flash"
    REFRIGERATOR_MODEL: str = "gemini-2.5-flash"


    #chroma db paths - using absolute paths
    CHROMA_DB_DIR: str = str(BACKEND_DIR / "chroma_dbs")
    CHROMA_DB_DIR_AC: str = str(BACKEND_DIR / "chroma_dbs" / "ac_db")
    CHROMA_DB_DIR_REFRIGERATOR: str = str(BACKEND_DIR / "chroma_dbs" / "refrigerator_db")
    CHROMA_DB_DIR_WASHING_MACHINE: str = str(BACKEND_DIR / "chroma_dbs" / "washing_machine_db")

    #pdf paths - using absolute paths
    PDF_DIR: str = str(BACKEND_DIR / "data" / "manuals")
    PDF_DIR_AC: str = str(BACKEND_DIR / "data" / "manuals" / "ac")
    PDF_DIR_REFRIGERATOR: str = str(BACKEND_DIR / "data" / "manuals" / "refrigerator")
    PDF_DIR_WASHING_MACHINE: str = str(BACKEND_DIR / "data" / "manuals" / "washing_machine")

    #processed docs paths - using absolute paths
    DOCS_DIR: str = str(BACKEND_DIR / "data" / "processed")
    DOCS_DIR_AC: str = str(BACKEND_DIR / "data" / "processed" / "ac")
    DOCS_DIR_REFRIGERATOR: str = str(BACKEND_DIR / "data" / "processed" / "refrigerator")
    DOCS_DIR_WASHING_MACHINE: str = str(BACKEND_DIR / "data" / "processed" / "washing_machine")

    VALID_PRODUCT_TYPES: List[str] = ["washing_machine", "air_conditioner", "refrigerator"]

    # Database configuration - individual components
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "testpassword123"
    POSTGRES_DB: str = "rag_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    
    # Database URL - can be set directly or will be constructed from components above
    DATABASE_URL: Optional[str] = None

    PROJECT_NAME: str = "Multi-Agent RAG Chatbot"

    class Config:
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # If DATABASE_URL is not explicitly set, construct it from components
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

settings = Settings()
