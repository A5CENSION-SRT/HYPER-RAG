from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None

    ROUTER_MODEL: str = "gemini-2.5-flash"

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

    #processed langchain docs paths
    DOCS_DIR: str = "data/processed"
    DOCS_DIR_AC: str = "data/processed/ac"
    DOCS_DIR_REFRIGERATOR: str = "data/processed/refrigerator"
    DOCS_DIR_WASHING_MACHINE: str = "data/processed/washing_machine"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
