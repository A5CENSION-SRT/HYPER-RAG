from fastapi import FastAPI
from .core.config import settings
from app.routers import knowledge

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for a multi-agent RAG chatbot system."
)


app.include_router(knowledge.router, prefix="/api/v1")



@app.get("/", tags=["Root"])
async def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the Multi-Agent RAG System API"}