from fastapi import FastAPI
from .core.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for a multi-agent RAG chatbot system."
)

