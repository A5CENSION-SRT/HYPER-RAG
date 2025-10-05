import os
from langchain_chroma import Chroma
from langchain_core.vectorstores import VectorStore

from app.core.config import settings
from app.rag.embeddings import get_embedding_model

def get_retriver(product_type: str) -> VectorStore:
    """Returns a Chroma retriever for thef
