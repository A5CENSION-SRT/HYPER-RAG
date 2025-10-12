from langchain_core.tools import tool
from langchain_core.messages import AIMessage, HumanMessage

from app.agents.sub_agents.ac_agent import ac_agent
from app.agents.sub_agents.refrigerator_agent import refrigerator_agent
from app.agents.sub_agents.washing_machine_agent import washing_machine_agent

@tool
def washing_machine_expert_agent(question: str) -> str:
    """
    Use this tool when you need to answer any complex questions or handle user
    queries related to washing machines.
    """
    print("\nDelegating to Washing Machine Expert ---")
    initial_state = {"messages": [HumanMessage(content=question)]}
    final_state = washing_machine_agent.invoke(initial_state, {"recursion_limit": 10})
    final_answer = final_state['messages'][-1].content

    return final_answer

@tool
def ac_expert_agent(question: str) -> str:
    """
    Use this tool when you need to answer any complex questions or handle user
    queries related to air conditioners (AC).
    """
    print("\nDelegating to AC Expert ---")
    initial_state = {"messages": [HumanMessage(content=question)]}
    final_state = ac_agent.invoke(initial_state, {"recursion_limit": 10})
    final_answer = final_state['messages'][-1].content

    return final_answer

@tool
def refrigerator_expert_agent(question: str) -> str:
    """
    Use this tool when you need to answer any complex questions or handle user
    queries related to refrigerators.
    """
    print("\nDelegating to Refrigerator Expert ---")
    initial_state = {"messages": [HumanMessage(content=question)]}
    final_state = refrigerator_agent.invoke(initial_state, {"recursion_limit": 10})
    final_answer = final_state['messages'][-1].content

    return final_answer

supervisor_tools = [
    washing_machine_expert_agent,
    ac_expert_agent,
    refrigerator_expert_agent
]