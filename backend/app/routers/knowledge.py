from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json
import asyncio
import logging
from typing import AsyncGenerator

from fastapi.responses import StreamingResponse
from starlette import status

from app.services.ingestion_service import store_process_chunk_ingest
from app.core.config import settings

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Base"]
)   

@router.post("/upload/stream", status_code=status.HTTP_201_CREATED)

async def upload_manual(
    product_type: str = Form(..., description="The type of product"),
    file: UploadFile = File(..., description="The PDF file to upload")
):
    if product_type not in settings.VALID_PRODUCT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product type. Valid types are: {settings.VALID_PRODUCT_TYPES}"
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are accepted."
        )
    
    file_contents = await file.read()

    async def event_generator():
        queue = asyncio.Queue()

        asyncio.create_task(
            store_process_chunk_ingest(
                queue=queue,
                file_name=file.filename,
                file_contents=file_contents,
                product_type=product_type
            )
        )
        
        message_count = 0
        while True:
            try:
                # Wait for message with timeout to send keep-alive
                message = await asyncio.wait_for(queue.get(), timeout=5.0)
                
                if message is None:
                    logger.info(f"[SSE] Stream ending. Sent {message_count} messages.")
                    break

                log_entry = {"status": "processing", "message": str(message)}
                if isinstance(message, str) and message.lower().startswith("error"):
                    log_entry["status"] = "error"
                
                message_count += 1
                logger.info(f"[SSE] Sending message #{message_count}: {log_entry}")
                yield f"data: {json.dumps(log_entry)}\n\n"
                
            except asyncio.TimeoutError:
                # Send keep-alive comment to prevent connection timeout
                logger.debug("[SSE] Sending keep-alive")
                yield ": keep-alive\n\n"
                continue

        final_message = {"status": "complete", "message": "Ingestion stream has finished."}
        yield f"data: {json.dumps(final_message)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")