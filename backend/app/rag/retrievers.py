import os
from langchain_chroma import Chroma
from langchain_core.vectorstores import VectorStoreRetriever

from app.core.config import settings
from app.rag.embeddings import get_embedding_model

def get_retriever(product_category: str) -> VectorStoreRetriever:
    """Returns a Chroma retriever for the specified product category."""

    embedding_function = get_embedding_model()

    # Using the dynamic pathing from your config.py is better than a dictionary
    persist_directory = {
        "washing_machine": settings.CHROMA_DB_DIR_WASHING_MACHINE,
        "ac": settings.CHROMA_DB_DIR_AC,
        "refrigerator": settings.CHROMA_DB_DIR_REFRIGERATOR,
    }.get(product_category)

    if not persist_directory:
        raise ValueError(f"Unknown product category provided for retriever: {product_category}")
    
    if not os.path.exists(persist_directory):
        raise FileNotFoundError(f"ChromaDB directory for '{product_category}' not found at {persist_directory}.")

    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_function,
        collection_name=product_category,
    )
    
    # Use MMR (Maximum Marginal Relevance) for better diversity and relevance
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 8,  # Return top 8 results (increased from 5)
            "fetch_k": 20,  # Fetch 20 candidates before MMR selection
            "lambda_mult": 0.7  # Balance between relevance (1.0) and diversity (0.0)
        }
    )