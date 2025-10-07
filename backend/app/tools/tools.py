from langchain_core.tools import tool
from app.rag.chains import create_rag_chain
from app.core.config import settings
from app.rag.retrievers import get_retriever

@tool
def search_knowledge_base(query: str, product_category: str) -> str:
    """
    Use this tool to find information and answer questions about a specific product.
    You must also provide a 'query' which should be a clear, self-contained question.
    """
    print(f"\n--- TOOL: Searching Knowledge Base ---")
    print(f"    Category: {product_category}")
    print(f"    Query: {query}")
    
    if product_category not in settings.VALID_PRODUCT_TYPES:
        return f"Error: Invalid product category '{product_category}'. Valid options are: {settings.VALID_PRODUCT_TYPES}"

    try:
        retriever = get_retriever(product_category=product_category)
        rag_chain = create_rag_chain(retriever=retriever)
        answer = rag_chain.invoke({"question": query})
        print(f"    Answer Found: {answer[:100]}...")
        return answer
        
    except Exception as e:
        print(f"    ERROR in RAG tool: {e}")
        return f"An error occurred while searching the {product_category} knowledge base."