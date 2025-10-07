from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings

def get_sub_agent_model() -> ChatGoogleGenerativeAI:
    """
    Initializes the LLM for a specialist sub-agent.
    This SINGLE model is responsible for BOTH:
    1. Deciding which low-level tools to call (like the retriever).
    2. Synthesizing the final answer after receiving the tool's output.
    """    

    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set in the environment.")
    
    llm = ChatGoogleGenerativeAI(
        model=settings.SUB_AGENT_MODEL,
        temperature=0.1,
        google_api_key=settings.GOOGLE_API_KEY,
        convert_system_message_to_human=True
    )
    
    return llm

def get_supervisor_model() -> ChatGoogleGenerativeAI:
    """
    Initializes the LLM for the main Supervisor agent.
    This model is responsible for delegating tasks to sub-agents.
    """

    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not set in the environment.")

    llm = ChatGoogleGenerativeAI(
        model=settings.SUPERVISOR_MODEL,
        temperature=0.3,
        google_api_key=settings.GOOGLE_API_KEY,
        convert_system_message_to_human=True
    )
    return llm
