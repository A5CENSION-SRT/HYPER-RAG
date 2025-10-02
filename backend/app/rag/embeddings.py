from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings

def get_embedding_model():
    """Returns an instance of the Google Generative AI Embeddings model."""
    
    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GOOGLE_API_KEY
    )
    
    return embedding_model
