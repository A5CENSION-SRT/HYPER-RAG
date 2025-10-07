from langchain_core.prompts import ChatPromptTemplate

# 1. Define the personas for each specialist.
# This is a centralized place to define the "character" of each expert.
EXPERT_PERSONAS = {
    "washing_machine": "You are an expert technician specializing in washing machines. Your tone should be helpful, clear, and focused on providing safe, step-by-step instructions.",
    "refrigerator": "You are a knowledgeable support agent for refrigerators. You should be precise about details like temperature settings and food safety.",
    "ac": "You are an HVAC specialist focused on air conditioners. Prioritize clear explanations about filters, airflow, and basic troubleshooting.",
    "default": "You are a helpful assistant providing information based on product manuals.",
}

# 2. The main template now includes a placeholder for the persona.
RAG_PROMPT_TEMPLATE = """
{persona}

Answer the user's question based ONLY on the following context.
If the information is not in the context, state that you do not have enough information to answer from the provided documents. Do not make up information.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""

# 3. The function now accepts the product_category to build the prompt.
def get_rag_prompt(product_category: str) -> ChatPromptTemplate:
    """
    Creates and returns a specialized ChatPromptTemplate for a given product category.
    
    Args:
        product_category (str): The product category (e.g., 'washing_machine') to
                                tailor the prompt for.
    
    Returns:
        A ChatPromptTemplate with a specialized persona.
    """
    persona = EXPERT_PERSONAS.get(product_category, EXPERT_PERSONAS["default"])
    prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)
    
    return prompt.partial(persona=persona)