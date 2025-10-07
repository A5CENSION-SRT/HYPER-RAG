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
        await queue.put(f"PDF stored successfully")
        await asyncio.sleep(0.1) # Yield control briefly

        # Step 2: Process the PDF (run in thread to avoid blocking event loop)
        await queue.put("Starting PDF processing...")
        await queue.put("Loading BLIP model for image captioning... This may take a moment on first run.")
        documents = await asyncio.to_thread(process_pdf, stored_pdf_path)
        logger.info(f"Extracted {len(documents)} document elements from PDF.")
        await queue.put(f"Extracted {len(documents)} document elements")
        if not documents:
            raise ValueError("No content extracted from PDF. Please check the file.")
        
        #step 2.5: Save processed documents for debugging - RAW STRUCTURE
        processed_dir = {
            "washing_machine": settings.DOCS_DIR_WASHING_MACHINE,
            "ac": settings.DOCS_DIR_AC,
            "refrigerator": settings.DOCS_DIR_REFRIGERATOR
        }.get(product_type, settings.DOCS_DIR)
        os.makedirs(processed_dir, exist_ok=True)
        processed_file_path = os.path.join(processed_dir, f"{Path(file_name).stem}_processed_raw.txt")
        
        with open(processed_file_path, "w", encoding="utf-8") as f:
            f.write(f"="*80 + "\n")
            f.write(f"RAW PROCESSED DOCUMENTS - BEFORE CHUNKING\n")
            f.write(f"Total Documents: {len(documents)}\n")
            f.write(f"="*80 + "\n\n")
            
            for idx, doc in enumerate(documents, 1):
                f.write(f"\n{'='*80}\n")
                f.write(f"DOCUMENT #{idx}\n")
                f.write(f"{'='*80}\n")
                
                # Show the document type/class
                f.write(f"Type: {type(doc).__name__}\n")
                f.write(f"Module: {type(doc).__module__}\n\n")
                
                # If it's a LangChain Document object, show all attributes
                if hasattr(doc, '__dict__'):
                    f.write(f"--- ALL ATTRIBUTES ---\n")
                    for key, value in doc.__dict__.items():
                        f.write(f"{key}: {value}\n")
                    f.write("\n")
                
                # Show page_content (the actual text)
                if hasattr(doc, 'page_content'):
                    f.write(f"--- PAGE CONTENT (TEXT) ---\n")
                    f.write(f"{doc.page_content}\n\n")
                
                # Show metadata
                if hasattr(doc, 'metadata'):
                    f.write(f"--- METADATA ---\n")
                    for key, value in doc.metadata.items():
                        f.write(f"  {key}: {value}\n")
                    f.write("\n")
                
                # Fallback: if it's just a string or other type
                if isinstance(doc, str):
                    f.write(f"--- RAW STRING CONTENT ---\n")
                    f.write(f"{doc}\n\n")
                
                f.write(f"\n")
        
        logger.info(f"Saved RAW processed documents to {processed_file_path}")  


        # Step 3: Chunk the documents (run in thread to avoid blocking)
        await queue.put("Starting document chunking...")
        chunked_docs = await asyncio.to_thread(chunk_documents, documents
        logger.info(f"Created {len(chunked_docs)} chunks from PDF documents.")
        await queue.put(f"Created {len(chunked_docs)} text chunks")
        if not chunked_docs:
            raise ValueError("Document chunking resulted in zero chunks. Please check the content.")
        
        # Step 4: embed the chunks and injest into vector DB (run in thread)
        await queue.put("Starting embedding and ingestion...")
        await queue.put("Creating embeddings using Gemini API...")
        
        embedding_model = get_embedding_model()
        persist_directory = {
            "washing_machine": settings.CHROMA_DB_DIR_WASHING_MACHINE,
            "ac": settings.CHROMA_DB_DIR_AC,
            "refrigerator": settings.CHROMA_DB_DIR_REFRIGERATOR
        }.get(product_type, settings.CHROMA_DB_DIR)
        
        logger.info(f"Using persist directory: {persist_directory}")
        os.makedirs(persist_directory, exist_ok=True)

        # Run embedding and Chroma operations in thread to avoid blocking
        def create_vector_store():
            return Chroma.from_documents(
                documents=chunked_docs,
                embedding=embedding_model,
                persist_directory=persist_directory,
                collection_name=product_type
            )
        
        vector_store = await asyncio.to_thread(create_vector_store)
        await queue.put(f"Successfully embedded {len(chunked_docs)} chunks")
        
        logger.info(f"Persisted vector store with {len(chunked_docs)} documents to {persist_directory}")
        await queue.put(f"Vector database updated successfully")
    except Exception as e:
        logger.error(f"Error during ingestion process: {e}", exc_info=True)
        await queue.put(f"Error: {e}")
    finally:
        await queue.put(None)




        



        
