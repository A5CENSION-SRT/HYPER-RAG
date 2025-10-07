from typing import List
from langchain_core.documents import Document

def format_docs(docs: List[Document]) -> str:
    """
    A helper utility that takes a list of LangChain Document objects and
    formats their page_content into a single string, separated by newlines.
    This prepares the retrieved context to be easily readable by an LLM.
    """
    return "\n\n".join(doc.page_content for doc in docs)