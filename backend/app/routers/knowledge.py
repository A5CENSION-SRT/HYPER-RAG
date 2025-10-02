from fastapi import APIRouter,UploadFile, File,Form, HTTPException, Status 
import json 
import asyncio
from typing import AsyncGenerator

from fastapi.responses import StreamingResponse

from app.services.ingestion_service import store_process_chunk_ingest



router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Base"]
)   

@router.post("/upload", 
            status_code=Status.HTTP_201_CREATED)
async def upload_manual(
    product_type: str = Form(..., description="The type of product"),
    file: UploadFile = File(..., description="The PDF file to upload")
):
    if product_type not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=Status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product type. Valid types are: {VALID_CATEGORIES}"
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=Status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are accepted."
        )
    
    