import os
import logging 
from pathlib import Path
import asyncio
from asyncio import Queue

from app.core.config import settings
from app.rag.parsers import process_pdf,chunk_documents
from app.rag.embeddings import get_embedding_model
from langchain.vectorstores import Chroma


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def store_process_chunk_ingest(
        queue: Queue,
        file_name: str,
        file_contents: bytes,
        product_type: str
):
    """async function to store, process, chunk, and ingest a PDF file.
    
    This function is designed to be run as a background task by the API endpoint.

    Args:
        queue (Queue): An asyncio Queue to which progress messages are sent.
        file_name (str): The original name of the uploaded PDF file.
        file_contents (bytes): The binary content of the PDF file.
        product_type (str): The type of product (e.g., 'washing_machine', 'ac', 'refrigerator').
    """
    
    try:
        await queue.put("Starting PDF storage...")
        # Step 1: Store the PDF
        storage_dir = {
            "washing_machine": settings.PDF_DIR_WASHING_MACHINE,
            "ac": settings.PDF_DIR_AC,
            "refrigerator": settings.PDF_DIR_REFRIGERATOR
        }.get(product_type)

        os.makedirs(storage_dir, exist_ok=True)
        stored_pdf_path = os.path.join(storage_dir, file_name)

        with open(stored_pdf_path, "wb") as f:
            f.write(file_contents)
            
        logger.info(f"Stored PDF at {stored_pdf_path}")
        await queue.put(f"PDF stored at {stored_pdf_path}")
        await asyncio.sleep(0.1) # Yield control briefly

        # Step 2: Process the PDF
        await queue.put("Starting PDF processing...")
        documents = process_pdf(stored_pdf_path)
        logger.info(f"Extracted {len(documents)} document elements from PDF.")
        await queue.put(f"Extracted {len(documents)} document elements from PDF.")
        await asyncio.sleep(0.1) # Yield control briefly
        if not documents:
            raise ValueError("No content extracted from PDF. Please check the file.")

        # Step 3: Chunk the documents
        await queue.put("Starting document chunking...")
        chunked_docs = chunk_documents(documents)
        logger.info(f"Created {len(chunked_docs)} chunks from PDF documents.")
        await queue.put(f"Created {len(chunked_docs)} chunks from PDF documents.")
        await asyncio.sleep(0.1) # Yield control briefly
        if not chunked_docs:
            raise ValueError("Document chunking resulted in zero chunks. Please check the content.")
        
        # Step 4: embed the chunks and injest into vector DB
        await queue.put("Starting embedding and ingestion...")
        embedding_model = get_embedding_model()
        persist_directory = {
            "washing_machine": settings.CHROMA_DB_DIR_WASHING_MACHINE,
            "ac": settings.CHROMA_DB_DIR_AC,
            "refrigerator": settings.CHROMA_DB_DIR_REFRIGERATOR
        }.get(product_type, settings.CHROMA_DB_DIR)
        
        logger.info(f"Using persist directory: {persist_directory}")
        os.makedirs(persist_directory, exist_ok=True)

        vector_store = Chroma.from_documents(
            documents=chunked_docs,
            embedding=embedding_model,
            persist_directory=persist_directory
        )
        vector_store.persist()
        logger.info(f"Persisted vector store with {len(chunked_docs)} documents to {persist_directory}")
        await queue.put(f"Persisted vector store with {len(chunked_docs)} documents.")
        await asyncio.sleep(0.1) # Yield control briefly
        await queue.put("Ingestion complete.")
    except Exception as e:
        logger.error(f"Error during ingestion process: {e}", exc_info=True)
        await queue.put(f"Error: {e}")
    finally:
        await queue.put(None)




        



        
