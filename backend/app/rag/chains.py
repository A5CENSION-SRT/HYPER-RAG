from operator import itemgetter
from langchain_core.runnables import Runnable
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

from app.rag.prompts import get_rag_prompt
from app.rag.generators import get_rag_model

def format_docs(docs: list[Document]) -> str:
    """Joins the content of retrieved documents into a single string."""
    return "\n\n".join(doc.page_content for doc in docs)

def create_rag_chain(retriever: Runnable) -> Runnable:
    """
    Creates a complete, non-citable RAG chain using LCEL.
    This chain forms the core logic of our RAG tool.
    """
    prompt = get_rag_prompt()
    llm = get_rag_model()

    rag_chain = (
        {
            "context": itemgetter("question") | retriever | format_docs,
            "question": itemgetter("question"),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain