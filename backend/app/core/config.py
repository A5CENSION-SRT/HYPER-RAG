from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None

    SUPERVISOR_MODEL: str = "gemini-2.5-flash"

    SUB_AGENT_MODEL: str = "gemini-2.5-pro"
    WASHING_MACHINE_MODEL: str = "gemini-2.5-pro"
    AC_MODEL: str = "gemini-2.5-pro"
    REFRIGERATOR_MODEL: str = "gemini-2.5-pro"


    #chroma db paths 
    CHROMA_DB_DIR: str = "chroma_dbs"
    CHROMA_DB_DIR_AC: str = "chroma_dbs/ac_db"
    CHROMA_DB_DIR_REFRIGERATOR: str = "chroma_dbs/refrigerator_db"
    CHROMA_DB_DIR_WASHING_MACHINE: str = "chroma_dbs/washing_machine_db"

    #pdf paths
    PDF_DIR: str = "data/manuals"
    PDF_DIR_AC: str = "data/manuals/ac"
    PDF_DIR_REFRIGERATOR: str = "data/manuals/refrigerator"
    PDF_DIR_WASHING_MACHINE: str = "data/manuals/washing_machine"

    #processed docs paths
    DOCS_DIR: str = "data/processed"
    DOCS_DIR_AC: str = "data/processed/ac"
    DOCS_DIR_REFRIGERATOR: str = "data/processed/refrigerator"
    DOCS_DIR_WASHING_MACHINE: str = "data/processed/washing_machine"

    VALID_PRODUCT_TYPES: List[str] = ["washing_machine", "ac", "refrigerator"]

    DATABASE_URL: str = "postgresql://postgres:testpassword123@localhost:5432/rag_db"

    PROJECT_NAME: str = "Multi-Agent RAG Chatbot"

    class Config:
        # Look for .env file in the backend directory
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = "utf-8"

settings = Settings()
