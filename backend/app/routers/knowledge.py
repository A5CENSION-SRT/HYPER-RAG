from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json
import asyncio
import logging
import shutil
from pathlib import Path
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

        task = asyncio.create_task(
            store_process_chunk_ingest(
                queue=queue,
                file_name=file.filename,
                file_contents=file_contents,
                product_type=product_type
            )
        )
        
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
                
                if message is None:
                    break

                log_entry = {"status": "processing", "message": str(message)}
                if isinstance(message, str) and message.lower().startswith("error"):
                    log_entry["status"] = "error"
                
                yield f"data: {json.dumps(log_entry)}\n\n"
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"[SSE] Error in event generator: {e}")
                error_message = {"status": "error", "message": f"Stream error: {str(e)}"}
                yield f"data: {json.dumps(error_message)}\n\n"
                break

        try:
            await task
        except Exception as e:
            logger.error(f"[SSE] Task completed with error: {e}")
            
        final_message = {"status": "complete", "message": "Ingestion complete!"}
        yield f"data: {json.dumps(final_message)}\n\n"

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    
    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers=headers
    )


@router.delete("/vector-db/clear", status_code=status.HTTP_200_OK)
async def clear_all_vector_databases():
    """
    Clear all vector databases (ac_db, washing_machine_db, refrigerator_db).
    This will delete all the data in the ChromaDB collections.
    """
    try:
        deleted_dbs = []
        errors = []
        
        # List of all database directories
        db_paths = [
            (settings.CHROMA_DB_DIR_AC, "ac_db"),
            (settings.CHROMA_DB_DIR_REFRIGERATOR, "refrigerator_db"),
            (settings.CHROMA_DB_DIR_WASHING_MACHINE, "washing_machine_db"),
        ]
        
        for db_path, db_name in db_paths:
            try:
                db_path_obj = Path(db_path)
                if db_path_obj.exists():
                    # Remove the entire directory
                    shutil.rmtree(db_path)
                    # Recreate the empty directory
                    db_path_obj.mkdir(parents=True, exist_ok=True)
                    deleted_dbs.append(db_name)
                    logger.info(f"Successfully cleared {db_name} at {db_path}")
                else:
                    logger.warning(f"{db_name} does not exist at {db_path}")
                    deleted_dbs.append(f"{db_name} (already empty)")
            except Exception as e:
                error_msg = f"Error clearing {db_name}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        if errors:
            return {
                "status": "partial_success",
                "message": "Some databases were cleared, but errors occurred",
                "deleted": deleted_dbs,
                "errors": errors
            }
        
        return {
            "status": "success",
            "message": "All vector databases cleared successfully",
            "deleted": deleted_dbs
        }
        
    except Exception as e:
        logger.error(f"Unexpected error while clearing vector databases: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear vector databases: {str(e)}"
        )