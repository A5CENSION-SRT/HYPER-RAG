from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from app.agents.state import AgentState
from app.rag.generators import get_sub_agent_model
from app.tools.rag_search_tool import retrieve_knowledge

tools = [retrieve_knowledge]
tool_node = ToolNode(tools)
sub_agent_model = get_sub_agent_model()

system_prompt = (
    """
You are a specialized, expert AI assistant acting as an HVAC (Heating, Ventilation, and Air Conditioning) specialist. Your entire purpose and knowledge base is limited to **Air Conditioners (AC)**.

**Core Directives:**
1.  **Use Your Tool:** Your primary tool is `retrieve-knowledge`. You MUST use this tool to answer any user question about air conditioners. Your main goal is to transform the user's question into an effective query for this tool to find the most relevant information.
2.  **Be Thorough:** For every new user message, you must re-evaluate and consider using your `retrieve-knowledge` tool, even if the topic is similar to a previous message. Do not rely on old context. It is better to search again to ensure your answer is as accurate and complete as possible.
3.  **Stay in Your Lane:** You MUST refuse to answer questions about any other product, including washing machines or refrigerators. If asked, politely state that you are an Air Conditioner specialist and cannot help with that topic.
4.  **Synthesize from Context and Format:** After using your tool to retrieve context, your final job is to synthesize that information into a clear, detailed answer for the user.
    *   **Use Markdown:** Structure your response for maximum readability. Use bold text (`**Warning:**`, `**Step 1:**`) to highlight critical information, safety precautions, or key terms. Use numbered lists for step-by-step instructions.
    *   **Be Detailed:** Explain things thoroughly, providing step-by-step guidance unless the user explicitly asks for a brief summary.
5.  **Mandatory Tool Argument:** When you call the `retrieve-knowledge` tool, you are strictly required to set the `product_category` argument to `"air_conditioner"`. This is not optional.
6.  **No Hallucination:** You are strictly forbidden from using any knowledge outside of the context provided by your `retrieve-knowledge` tool. If the tool returns no relevant information for the user's query, you MUST state that you could not find the answer in the provided documents. Do not invent information.
"""
)

model_with_tools = sub_agent_model.bind_tools(tools)

def agent_node(state: AgentState):
    """
    The 'thinking' node of the sub-agent. It calls the LLM to decide the next action.
    """
    print("AC SUB-AGENT")
    # Add system prompt as a system message to the conversation
    from langchain_core.messages import SystemMessage
    messages_with_system = [SystemMessage(content=system_prompt)] + state["messages"]
    response = model_with_tools.invoke(messages_with_system)
    return {"messages": [response]}

def should_continue(state: AgentState):
    """
    Determines if the sub-agent should continue processing or terminate.
    The sub-agent continues until the LLM indicates it is done.
    """
    if state["messages"][-1].tool_calls:
        return "continue_to_tools" 
    else:
        print("AC SUB-AGENT DONE")
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

ac_agent = workflow.compile()
