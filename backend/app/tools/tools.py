from langchain_core.tools import tool

@tool
def query_washing_machine_knowledge_base(question: str) -> str:
    """Use this tool for any questions about washing machines."""
    print("--- Called Washing Machine Tool ---")
    return f"This is a placeholder answer about washing machines regarding: '{question}'"

@tool
def query_refrigerator_knowledge_base(question: str) -> str:
    """Use this tool for any questions about refrigerators."""
    print("--- Called Refrigerator Tool ---")
    return f"This is a placeholder answer about refrigerators regarding: '{question}'"

@tool
def query_ac_knowledge_base(question: str) -> str:
    """Use this tool for any questions about air conditioners."""
    print("--- Called AC Tool ---")
    return f"This is a placeholder answer about air conditioners regarding: '{question}'"

