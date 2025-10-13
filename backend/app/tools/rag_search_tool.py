from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.rag.retrievers import get_retriever
from app.rag.chains import format_docs 

class RagSearchInput(BaseModel):
    query: str = Field(description="The specific question to ask the knowledge base.")
    product_category: str = Field(
        description="The category of the product. Must be one of 'washing_machine', 'refrigerator', or 'ac'."
    )

@tool("retrieve-knowledge", args_schema=RagSearchInput)
def retrieve_knowledge(query: str, product_category: str) -> str:
    """
    Retrieves factual information from the knowledge base for a specific product category.
    Use this to gather context before answering a question.
    """
    print(f"\n--- 🛠️ TOOL: retrieve_knowledge ---")
    print(f"    Category: {product_category}")
    print(f"    Query: {query}")

    try:
        # 1. Get the specific retriever.
        retriever = get_retriever(product_category=product_category)
        
        # 2. Invoke the retriever to get the documents.
        retrieved_docs = retriever.invoke(query)
        
        # 3. Format the documents into a single string context.
        context = format_docs(retrieved_docs)
        
        print(f"    ✅ Context Retrieved: {context}...")
        return context
        
    except Exception as e:
        print(f"    ❌ ERROR in retrieval tool: {e}")
        return f"An error occurred while retrieving from the {product_category} knowledge base."