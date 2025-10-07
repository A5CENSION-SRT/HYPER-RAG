import os
from langchain_chroma import Chroma
from langchain_core.vectorstores import VectorStore

from app.core.config import settings
from app.rag.embeddings import get_embedding_model

def get_retriever(product_type: str) -> VectorStore:
    """Returns a Chroma retriever for the specified product type."""

    embedding_model = get_embedding_model()

    chroma_db_path = {
        "washing_machine": settings.CHROMA_DB_DIR_WASHING_MACHINE,
        "ac": settings.CHROMA_DB_DIR_AC,
        "refrigerator": settings.CHROMA_DB_DIR_REFRIGERATOR,
    }.get(product_type)

    if not chroma_db_path:
        raise ValueError(f"Unknown product type: {product_type}")

    vectorstore = Chroma(
        persist_directory=chroma_db_path,
        embedding_function=embedding_model,
        collection_name=product_type,
    )
    return vectorstore.as_retriever(search_kwargs={"k": 5})