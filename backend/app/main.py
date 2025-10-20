from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware 
from .core.config import settings
from app.routers import knowledge, chat, health

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for a multi-agent RAG chatbot system."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health.router, tags=["Health"])
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Multi-Agent RAG System API"}