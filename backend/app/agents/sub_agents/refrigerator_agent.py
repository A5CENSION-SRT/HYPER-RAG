from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from app.agents.state import AgentState
from app.rag.generators import get_sub_agent_model
from app.tools.rag_search_tool import retrieve_knowledge

tools = [retrieve_knowledge]
tool_node = ToolNode(tools)
sub_agent_model = get_sub_agent_model()

system_prompt = (
    "You are a specialized assistant and expert for all questions related to refrigerators. "
    "Your primary function is to provide accurate information by searching the knowledge base. "
    "When you use the 'retrieve-knowledge' tool, you MUST set the 'product_category' argument to 'refrigerator'. "
    "Do not answer questions about other products like air conditioners or washing machines."
)

model_with_tools = sub_agent_model.bind_tools(tools, system_message=system_prompt)

def agent_node(state: AgentState):
    """
    The 'thinking' node of the sub-agent. It calls the LLM to decide the next action.
    """
    print("REFRIGERATOR SUB-AGENT")
    response = model_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState):
    """
    Determines if the sub-agent should continue processing or terminate.
    The sub-agent continues until the LLM indicates it is done.
    """
    if state["messages"][-1].tool_calls:
        return "continue_to_tools" 
    else:
        print("REFRIGERATOR SUB-AGENT DONE")
        return "end_agent_turn"

workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges("agent",
        should_continue, {
            "continue_to_tools": "tools",
            "end_agent_turn": END
        }
)

workflow.add_edge("tools", "agent")

refrigerator_agent = workflow.compile()
