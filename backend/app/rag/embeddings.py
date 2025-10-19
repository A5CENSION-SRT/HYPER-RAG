from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings

def get_embedding_model():
    """
    Returns a local HuggingFace embedding model.
    
    Options:
    - all-MiniLM-L6-v2: Fast, good quality (384 dimensions) - DEFAULT
    - all-mpnet-base-v2: Better quality, slower (768 dimensions)
    - BAAI/bge-large-en-v1.5: Best quality, slowest (1024 dimensions)
    """
    
    # Using a strong local model that runs on CPU/GPU
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},  # Change to 'cuda' if you have GPU
        encode_kwargs={'normalize_embeddings': True}  # For better similarity scores
    )
    
    return embedding_model
